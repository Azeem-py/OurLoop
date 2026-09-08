"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Check, AlertCircle, Sparkles } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Take a Photo",
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [flash, setFlash] = useState(false);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  // Check if multiple cameras are available
  useEffect(() => {
    async function checkDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        // Ignore device enumeration errors
      }
    }
    if (isOpen) {
      checkDevices();
    }
  }, [isOpen]);

  // Start webcam stream
  useEffect(() => {
    if (!isOpen || capturedPreview) return;

    let isMounted = true;

    async function startCamera() {
      setIsStarting(true);
      setCameraError(null);
      try {
        // Stop existing stream if any
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Live camera streaming is not supported on this browser/device. Please tap below to snap or choose a photo via your native camera.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Camera access error:", err);
        const errMessage =
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera permission was denied. Please enable camera access in your browser settings."
            : "Could not access camera. Make sure no other app is using it.";
        setCameraError(errMessage);
      } finally {
        if (isMounted) {
          setIsStarting(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode, capturedPreview]);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function handleClose() {
    stopStream();
    setCapturedBlob(null);
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
      setCapturedPreview(null);
    }
    setCameraError(null);
    onClose();
  }

  function handleCapture() {
    if (!videoRef.current) return;

    // Flash animation
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // If using selfie front camera, mirror horizontally for natural feel
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedPreview(url);
        stopStream();
      },
      "image/jpeg",
      0.92
    );
  }

  function handleRetake() {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCapturedBlob(null);
    setCapturedPreview(null);
  }

  function handleConfirm() {
    if (!capturedBlob) return;
    const filename = `photo-${Date.now()}.jpg`;
    const file = new File([capturedBlob], filename, { type: "image/jpeg" });
    onCapture(file);
    handleClose();
  }

  function handleFallbackFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      handleClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#171520] border border-[#292536] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Shutter flash overlay */}
        {flash && <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none" />}

        {/* Top Header */}
        <div className="p-4 border-b border-[#242031] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#E26D54]/15 flex items-center justify-center text-[#E26D54]">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#F6F3EE]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-[#9992A8] hover:text-[#F6F3EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Preview Box */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            // Captured preview photo
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedPreview}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            // Error state
            <div className="p-6 text-center max-w-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200 font-medium mb-1">Camera Unavailable</p>
              <p className="text-[11px] text-[#9992A8] mb-4 leading-relaxed">{cameraError}</p>

              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                className="py-2.5 px-4 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Choose or Snap via Device</span>
              </button>
              <input
                ref={fileFallbackRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFallbackFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            // Live Video Feed
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />

              {/* Viewfinder crosshairs / frame styling */}
              <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-[#E26D54]" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-[#E26D54]" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-[#E26D54]" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-[#E26D54]" />
                </div>
              </div>

              {isStarting && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <p className="text-xs text-[#9992A8] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#E5B268] animate-spin" />
                    Starting camera...
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div className="p-4 bg-[#14121A] border-t border-[#242031] flex items-center justify-between">
          {capturedPreview ? (
            // Post-capture actions: Retake or Confirm
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 rounded-xl border border-[#292536] hover:bg-white/5 text-[#F6F3EE] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-[#9992A8]" />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Use Photo</span>
              </button>
            </div>
          ) : (
            // Live capture actions
            <div className="w-full flex items-center justify-between">
              {/* Flip camera button */}
              {hasMultipleCameras ? (
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
                  }
                  className="p-3 rounded-2xl bg-[#1D1B28] hover:bg-[#252233] text-[#9992A8] hover:text-[#F6F3EE] border border-white/[0.05] transition-colors"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10" />
              )}

              {/* Shutter Button */}
              <button
                type="button"
                disabled={Boolean(cameraError) || isStarting}
                onClick={handleCapture}
                className="w-16 h-16 rounded-full border-4 border-[#E26D54] p-1 flex items-center justify-center group hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                title="Take Picture"
              >
                <div className="w-full h-full rounded-full bg-[#E26D54] group-hover:bg-[#D05E46] transition-colors shadow-lg" />
              </button>

              {/* Fallback to native device file/camera input */}
              <div>
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="p-3 rounded-2xl bg-[#1D1B28] hover:bg-[#252233] text-[#9992A8] hover:text-[#F6F3EE] border border-white/[0.05] transition-colors"
                  title="Use Device Native Camera / Library"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileFallbackRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFallbackFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
