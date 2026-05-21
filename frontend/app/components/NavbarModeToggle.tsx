"use client";
import { useState } from "react";
import { useMode } from "./ModeProvider";

type ModalType = "18plus" | "21plus" | null;

export default function NavbarModeToggle() {
  const { mode, setMode } = useMode();
  const [showModal, setShowModal] = useState<ModalType>(null);
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");

  function openModal(type: ModalType) {
    setShowModal(type);
    setError("");
    setBirthYear("");
  }

  function handleToggleClick(target: "pg13" | "adult" | "21plus") {
    if (target === "pg13") {
      setMode("pg13");
    } else if (target === "adult") {
      if (mode === "adult") {
        setMode("pg13");
      } else {
        openModal("18plus");
      }
    } else {
      if (mode === "21plus") {
        setMode("pg13");
      } else {
        openModal("21plus");
      }
    }
  }

  function handleVerify() {
    const year = parseInt(birthYear, 10);
    const currentYear = new Date().getFullYear();
    const minAge = showModal === "21plus" ? 21 : 18;

    if (!year || year < 1900 || year > currentYear) {
      setError("Please enter a valid birth year.");
      return;
    }
    if (currentYear - year < minAge) {
      setError(`You must be ${minAge} or older to access this mode.`);
      return;
    }

    setMode(showModal === "21plus" ? "21plus" : "adult");
    setShowModal(null);
  }

  const warningTitle = showModal === "21plus"
    ? <>Warning! ！！<br />FBI And Tony Tryna Make Sure You're Over 21.</>
    : <>Warning! ！！<br />FBI And Tony Tryna Make Sure You're Over 18.</>;

  const enterLabel = showModal === "21plus" ? "I'm 21+ — Enter" : "I'm 18+ — Enter";
  const bodyText = showModal === "21plus"
    ? "This mode contains exclusive content. Federal law requires us to verify your age before granting access. Enter your birth year to confirm you are 21 or older."
    : "This mode contains adult content. Federal law requires us to verify your age before granting access. Enter your birth year to confirm you are 18 or older.";

  return (
    <>
      {/* Toggle buttons */}
      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => handleToggleClick("adult")}
          className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors whitespace-nowrap ${
            mode === "adult"
              ? "bg-red-600 border-red-500 text-white hover:bg-red-700"
              : "bg-white/10 border-white/30 text-white hover:bg-white/20"
          }`}
        >
          {mode === "adult" ? "🔞 18+" : "🟢 PG-13"}
        </button>

        <button
          onClick={() => handleToggleClick("21plus")}
          className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors whitespace-nowrap ${
            mode === "21plus"
              ? "bg-yellow-500 border-yellow-400 text-black hover:bg-yellow-600"
              : "bg-white/10 border-white/30 text-white hover:bg-white/20"
          }`}
        >
          {mode === "21plus" ? "🌟 21+" : "21+"}
        </button>
      </div>

      {/* 21+ special screen — shown as full overlay when active */}
      {mode === "21plus" && (
        <div
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-8 px-6"
          style={{ backgroundImage: "url('/doubao.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <p className="relative text-white text-center font-black text-xl leading-relaxed max-w-lg">
            Stay tuned for Fumble.ai 2.0. No funds available for new APIs.<br />
            Contact developers for donations.
          </p>
          <button
            onClick={() => setMode("pg13")}
            className="relative px-6 py-2 border border-white text-white text-sm font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Go Back
          </button>
        </div>
      )}

      {/* Age Verification Modal (shared for 18+ and 21+) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black px-6">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">

            {/* FBI WARNING label */}
            <div className="bg-red-600 px-6 py-2">
              <span className="text-white font-black text-2xl tracking-widest uppercase">FBI WARNING</span>
            </div>

            {/* Warning body text */}
            <p className="text-white text-center text-lg font-bold leading-relaxed max-w-xl">
              {warningTitle}
              <br /><br />
              {bodyText}
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
                onClick={() => setShowModal(null)}
                className="px-6 py-2 border border-white text-white text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                className="px-6 py-2 bg-red-600 text-white text-sm font-black tracking-widest uppercase hover:bg-red-700 transition-colors"
              >
                {enterLabel}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
