import React, { createContext, useContext, useState, ReactNode } from "react";
import { Trip } from "@/data/shuttle-data";

interface DriverState {
  activeTrip: Trip | null;
  isOnline: boolean;
  isDrivingMode: boolean;
  voiceActive: boolean;
}

interface DriverType extends DriverState {
  setActiveTrip: (trip: Trip | null) => void;
  setIsOnline: (online: boolean) => void;
  setIsDrivingMode: (mode: boolean) => void;
  setVoiceActive: (active: boolean) => void;
  playFeedback: (type: "success" | "error" | "action") => void;
}

const DriverContext = createContext<DriverType | undefined>(undefined);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const playFeedback = (type: "success" | "error" | "action") => {
    console.log(`[Audio Feedback] ${type}`);
    if ("vibrate" in navigator) {
      if (type === "success") navigator.vibrate([10, 30, 10]);
      if (type === "error") navigator.vibrate([100, 50, 100]);
      if (type === "action") navigator.vibrate(20);
    }
  };

  return (
    <DriverContext.Provider
      value={{
        activeTrip,
        isOnline,
        isDrivingMode,
        voiceActive,
        setActiveTrip,
        setIsOnline,
        setIsDrivingMode,
        setVoiceActive,
        playFeedback,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used within DriverProvider");
  return ctx;
}
