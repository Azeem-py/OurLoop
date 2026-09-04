"use client";

import { useState, useRef } from "react";
import { Mic, Loader2, Send, AlertCircle } from "lucide-react";
import { VoiceRecorderManager } from "@/lib/audioRecorder";

interface VoiceRecorderProps {
  onSendVoiceNote: (audioUrl: string, durationSec: number) => Promise<void>;
}

export function VoiceRecorder({ onSendVoiceNote }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [uploading, setUploading] = useState(false);

  const managerRef = useRef<VoiceRecorderManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  async function startRecording() {
    try {
      const manager = new VoiceRecorderManager();
      managerRef.current = manager;

      await manager.start((vol) => {
        setVolume(vol);
      });

      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Please allow microphone permissions to record voice notes.");
    }
  }

  async function stopAndSendRecording() {
    const manager = managerRef.current;
    if (!manager || !isRecording) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setUploading(true);

    try {
      // stop() is async – waits for final MediaRecorder 'stop' event with all chunks
      const { blob, duration: finalDuration } = await manager.stop();

      // Derive extension from the actual blob MIME type
      const ext = blob.type.includes("ogg")
        ? ".ogg"
        : blob.type.includes("mp4")
        ? ".m4a"
        : ".webm";

      const formData = new FormData();
      formData.append("file", blob, `voice-note-${Date.now()}${ext}`);
      formData.append("bucket", "voice-notes");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        await onSendVoiceNote(url, finalDuration);
      } else {
        console.error("Upload failed");
      }
    } catch (err) {
      console.error("Failed to process voice note:", err);
    } finally {
      setUploading(false);
      setDuration(0);
      setVolume(0);
      managerRef.current = null;
    }
  }

  function cancelRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (managerRef.current) {
      managerRef.current.cancel();
      managerRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
    setVolume(0);
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#FF8965] px-3 py-2 bg-[#19162B] rounded-2xl border border-[#322B54]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Sending voice note...</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center justify-between w-full bg-[#19162B] border border-[#FF8965]/40 rounded-2xl px-3 py-1.5 shadow-lg animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-mono text-[#F7F1E8] font-bold">
            {formatSeconds(duration)}
          </span>

          {/* Real-time volume waveform visualization */}
          <div className="flex items-center gap-0.5 h-4 px-1">
            {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8].map((factor, i) => {
              const h = Math.max(15, Math.min(100, Math.round(volume * factor * 2)));
              return (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-1 bg-[#FF8965] rounded-full transition-all duration-75"
                />
              );
            })}
          </div>

          {volume === 0 && duration > 1 && (
            <span className="text-[10px] text-amber-300 flex items-center gap-0.5 animate-pulse">
              <AlertCircle className="w-3 h-3" /> Speak up
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cancelRecording}
            className="text-[11px] text-[#9C93B8] hover:text-white px-2 py-1 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={stopAndSendRecording}
            className="w-8 h-8 rounded-full bg-[#FF8965] hover:bg-[#F2734C] flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className="p-2.5 rounded-2xl bg-[#322B54] hover:bg-[#322B54]/80 text-[#FF8965] transition-colors"
      title="Record Voice Note"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
