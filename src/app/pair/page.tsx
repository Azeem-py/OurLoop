"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Copy, Check, Share2, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function PairPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [annivDate, setAnnivDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already paired
  useEffect(() => {
    async function checkCouple() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user?.coupleId) {
          router.push("/");
        }
      } catch {}
    }
    checkCouple();
  }, [router]);

  // Polling for partner join when waiting with code
  useEffect(() => {
    if (!inviteCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/couple");
        if (res.ok) {
          const data = await res.json();
          if (data.couple && data.couple.members.length >= 2) {
            router.push("/");
          }
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [inviteCode, router]);

  async function handleCreateSpace(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/couple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          anniversaryDate: annivDate ? new Date(annivDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create space");

      setInviteCode(data.couple.inviteCode);
    } catch (err: any) {
      setError(err.message || "Could not create space");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/couple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          inviteCode: inputCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join space");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid invite code");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    if (!inviteCode) return;
    const text = `Hey my love! I created our private world on "Us". Join our space with this invite code: ${inviteCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-[#0E0D13] flex flex-col justify-center items-center p-4 sm:p-6 text-left">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#E26D54] flex items-center justify-center text-[#0E0D13] shadow-sm mb-4 mx-auto sm:mx-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F6F3EE] font-serif">
            Connect With Your Partner
          </h1>
          <p className="text-xs text-[#9992A8] mt-1 font-light leading-relaxed">
            Each couple has their own private world, invisible to everyone else.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Choice Screen */}
        {mode === "choose" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              className="w-full p-6 rounded-3xl bg-[#171520] border border-[#292536] hover:border-white/25 text-left transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F6F3EE] group-hover:text-[#E26D54] transition-colors">
                    Create Our Space
                  </h3>
                  <p className="text-xs text-[#9992A8] mt-1 leading-relaxed">
                    Start our world and get a private invite code to send to your partner.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#9992A8] group-hover:text-[#E26D54] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
              </div>
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full p-6 rounded-3xl bg-[#171520] border border-[#292536] hover:border-white/25 text-left transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F6F3EE] group-hover:text-[#E5B268] transition-colors">
                    I Have an Invite Code
                  </h3>
                  <p className="text-xs text-[#9992A8] mt-1 leading-relaxed">
                    Your partner already created the space? Enter their code to link up.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#9992A8] group-hover:text-[#E5B268] group-hover:translate-x-1 transition-all shrink-0 ml-3" />
              </div>
            </button>
          </div>
        )}

        {/* Create Mode */}
        {mode === "create" && (
          <div>
            {inviteCode ? (
              <div className="bg-[#171520] border border-[#292536] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E5B268]/15 text-[#E5B268] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F6F3EE] font-serif">Our Space is Ready!</h3>
                  <p className="text-xs text-[#9992A8] mt-1 leading-relaxed">
                    Share this code with your partner. Once they enter it, your space unlocks automatically.
                  </p>
                </div>

                <div className="py-3.5 px-4 rounded-2xl bg-[#100F17] border border-[#292536] flex items-center justify-between">
                  <span className="font-mono text-xl font-bold tracking-wider text-[#E5B268]">
                    {inviteCode}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-[#201D2B] text-[#F6F3EE] hover:bg-[#E26D54] hover:text-[#0E0D13] transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => router.push("/")}
                    className="w-full py-2.5 rounded-xl border border-[#292536] text-xs text-[#9992A8] hover:text-[#F6F3EE] transition-colors"
                  >
                    Enter Space Anyway
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSpace} className="bg-[#171520] border border-[#292536] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-[#F6F3EE] font-serif">Create Our Space</h3>

                <div>
                  <label className="text-[11px] text-[#9992A8] mb-1.5 block font-medium">
                    When did your story start? (Anniversary Date)
                  </label>
                  <input
                    type="date"
                    value={annivDate}
                    onChange={(e) => setAnnivDate(e.target.value)}
                    className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F3EE] focus:outline-none focus:border-[#E26D54]"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setMode("choose")}
                    className="flex-1 py-3 rounded-xl border border-[#292536] text-xs font-semibold text-[#9992A8] hover:bg-white/[0.04] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Join Mode */}
        {mode === "join" && (
          <form onSubmit={handleJoinSpace} className="bg-[#171520] border border-[#292536] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#F6F3EE] font-serif">Enter Partner&apos;s Invite Code</h3>
              <p className="text-xs text-[#9992A8] mt-1 leading-relaxed">
                Ask your partner for the code generated on their phone or screen.
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                placeholder="e.g. US-7K9A"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-4 py-3.5 text-center font-mono text-base tracking-widest text-[#E5B268] placeholder-[#9992A8]/30 focus:outline-none focus:border-[#E5B268]"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex-1 py-3 rounded-xl border border-[#292536] text-xs font-semibold text-[#9992A8] hover:bg-white/[0.04] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="flex-1 py-3 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Space"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
