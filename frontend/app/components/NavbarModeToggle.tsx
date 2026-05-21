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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black px-6">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">

            {/* FBI WARNING label */}
            <div className="bg-red-600 px-6 py-2">
              <span className="text-white font-black text-2xl tracking-widest uppercase">FBI WARNING</span>
            </div>

            {/* Warning body text */}
            <p className="text-white text-center text-lg font-bold leading-relaxed max-w-xl">
              Warning! ！！<br />
              FBI And Tony Tryna Make Sure You're Over 18.<br /><br />
              This mode contains adult content. Federal law requires us to verify your age before granting access. Enter your birth year to confirm you are 18 or older.
            </p>

            {/* Input */}
            <div className="w-full max-w-xs flex flex-col gap-2">
              <input
                type="number"
                placeholder="Enter birth year (e.g. 1995)"
                value={birthYear}
                onChange={(e) => { setBirthYear(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="w-full bg-transparent border border-white text-white placeholder-gray-500 px-4 py-2 text-center text-sm focus:outline-none focus:border-red-500"
                min="1900"
                max={new Date().getFullYear()}
              />
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-white text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                className="px-6 py-2 bg-red-600 text-white text-sm font-black tracking-widest uppercase hover:bg-red-700 transition-colors"
              >
                I'm 18+ — Enter
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
