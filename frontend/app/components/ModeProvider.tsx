"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "pg13" | "adult" | "21plus";

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
}

const ModeContext = createContext<ModeContextValue>({ mode: "pg13", setMode: () => {} });

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("pg13");

  useEffect(() => {
    const saved = localStorage.getItem("fumble_mode") as Mode | null;
    if (saved === "adult" || saved === "21plus") setModeState(saved);
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("fumble_mode", m);
  }

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  return useContext(ModeContext);
}
