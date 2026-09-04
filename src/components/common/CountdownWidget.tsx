"use client";

import { useState } from "react";
import { Calendar, Plane, Edit3, Sparkles } from "lucide-react";
import { differenceInDays, format } from "date-fns";

interface CountdownWidgetProps {
  anniversaryDate?: string | null;
  nextVisitDate?: string | null;
  onUpdateDates?: () => void;
}

export function CountdownWidget({
  anniversaryDate,
  nextVisitDate,
  onUpdateDates,
}: CountdownWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [annivInput, setAnnivInput] = useState(
    anniversaryDate ? format(new Date(anniversaryDate), "yyyy-MM-dd") : ""
  );
  const [visitInput, setVisitInput] = useState(
    nextVisitDate ? format(new Date(nextVisitDate), "yyyy-MM-dd") : ""
  );
  const [saving, setSaving] = useState(false);

  // Calculate days together
  const daysTogether = anniversaryDate
    ? Math.max(0, differenceInDays(new Date(), new Date(anniversaryDate)))
    : null;

  // Calculate days until next visit
  const daysUntilVisit = nextVisitDate
    ? Math.max(0, differenceInDays(new Date(nextVisitDate), new Date()))
    : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/couple", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anniversaryDate: annivInput ? new Date(annivInput).toISOString() : null,
          nextVisitDate: visitInput ? new Date(visitInput).toISOString() : null,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        if (onUpdateDates) onUpdateDates();
      }
    } catch (err) {
      console.error("Save dates error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative rounded-3xl bg-[#171520] border border-[#292536] p-6 sm:p-8 shadow-sm text-center">
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-4 right-4 p-2 rounded-xl text-[#9992A8] hover:text-[#F6F3EE] hover:bg-white/[0.04] transition-colors"
        title="Set dates"
      >
        <Edit3 className="w-4 h-4" />
      </button>

      {/* Days Together Display */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-[#9992A8] font-medium mb-2 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E5B268]" />
          <span>Days in our story</span>
        </p>

        {daysTogether !== null ? (
          <div className="flex flex-col items-center">
            <span
              className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#F6F3EE] font-serif"
            >
              {daysTogether}
            </span>
            <span className="text-xs text-[#9992A8] mt-1">
              since {format(new Date(anniversaryDate!), "MMMM d, yyyy")}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 text-xs py-2.5 px-4 rounded-xl border border-dashed border-[#E26D54]/50 text-[#E26D54] hover:bg-[#E26D54]/10 transition-colors"
          >
            + Tap to set your anniversary date
          </button>
        )}
      </div>

      {/* Next Visit Card */}
      <div className="pt-4 border-t border-[#242031] flex items-center justify-between px-2 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E26D54]/15 flex items-center justify-center text-[#E26D54]">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#9992A8]">Next time we hold each other</p>
            {daysUntilVisit !== null ? (
              <p className="text-sm font-semibold text-[#F6F3EE]">
                {daysUntilVisit === 0 ? "Today! 🎉" : `${daysUntilVisit} days to go`}
              </p>
            ) : (
              <p className="text-xs text-[#9992A8]/80 italic">No date set yet</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="text-xs font-medium text-[#E5B268] hover:underline"
        >
          {daysUntilVisit !== null ? "Edit" : "+ Set date"}
        </button>
      </div>

      {/* Edit Dates Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#171520] border border-[#292536] rounded-3xl p-6 shadow-2xl text-left">
            <h3 className="text-lg font-bold text-[#F6F3EE] mb-1 font-serif">Our Special Dates</h3>
            <p className="text-xs text-[#9992A8] mb-5 leading-relaxed">
              Keep track of how long you’ve been together and count down to your next flight.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-[#9992A8] mb-1.5 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#E26D54]" />
                  Anniversary / When we started
                </label>
                <input
                  type="date"
                  value={annivInput}
                  onChange={(e) => setAnnivInput(e.target.value)}
                  className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F3EE] focus:outline-none focus:border-[#E26D54]"
                />
              </div>

              <div>
                <label className="text-xs text-[#9992A8] mb-1.5 font-medium flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-[#E5B268]" />
                  Next Visit / Flight Date
                </label>
                <input
                  type="date"
                  value={visitInput}
                  onChange={(e) => setVisitInput(e.target.value)}
                  className="w-full bg-[#100F17] border border-[#292536] rounded-xl px-3.5 py-2.5 text-xs text-[#F6F3EE] focus:outline-none focus:border-[#E5B268]"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#292536] text-xs font-medium text-[#9992A8] hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#E26D54] hover:bg-[#D05E46] text-[#0E0D13] text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Dates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
