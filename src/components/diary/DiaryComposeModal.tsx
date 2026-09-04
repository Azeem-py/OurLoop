"use client";

import { useState, useRef } from "react";
import { X, Lock, Loader2, ImagePlus, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface DiaryComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MOODS = [
  { emoji: "💛", label: "Grateful" },
  { emoji: "✨", label: "Dreamy" },
  { emoji: "💌", label: "Loving" },
  { emoji: "✈️", label: "Missing you" },
  { emoji: "☕", label: "Cozy" },
  { emoji: "🌙", label: "Late night" },
  { emoji: "🌧️", label: "Tough day" },
  { emoji: "🥂", label: "Celebrating" },
];

export function DiaryComposeModal({ isOpen, onClose, onSuccess }: DiaryComposeModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("💛");
  const [isPrivateUntil, setIsPrivateUntil] = useState(false);
  const [revealDate, setRevealDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress if larger than 1MB
      let fileToUse = file;
      if (file.size > 1024 * 1024) {
        setUploadProgress("Optimizing image...");
        fileToUse = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });
      }
      setImageFile(fileToUse);
      setImagePreview(URL.createObjectURL(fileToUse));
      setUploadProgress(null);
    } catch (err) {
      console.warn("Image compression fallback:", err);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadProgress(null);
    }
  }

  function handleRemoveImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write a few words for today's entry");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let uploadedImageUrl: string | null = null;

      // 1. Upload image if attached
      if (imageFile) {
        setUploadProgress("Uploading photo...");
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("bucket", "diary");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const d = await uploadRes.json();
          throw new Error(d.error || "Failed to upload photo");
        }

        const uploadData = await uploadRes.json();
        uploadedImageUrl = uploadData.url;
      }

      // 2. Save diary entry
      setUploadProgress("Saving entry...");
      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          mood: selectedMood,
          imageUrl: uploadedImageUrl,
          visibility: isPrivateUntil ? "PRIVATE_UNTIL" : "SHARED",
          revealAt: isPrivateUntil && revealDate ? new Date(revealDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save entry");
      }

      // Reset state
      setTitle("");
      setContent("");
      handleRemoveImage();
      setIsPrivateUntil(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to post entry");
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#171520] border border-[#292536] rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar text-left">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#F6F3EE] font-serif">Write Today&apos;s Entry</h3>
            <p className="text-[11px] text-[#9992A8]">A quiet page in our two-person diary</p>
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
          {/* Mood Selector */}
          <div>
            <label className="block text-[11px] text-[#9992A8] mb-1.5 font-medium">
              How does your heart feel today?
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {MOODS.map((m) => (
                <button
                  key={m.emoji}
                  type="button"
                  onClick={() => setSelectedMood(m.emoji)}
                  className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 border transition-all ${
                    selectedMood === m.emoji
                      ? "bg-[#E26D54]/15 border-[#E26D54] text-[#F6F3EE]"
                      : "bg-[#100F17] border-[#292536] text-[#9992A8] hover:text-[#F6F3EE]"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Title */}
          <div>
            <input
              type="text"
              placeholder="Title (optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F3EE] placeholder-[#9992A8]/50 focus:outline-none focus:border-[#E26D54]"
            />
          </div>

          {/* Diary Body */}
          <div>
            <textarea
              placeholder="Dear us, today was..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full bg-[#100F17] border border-[#292536] rounded-xl p-3.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/50 focus:outline-none focus:border-[#E26D54] resize-none leading-relaxed"
            />
          </div>

          {/* Image Attachment Section */}
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#292536] bg-black/40 group">
                <img
                  src={imagePreview}
                  alt="Attached preview"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Change Photo"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2 rounded-full bg-rose-600/80 text-white hover:bg-rose-600 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white/90 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-[#292536] hover:border-[#E26D54]/50 bg-[#100F17]/60 hover:bg-[#100F17] flex items-center justify-center gap-2 text-xs text-[#9992A8] hover:text-[#F6F3EE] transition-all"
              >
                <ImagePlus className="w-4 h-4 text-[#E26D54]" />
                <span>Attach a photo to this page</span>
              </button>
            )}
          </div>

          {/* Secret / Surprise Lock Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#100F17] border border-[#292536]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#E5B268]" />
                <span className="text-xs font-medium text-[#F6F3EE]">Lock as surprise entry?</span>
              </div>
              <input
                type="checkbox"
                checked={isPrivateUntil}
                onChange={(e) => setIsPrivateUntil(e.target.checked)}
                className="w-4 h-4 accent-[#E26D54] rounded cursor-pointer"
              />
            </div>

            {isPrivateUntil && (
              <div className="mt-3 pt-2.5 border-t border-[#292536]">
                <label className="block text-[11px] text-[#9992A8] mb-1.5">
                  Unlock date (e.g. your anniversary or reunion flight)
                </label>
                <input
                  type="date"
                  value={revealDate}
                  onChange={(e) => setRevealDate(e.target.value)}
                  className="w-full bg-[#171520] border border-[#292536] rounded-xl px-3 py-2 text-xs text-[#F6F3EE] focus:outline-none focus:border-[#E5B268]"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{uploadProgress || "Publishing to our diary..."}</span>
              </>
            ) : (
              <span>Publish Entry</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
