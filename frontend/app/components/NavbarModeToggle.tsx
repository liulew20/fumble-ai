"use client";
import { useState } from "react";
import { useMode } from "./ModeProvider";

export default function NavbarModeToggle() {
  const { mode, setMode } = useMode();
  const [showModal, setShowModal] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");

  function handleToggle() {
    if (mode === "adult") {
      setMode("pg13");
    } else {
      setShowModal(true);
      setError("");
      setBirthYear("");
    }
  }

  function handleVerify() {
    const year = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    if (!year || year < 1900 || year > currentYear) {
      setError("Please enter a valid birth year.");
      return;
    }
    if (currentYear - year < 18) {
      setError("You must be 18 or older to access this mode.");
      return;
    }
    setMode("adult");
    setShowModal(false);
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors whitespace-nowrap ${
          mode === "adult"
            ? "bg-red-600 border-red-500 text-white hover:bg-red-700"
            : "bg-white/10 border-white/30 text-white hover:bg-white/20"
        }`}
      >
        {mode === "adult" ? "🔞 18+" : "🟢 PG-13"}
      </button>

      {/* Age Verification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Warning header */}
            <div className="bg-red-600 px-6 py-5 text-center">
              <h2 className="text-lg font-extrabold text-white leading-snug">
                Warning! ！！<br />FBI And Daddy Tony Tryna Make Sure You're Over 18
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <p className="text-sm text-gray-600 text-center">
                This mode contains adult content. Enter your birth year to confirm you are 18 or older.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Birth Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1995"
                  value={birthYear}
                  onChange={(e) => { setBirthYear(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                >
                  I'm 18+ — Let Me In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
