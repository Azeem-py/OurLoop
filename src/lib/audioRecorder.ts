// Reliable voice note recorder using MediaRecorder API with live volume analysis

export class VoiceRecorderManager {
  private stream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private audioCtx: AudioContext | null = null;
  private animFrameId: number | null = null;
  private mimeType: string = "audio/webm";

  async start(onVolumeChange?: (volume: number) => void): Promise<void> {
    this.chunks = [];

    // Get mic stream – this is the user gesture that Chrome needs
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    this.stream = stream;
    this.startTime = Date.now();

    // ── Volume analyser (separate from recording, just for the UI waveform) ──
    if (onVolumeChange) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        // Resume in case the browser started it suspended
        if (this.audioCtx.state === "suspended") {
          await this.audioCtx.resume();
        }

        const source = this.audioCtx.createMediaStreamSource(stream);
        const analyser = this.audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.3;
        
        // Connect to a 0-gain node into destination so the Web Audio graph is kept active
        // without any sound leaking to the speakers
        const silentNode = this.audioCtx.createGain();
        silentNode.gain.value = 0;
        source.connect(analyser);
        analyser.connect(silentNode);
        silentNode.connect(this.audioCtx.destination);

        const dataArr = new Uint8Array(analyser.frequencyBinCount);
        const measure = () => {
          analyser.getByteFrequencyData(dataArr);
          let sum = 0;
          for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
          const vol = Math.min(100, Math.round((sum / dataArr.length / 128) * 100));
          onVolumeChange(vol);
          this.animFrameId = requestAnimationFrame(measure);
        };
        measure();
      } catch (e) {
        console.warn("VoiceRecorder: analyser setup failed", e);
      }
    }

    // ── Pick the best supported MIME type ──
    this.mimeType =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

    const opts: MediaRecorderOptions = {
      mimeType: this.mimeType,
      audioBitsPerSecond: 64_000,
    };

    this.mediaRecorder = new MediaRecorder(stream, opts);

    // Collect chunks every 100 ms so we never lose data
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder error:", e);
    };

    this.mediaRecorder.start(100); // timeslice = 100 ms
  }

  /** Stop recording and return the audio blob + duration in seconds. */
  async stop(): Promise<{ blob: Blob; duration: number }> {
    const mr = this.mediaRecorder;
    const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    if (!mr || mr.state === "inactive") {
      this.cleanup();
      return { blob: new Blob([], { type: this.mimeType }), duration };
    }

    return new Promise((resolve) => {
      mr.addEventListener(
        "stop",
        () => {
          const blob = new Blob(this.chunks, { type: this.mimeType });
          this.cleanup();
          resolve({ blob, duration });
        },
        { once: true }
      );

      mr.stop(); // triggers final ondataavailable, then 'stop'
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.ondataavailable = null; // discard chunks
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close();
    }
    this.audioCtx = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
