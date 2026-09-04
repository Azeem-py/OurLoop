"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Check, CheckCheck, BookmarkPlus, Sparkles, Smile } from "lucide-react";
import { format } from "date-fns";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceNotePlayer } from "./VoiceNotePlayer";

export interface ChatMessageItem {
  id: string;
  senderId: string;
  contentType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE_NOTE";
  text?: string | null;
  contentUrl?: string | null;
  durationSec?: number | null;
  createdAt: string | Date;
  readAt?: string | Date | null;
  sender: {
    id: string;
    displayName: string;
    nickname?: string | null;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
}

interface ChatRoomProps {
  initialMessages: ChatMessageItem[];
  currentUserId: string;
  partnerName: string;
}

const QUICK_EMOJIS = ["❤️", "🥺", "😂", "🔥", "🫂", "✨"];

export function ChatRoom({ initialMessages, currentUserId, partnerName }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [text, setText] = useState("");
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [savedToGalleryId, setSavedToGalleryId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodic poll for live messages (real-time feeling)
  useEffect(() => {
    async function syncMessages() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {}
    }

    const interval = setInterval(syncMessages, 3500);
    return () => clearInterval(interval);
  }, []);

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const currentText = text.trim();
    setText("");

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      senderId: currentUserId,
      contentType: "TEXT",
      text: currentText,
      createdAt: new Date(),
      sender: { id: currentUserId, displayName: "You" },
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "TEXT",
          text: currentText,
        }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendVoiceNote(audioUrl: string, durationSec: number) {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "VOICE_NOTE",
          contentUrl: audioUrl,
          durationSec,
        }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith("video/");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "memories");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: isVid ? "VIDEO" : "IMAGE",
            contentUrl: url,
          }),
        });

        if (res.ok) {
          const { message } = await res.json();
          setMessages((prev) => [...prev, message]);
        }
      }
    } catch (err) {
      console.error("Chat media upload error:", err);
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    setActiveReactionMessageId(null);
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const exists = m.reactions.find((r) => r.userId === currentUserId && r.emoji === emoji);
          const newReactions = exists
            ? m.reactions.filter((r) => r.id !== exists.id)
            : [...m.reactions, { id: `react-${Date.now()}`, emoji, userId: currentUserId }];
          return { ...m, reactions: newReactions };
        })
      );

      await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveToGallery(msg: ChatMessageItem) {
    if (!msg.contentUrl) return;
    try {
      setSavedToGalleryId(msg.id);
      await fetch("/api/messages/save-to-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: msg.contentUrl,
          mediaType: msg.contentType === "VIDEO" ? "VIDEO" : "IMAGE",
          caption: "Saved from chat 💛",
        }),
      });

      setTimeout(() => setSavedToGalleryId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0E0D13]">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8 py-6 space-y-3.5 no-scrollbar max-w-3xl lg:max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#171520] border border-[#292536] flex items-center justify-center text-[#E26D54] mb-3 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-[#F6F3EE]">This is your private chat</h4>
            <p className="text-xs text-[#9992A8] max-w-xs mt-1 leading-relaxed">
              Only you and {partnerName} are here. Send a sweet note, a voice clip, or a photo.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const hasReactions = msg.reactions && msg.reactions.length > 0;

            return (
              <div
                key={msg.id}
                className={`relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Bubble Container */}
                <div
                  onClick={() =>
                    setActiveReactionMessageId(
                      activeReactionMessageId === msg.id ? null : msg.id
                    )
                  }
                  className={`relative max-w-[85%] sm:max-w-[75%] px-4 py-2.5 shadow-sm cursor-pointer transition-transform active:scale-[0.99] ${
                    isMe
                      ? "bg-[#E26D54] text-white bubble-sent font-normal"
                      : "bg-[#1A1824] border border-[#292536] text-[#F6F3EE] bubble-received"
                  }`}
                >
                  {/* TEXT Message */}
                  {msg.contentType === "TEXT" && (
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* VOICE NOTE */}
                  {msg.contentType === "VOICE_NOTE" && msg.contentUrl && (
                    <VoiceNotePlayer
                      audioUrl={msg.contentUrl}
                      durationSec={msg.durationSec}
                      isSentByMe={isMe}
                    />
                  )}

                  {/* IMAGE / VIDEO Message */}
                  {(msg.contentType === "IMAGE" || msg.contentType === "VIDEO") && msg.contentUrl && (
                    <div className="flex flex-col gap-2">
                      <div className="relative rounded-xl overflow-hidden max-h-72 bg-black/20">
                        {msg.contentType === "IMAGE" ? (
                          <img
                            src={msg.contentUrl}
                            alt="Chat media"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={msg.contentUrl}
                            controls
                            className="w-full h-full object-cover max-h-72"
                          />
                        )}
                      </div>

                      {/* 1-tap "Save to gallery" action button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToGallery(msg);
                        }}
                        className={`text-[10px] py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                          isMe
                            ? "bg-black/20 text-white/90 hover:bg-black/30"
                            : "bg-white/[0.06] text-[#E5B268] hover:bg-white/10"
                        }`}
                      >
                        <BookmarkPlus className="w-3 h-3" />
                        <span>
                          {savedToGalleryId === msg.id ? "Saved to Memories! 💛" : "Save to gallery"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Timestamp & Read Status */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                      isMe ? "text-white/75" : "text-[#9992A8]"
                    }`}
                  >
                    <span>{format(new Date(msg.createdAt), "h:mm a")}</span>
                    {isMe && (
                      <span>
                        {msg.readAt ? (
                          <CheckCheck className="w-3 h-3 text-white" />
                        ) : (
                          <Check className="w-3 h-3 text-white/75" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Emoji Reaction Bar (Popup on tap) */}
                {activeReactionMessageId === msg.id && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-[#14121A] border border-[#292536] rounded-full shadow-2xl mt-1 z-20 animate-in fade-in zoom-in-95">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="text-base p-1 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Displayed reactions badge */}
                {hasReactions && (
                  <div
                    className={`flex items-center gap-0.5 -mt-2 z-10 px-2 py-0.5 rounded-full bg-[#14121A] border border-[#292536] shadow-sm text-[10px] ${
                      isMe ? "mr-1" : "ml-1"
                    }`}
                  >
                    {Array.from(new Set(msg.reactions.map((r) => r.emoji))).map((emoji) => (
                      <span key={emoji}>{emoji}</span>
                    ))}
                    {msg.reactions.length > 1 && (
                      <span className="text-[#9992A8] font-mono text-[9px] ml-0.5">
                        {msg.reactions.length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3.5 md:py-4 bg-[#14121A]/95 border-t border-[#242031] backdrop-blur-md">
        <form onSubmit={handleSendText} className="max-w-3xl lg:max-w-4xl mx-auto w-full flex items-center gap-2.5">
          {/* Media upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#1A1824] hover:bg-[#221F2D] text-[#9992A8] hover:text-[#F6F3EE] border border-white/[0.05] transition-colors shrink-0"
            title="Attach Photo or Video"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Voice recorder button */}
          <VoiceRecorder onSendVoiceNote={handleSendVoiceNote} />

          {/* Text Input */}
          <input
            type="text"
            placeholder={`Message ${partnerName}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-[#1A1824] border border-[#292536] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/60 focus:outline-none focus:border-[#E26D54]"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] disabled:opacity-30 transition-all shrink-0 font-bold"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
