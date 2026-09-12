"use client";

import { useEffect, useState } from "react";
import { X, Download, BookmarkPlus, Check, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ChatMessageItem } from "./ChatRoom";

interface ChatMediaModalProps {
  message: ChatMessageItem | null;
  onClose: () => void;
  onSaveToGallery?: (message: ChatMessageItem) => void;
  onDelete?: (message: ChatMessageItem) => void;
  isSaved?: boolean;
}

export function ChatMediaModal({
  message,
  onClose,
  onSaveToGallery,
  onDelete,
  isSaved,
}: ChatMediaModalProps) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!message) return;

    // Lock body scroll while lightbox is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [message, onClose]);

  if (!message || !message.contentUrl) return null;

  const senderName =
    message.sender?.nickname || message.sender?.displayName || "Partner";
  const formattedTime = format(
    new Date(message.createdAt),
    "MMM d, yyyy · h:mm a"
  );

  async function handleDownload() {
    if (!message?.contentUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(message.contentUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = message.contentType === "VIDEO" ? "mp4" : "jpg";
      a.download = `ourloop-media-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(message.contentUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar (WhatsApp style) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-16 px-4 md:px-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-10"
      >
        {/* Sender Info & Date */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h3 className="text-sm font-semibold text-[#F6F3EE] leading-tight">
              {senderName}
            </h3>
            <p className="text-[11px] text-[#9992A8]">{formattedTime}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onSaveToGallery && (
            <button
              type="button"
              onClick={() => onSaveToGallery(message)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-[#E5B268] font-medium transition-colors"
              title="Save to Memories"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save to Memories</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message)}
              className="p-2 rounded-full hover:bg-rose-500/20 text-white/80 hover:text-rose-400 transition-colors"
              title="Delete media"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Full-Size Image Viewer */}
      <div
        onClick={onClose}
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-full max-w-full flex items-center justify-center"
        >
          {message.contentType === "VIDEO" ? (
            <video
              src={message.contentUrl}
              controls
              autoPlay
              className="max-h-[82vh] max-w-[95vw] rounded-lg shadow-2xl object-contain"
            />
          ) : (
            <img
              src={message.contentUrl}
              alt="Full size media"
              className="max-h-[82vh] max-w-[95vw] rounded-lg shadow-2xl object-contain transition-transform duration-200"
            />
          )}
        </div>
      </div>

      {/* Bottom bar with caption / hint */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full py-3 px-4 text-center bg-gradient-to-t from-black/80 to-transparent"
      >
        {message.text && (
          <p className="text-xs sm:text-sm text-[#F6F3EE] max-w-xl mx-auto mb-1">
            {message.text}
          </p>
        )}
        <p className="text-[10px] text-[#9992A8]/60">
          Tap anywhere or press Esc to close
        </p>
      </div>
    </div>
  );
}
