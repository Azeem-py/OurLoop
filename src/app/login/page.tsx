"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister
      ? { email, password, displayName, nickname }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Check current user state
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (meData.user?.coupleId) {
        router.push("/");
      } else {
        router.push("/pair");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0D13] flex flex-col justify-center items-center p-4 sm:p-6 text-left">
      <div className="w-full max-w-md space-y-6">
        {/* Top Brand Hero */}
        <div className="text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#E26D54] flex items-center justify-center text-[#0E0D13] shadow-sm mb-4 mx-auto sm:mx-0">
            <Heart className="w-6 h-6 fill-[#0E0D13]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F6F3EE] font-serif">
            Us
          </h1>
          <p className="text-xs text-[#9992A8] mt-1 font-light leading-relaxed">
            A private world for two. Two skies, one shared horizon.
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full bg-[#171520] border border-[#292536] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-6 border-b border-[#242031] pb-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`text-xs font-semibold pb-1.5 transition-colors ${
                !isRegister ? "text-[#E26D54] border-b-2 border-[#E26D54]" : "text-[#9992A8]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`text-xs font-semibold pb-1.5 transition-colors ${
                isRegister ? "text-[#E26D54] border-b-2 border-[#E26D54]" : "text-[#9992A8]"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-[11px] text-[#9992A8] mb-1.5 block font-medium">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Azeem"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/40 focus:outline-none focus:border-[#E26D54]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#9992A8] mb-1.5 block font-medium">
                    Nickname for Partner (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Love, Baby..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/40 focus:outline-none focus:border-[#E26D54]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] text-[#9992A8] mb-1.5 block font-medium">Email</label>
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/40 focus:outline-none focus:border-[#E26D54]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#9992A8] mb-1.5 block font-medium">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F6F3EE] placeholder-[#9992A8]/40 focus:outline-none focus:border-[#E26D54]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? "Join Us" : "Open Our Space"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer reassurance */}
        <div className="text-center py-2">
          <p className="text-[11px] text-[#9992A8] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E5B268]" />
            Completely private & encrypted for you two only
          </p>
        </div>
      </div>
    </div>
  );
}
