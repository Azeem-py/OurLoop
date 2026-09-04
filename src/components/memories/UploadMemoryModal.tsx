"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, MapPin, Calendar, UploadCloud, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface UploadMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadMemoryModal({ isOpen, onClose, onSuccess }: UploadMemoryModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);
    const isVid = selected.type.startsWith("video/");
    setIsVideo(isVid);

    if (!isVid && selected.type.startsWith("image/")) {
      // Compress image client side
      try {
        const compressed = await imageCompression(selected, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        setFile(compressed);
        setPreview(URL.createObjectURL(compressed));
      } catch (err) {
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
      }
    } else {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a photo or video to upload");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload media
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "memories");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const d = await uploadRes.json();
        throw new Error(d.error || "Failed to upload media");
      }

      const { url } = await uploadRes.json();

      // 2. Create memory record in Prisma
      const memRes = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: url,
          mediaType: isVideo ? "VIDEO" : "IMAGE",
          caption: caption.trim() || undefined,
          location: location.trim() || undefined,
          takenAt: new Date(takenAt).toISOString(),
        }),
      });

      if (!memRes.ok) {
        const d = await memRes.json();
        throw new Error(d.error || "Failed to save memory");
      }

      // Reset & Close
      setFile(null);
      setPreview(null);
      setCaption("");
      setLocation("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#171520] border border-[#292536] rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar text-left">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#F6F3EE] font-serif">Add to Our Memories</h3>
            <p className="text-[11px] text-[#9992A8]">A photograph or video to keep forever</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9992A8] hover:text-[#F6F3EE] hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-56 rounded-2xl border-2 border-dashed border-[#292536] hover:border-[#E26D54]/50 bg-[#100F17] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors"
          >
            {preview ? (
              isVideo ? (
                <video src={preview} className="w-full h-full object-cover" muted />
              ) : (
                <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E26D54]/15 flex items-center justify-center text-[#E26D54] mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-[#F6F3EE]">Tap to select a photo or clip</p>
                <p className="text-[10px] text-[#9992A8] mt-1">Compressed client-side before upload</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div>
            <textarea
              placeholder="What made this moment special?..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full bg-[#100F17] border border-[#292536] rounded-xl p-3 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/60 focus:outline-none focus:border-[#E26D54] resize-none leading-relaxed"
            />
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#9992A8] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#E26D54]" />
                Location (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Paris, Beach..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3 py-2 text-xs text-[#F6F3EE] placeholder-[#9992A8]/50 focus:outline-none focus:border-[#E26D54]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#9992A8] mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#E5B268]" />
                Date
              </label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3 py-2 text-xs text-[#F6F3EE] focus:outline-none focus:border-[#E5B268]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading memory...</span>
              </>
            ) : (
              <span>Save to our memories</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
