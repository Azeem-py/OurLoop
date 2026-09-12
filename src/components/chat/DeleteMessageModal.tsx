"use client";

import { useEffect } from "react";
import { Trash2, X, Loader2, Mic, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { format } from "date-fns";
import { ChatMessageItem } from "./ChatRoom";

interface DeleteMessageModalProps {
  isOpen: boolean;
  message: ChatMessageItem | null;
  currentUserId: string;
  partnerName: string;
  onClose: () => void;
  onConfirm: (message: ChatMessageItem) => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteMessageModal({
  isOpen,
  message,
  currentUserId,
  partnerName,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteMessageModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !message) return null;

  const isMe = message.senderId === currentUserId;
  const authorLabel = isMe
    ? "You"
    : message.sender?.nickname || message.sender?.displayName || partnerName;

  return (
    <div
      onClick={() => {
        if (!isDeleting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-[#161420] border border-[#2D283E] rounded-3xl p-6 shadow-2xl text-[#F6F3EE] relative overflow-hidden"
      >
        {/* Close icon button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-[#9992A8] hover:text-[#F6F3EE] transition-colors p-1 disabled:opacity-40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Badge */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 font-bold shadow-md shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#F6F3EE]">
              Delete Message?
            </h3>
            <p className="text-xs text-[#A6A0B8]">
              Permanent removal from chat
            </p>
          </div>
        </div>

        {/* Warning copy */}
        <p className="text-xs sm:text-sm text-[#C5C0D3] leading-relaxed mb-4">
          Are you sure you really want to delete this message? This action{" "}
          <span className="text-rose-400 font-medium">cannot be undone</span> and
          will remove it for both you and {isMe ? partnerName : "your partner"}.
        </p>

        {/* Message preview snippet box */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[#0E0D13] border border-[#231E33] text-xs">
          <div className="flex items-center justify-between text-[11px] text-[#8E879E] mb-2 font-medium">
            <span>{authorLabel}</span>
            <span>
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
          </div>

          {message.contentType === "TEXT" && (
            <p className="text-[#DDD8E8] line-clamp-3 text-xs leading-relaxed italic break-words">
              &ldquo;{message.text}&rdquo;
            </p>
          )}

          {message.contentType === "IMAGE" && (
            <div className="flex items-center gap-3">
              {message.contentUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={message.contentUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#9992A8] shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <span className="font-medium text-[#DDD8E8] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#E26D54]" /> Photo message
                </span>
                {message.text && (
                  <p className="text-[11px] text-[#9992A8] truncate mt-0.5">
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {message.contentType === "VIDEO" && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#1A1824] border border-white/10 flex items-center justify-center text-[#E5B268] shrink-0">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="font-medium text-[#DDD8E8] flex items-center gap-1.5">
                  <VideoIcon className="w-3.5 h-3.5 text-[#E5B268]" /> Video message
                </span>
                {message.text && (
                  <p className="text-[11px] text-[#9992A8] truncate mt-0.5">
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          )}

          {message.contentType === "VOICE_NOTE" && (
            <div className="flex items-center gap-2.5 text-[#DDD8E8]">
              <div className="w-8 h-8 rounded-full bg-[#E26D54]/20 flex items-center justify-center text-[#E26D54] shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <span className="font-medium">
                Voice note {message.durationSec ? `(${message.durationSec}s)` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-[#231E33] hover:bg-[#2C2640] text-[#DDD8E8] hover:text-[#F6F3EE] text-xs font-medium rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(message)}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
