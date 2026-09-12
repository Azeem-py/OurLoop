"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  BookmarkPlus,
  Sparkles,
  Camera,
  Reply,
  X,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { VoiceRecorder } from "./VoiceRecorder";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { CameraModal } from "@/components/common/CameraModal";

export interface ChatMessageItem {
  id: string;
  senderId: string;
  contentType: "TEXT" | "IMAGE" | "VIDEO" | "VOICE_NOTE";
  text?: string | null;
  contentUrl?: string | null;
  durationSec?: number | null;
  createdAt: string | Date;
  readAt?: string | Date | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    text?: string | null;
    contentType: string;
    senderName: string;
  } | null;
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

function areMessagesDifferent(prev: ChatMessageItem[], next: ChatMessageItem[]): boolean {
  if (prev.length !== next.length) return true;
  if (prev.length === 0) return false;
  if (prev[prev.length - 1].id !== next[next.length - 1].id) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return true;
    if (prev[i].readAt !== next[i].readAt) return true;
    if ((prev[i].reactions?.length || 0) !== (next[i].reactions?.length || 0)) return true;
  }
  return false;
}

export function ChatRoom({ initialMessages, currentUserId, partnerName }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [text, setText] = useState("");
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [savedToGalleryId, setSavedToGalleryId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [hasUnseenNewMessage, setHasUnseenNewMessage] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const isAtBottomRef = useRef(true);
  const isInitialScrollDone = useRef(false);
  const lastTypingSentRef = useRef<number>(0);
  const partnerTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendTypingHeartbeat = useCallback((isTyping: boolean) => {
    const now = Date.now();
    if (isTyping) {
      if (now - lastTypingSentRef.current > 2200) {
        lastTypingSentRef.current = now;
        fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: true }),
        }).catch(() => {});
      }
    } else {
      lastTypingSentRef.current = 0;
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }
  }, []);

  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 60;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
  }, []);

  const handleScroll = () => {
    const atBottom = checkIfAtBottom();
    isAtBottomRef.current = atBottom;
    setShowScrollBottomBtn(!atBottom);
    if (atBottom) {
      setHasUnseenNewMessage(false);
    }
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (container) {
      if (behavior === "auto" || behavior === "instant") {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
      }
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: behavior === "auto" ? ("instant" as ScrollBehavior) : behavior,
      block: "end",
    });
    isAtBottomRef.current = true;
    setShowScrollBottomBtn(false);
    setHasUnseenNewMessage(false);
  }, []);

  // Reliable initial scroll to bottom: fires across microtasks/frames to account for layout & hydration
  useEffect(() => {
    if (messages.length === 0) return;

    const scrollIfAtBottom = () => {
      if (isAtBottomRef.current) {
        scrollToBottom("auto");
      }
    };

    // Immediate
    scrollIfAtBottom();

    // After initial paint
    const rafId = requestAnimationFrame(scrollIfAtBottom);

    // Staggered checks to account for fonts, styles and initial images
    const t1 = setTimeout(scrollIfAtBottom, 60);
    const t2 = setTimeout(scrollIfAtBottom, 180);
    const t3 = setTimeout(scrollIfAtBottom, 350);
    const t4 = setTimeout(() => {
      scrollIfAtBottom();
      isInitialScrollDone.current = true;
    }, 650);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []); // Run once on mount

  // Periodic poll for live messages & partner typing indicator
  useEffect(() => {
    async function syncMessages() {
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          const incoming: ChatMessageItem[] = data.messages;
          const typingNow = Boolean(data.isPartnerTyping);

          setIsPartnerTyping((prev) => {
            if (!prev && typingNow && isAtBottomRef.current) {
              setTimeout(() => scrollToBottom("smooth"), 50);
            }
            return typingNow;
          });

          // Local auto-expiration fallback if poll drops
          if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
          if (typingNow) {
            partnerTypingTimeoutRef.current = setTimeout(() => {
              setIsPartnerTyping(false);
            }, 5000);
          }

          setMessages((prev) => {
            if (!areMessagesDifferent(prev, incoming)) {
              return prev;
            }

            const hadNewIncoming =
              incoming.length > prev.length &&
              incoming[incoming.length - 1]?.senderId !== currentUserId;

            if (isAtBottomRef.current) {
              setTimeout(() => scrollToBottom("smooth"), 50);
            } else if (hadNewIncoming) {
              setHasUnseenNewMessage(true);
            }

            return incoming;
          });
        }
      } catch (err) {}
    }

    const interval = setInterval(syncMessages, 2800);
    return () => {
      clearInterval(interval);
      if (partnerTypingTimeoutRef.current) clearTimeout(partnerTypingTimeoutRef.current);
    };
  }, [currentUserId, scrollToBottom]);

  const scrollToMessage = (messageId: string) => {
    const targetElement = document.getElementById(`msg-${messageId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((curr) => (curr === messageId ? null : curr));
      }, 2000);
    }
  };

  const startReply = (msg: ChatMessageItem) => {
    setReplyingTo(msg);
    setActiveReactionMessageId(null);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  async function handleSendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    // Instantly clear typing indicator when message is submitted
    sendTypingHeartbeat(false);

    const currentText = text.trim();
    const replyingToSnapshot = replyingTo;
    setText("");
    setReplyingTo(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessageItem = {
      id: tempId,
      senderId: currentUserId,
      contentType: "TEXT",
      text: currentText,
      replyToId: replyingToSnapshot?.id || null,
      replyTo: replyingToSnapshot
        ? {
            id: replyingToSnapshot.id,
            text: replyingToSnapshot.text,
            contentType: replyingToSnapshot.contentType,
            senderName:
              replyingToSnapshot.senderId === currentUserId
                ? "You"
                : replyingToSnapshot.sender.nickname ||
                  replyingToSnapshot.sender.displayName ||
                  partnerName,
          }
        : null,
      createdAt: new Date(),
      sender: { id: currentUserId, displayName: "You" },
      reactions: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "TEXT",
          text: currentText,
          replyToId: replyingToSnapshot?.id,
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
    const replyingToSnapshot = replyingTo;
    setReplyingTo(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "VOICE_NOTE",
          contentUrl: audioUrl,
          durationSec,
          replyToId: replyingToSnapshot?.id,
        }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, message]);
        setTimeout(() => scrollToBottom("smooth"), 50);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function uploadMediaFile(file: File) {
    const replyingToSnapshot = replyingTo;
    setReplyingTo(null);

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
            replyToId: replyingToSnapshot?.id,
          }),
        });

        if (res.ok) {
          const { message } = await res.json();
          setMessages((prev) => [...prev, message]);
          setTimeout(() => scrollToBottom("smooth"), 50);
        }
      }
    } catch (err) {
      console.error("Chat media upload error:", err);
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMediaFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0E0D13] relative">
      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:px-8 py-6 space-y-3.5 no-scrollbar max-w-3xl lg:max-w-4xl mx-auto w-full"
      >
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
            const isHighlighted = highlightedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`relative flex flex-col ${isMe ? "items-end" : "items-start"} transition-all duration-300`}
              >
                <div
                  className={`relative group flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Bubble Container */}
                  <div
                    onClick={() =>
                      setActiveReactionMessageId(
                        activeReactionMessageId === msg.id ? null : msg.id
                      )
                    }
                    className={`relative w-full px-4 py-2.5 shadow-sm cursor-pointer transition-all active:scale-[0.99] ${
                      isMe
                        ? "bg-[#E26D54] text-white bubble-sent font-normal"
                        : "bg-[#1A1824] border border-[#292536] text-[#F6F3EE] bubble-received"
                    } ${
                      isHighlighted
                        ? "ring-2 ring-[#E26D54] ring-offset-2 ring-offset-[#0E0D13] scale-[1.02]"
                        : ""
                    }`}
                  >
                    {/* Reply Quote Preview if message is replying to another */}
                    {msg.replyTo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(msg.replyTo!.id);
                        }}
                        className={`w-full text-left mb-2 px-2.5 py-1.5 rounded-lg border-l-2 text-xs transition-opacity hover:opacity-90 block ${
                          isMe
                            ? "bg-black/20 border-white/80 text-white"
                            : "bg-[#14121A] border-[#E26D54] text-[#F6F3EE]"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1 text-[10px] font-semibold ${
                            isMe ? "text-white/90" : "text-[#E26D54]"
                          }`}
                        >
                          <Reply className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{msg.replyTo.senderName}</span>
                        </div>
                        <p className="text-[11px] truncate opacity-80 mt-0.5">
                          {msg.replyTo.contentType === "TEXT"
                            ? msg.replyTo.text
                            : msg.replyTo.contentType === "IMAGE"
                            ? "📷 Photo"
                            : msg.replyTo.contentType === "VIDEO"
                            ? "🎥 Video"
                            : "🎙️ Voice note"}
                        </p>
                      </button>
                    )}

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
                    {(msg.contentType === "IMAGE" || msg.contentType === "VIDEO") &&
                      msg.contentUrl && (
                        <div className="flex flex-col gap-2">
                          <div className="relative rounded-xl overflow-hidden max-h-72 bg-black/20">
                            {msg.contentType === "IMAGE" ? (
                              <img
                                src={msg.contentUrl}
                                alt="Chat media"
                                className="w-full h-full object-cover"
                                onLoad={() => {
                                  if (isAtBottomRef.current) {
                                    scrollToBottom("auto");
                                  }
                                }}
                              />
                            ) : (
                              <video
                                src={msg.contentUrl}
                                controls
                                className="w-full h-full object-cover max-h-72"
                                onLoadedMetadata={() => {
                                  if (isAtBottomRef.current) {
                                    scrollToBottom("auto");
                                  }
                                }}
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
                              {savedToGalleryId === msg.id
                                ? "Saved to Memories! 💛"
                                : "Save to gallery"}
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

                  {/* Desktop Quick Reply Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startReply(msg);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-white/10 text-[#9992A8] hover:text-[#F6F3EE] shrink-0 hidden sm:block"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Emoji Reaction Bar + Reply Action (Popup on tap) */}
                {activeReactionMessageId === msg.id && (
                  <div className="flex items-center gap-1 p-1 bg-[#14121A] border border-[#292536] rounded-full shadow-2xl mt-1.5 z-20 animate-in fade-in zoom-in-95">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReaction(msg.id, emoji);
                        }}
                        className="text-base p-1 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-[1px] h-4 bg-[#292536] mx-0.5" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startReply(msg);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-[#F6F3EE] hover:bg-[#221F2D] hover:text-[#E26D54] transition-colors"
                      title="Reply to message"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
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
        {/* Partner is typing bubble indicator */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 mb-2 animate-in fade-in duration-200">
            <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-[#1A1824] border border-[#292536] text-[#9992A8] flex items-center gap-2 shadow-sm">
              <span className="text-xs font-medium text-[#F6F3EE]/80">
                {partnerName} is typing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E26D54] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E26D54] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#E26D54] animate-bounce" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Latest Button */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 right-5 md:right-8 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1A1824]/95 border border-[#292536] text-[#F6F3EE] shadow-2xl hover:bg-[#242031] transition-all backdrop-blur-md text-xs font-medium group"
        >
          <ChevronDown className="w-4 h-4 text-[#E26D54] group-hover:translate-y-0.5 transition-transform" />
          {hasUnseenNewMessage ? (
            <span className="text-[#E26D54] font-semibold flex items-center gap-1.5">
              New message
              <span className="w-2 h-2 rounded-full bg-[#E26D54] animate-pulse" />
            </span>
          ) : (
            <span>Latest</span>
          )}
        </button>
      )}

      {/* Input Bar Area */}
      <div className="p-3.5 md:py-4 bg-[#14121A]/95 border-t border-[#242031] backdrop-blur-md">
        {/* Replying banner preview */}
        {replyingTo && (
          <div className="max-w-3xl lg:max-w-4xl mx-auto w-full mb-2">
            <div className="flex items-center justify-between px-3 py-2 bg-[#1A1824] border border-[#292536] rounded-xl text-xs text-[#9992A8] animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <div className="w-1 h-7 bg-[#E26D54] rounded-full shrink-0" />
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <Reply className="w-3 h-3 text-[#E26D54]" />
                    <span className="font-semibold text-[#E26D54]">
                      Replying to{" "}
                      {replyingTo.senderId === currentUserId
                        ? "yourself"
                        : replyingTo.sender.nickname ||
                          replyingTo.sender.displayName ||
                          partnerName}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-[#C4BFD0] mt-0.5">
                    {replyingTo.contentType === "TEXT"
                      ? replyingTo.text
                      : replyingTo.contentType === "IMAGE"
                      ? "📷 Photo"
                      : replyingTo.contentType === "VIDEO"
                      ? "🎥 Video"
                      : "🎙️ Voice note"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-[#9992A8] hover:text-[#F6F3EE] transition-colors shrink-0"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Subtle partner typing notice if user is scrolled up */}
        {isPartnerTyping && !isAtBottomRef.current && (
          <div className="max-w-3xl lg:max-w-4xl mx-auto w-full mb-2 px-1 flex items-center gap-1.5 text-[11px] text-[#E26D54] font-medium animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E26D54]" />
            <span>{partnerName} is typing...</span>
          </div>
        )}

        <form
          onSubmit={handleSendText}
          className="max-w-3xl lg:max-w-4xl mx-auto w-full flex items-center gap-2"
        >
          {/* Camera snap button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2.5 rounded-xl bg-[#1A1824] hover:bg-[#221F2D] text-[#E26D54] hover:text-[#D05E46] border border-white/[0.05] transition-colors shrink-0 group"
            title="Take Photo"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Media upload button from gallery */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-[#1A1824] hover:bg-[#221F2D] text-[#9992A8] hover:text-[#F6F3EE] border border-white/[0.05] transition-colors shrink-0 group"
            title="Attach Photo or Video from Gallery"
          >
            <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
            ref={textInputRef}
            type="text"
            placeholder={
              replyingTo
                ? `Replying to ${
                    replyingTo.senderId === currentUserId
                      ? "yourself"
                      : replyingTo.sender.nickname ||
                        replyingTo.sender.displayName ||
                        partnerName
                  }...`
                : `Message ${partnerName}...`
            }
            value={text}
            onChange={(e) => {
              const val = e.target.value;
              setText(val);
              if (val.trim()) {
                sendTypingHeartbeat(true);
              } else {
                sendTypingHeartbeat(false);
              }
            }}
            onBlur={() => {
              sendTypingHeartbeat(false);
            }}
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

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={uploadMediaFile}
        title={`Take Photo for ${partnerName}`}
      />
    </div>
  );
}
