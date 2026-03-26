import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Trip, Booking } from "@/data/shuttle-data";
import { v4 as uuidv4 } from "uuid";

// --- Enums and Types for Simulation ---
export type TrafficLevel = "low" | "medium" | "high" | "rush_hour";
export type WeatherCondition = "clear" | "rain" | "fog" | "storm";
export type DriverEventType = "road_closure" | "heavy_traffic" | "passenger_issue";

export interface DriverEvent {
  id: string;
  type: DriverEventType;
  message: string;
  timestamp: number;
}

// --- Main State and Context Types ---
interface DriverState {
  activeTrip: Trip | null;
  isOnline: boolean;
  isDrivingMode: boolean;
  voiceActive: boolean;
  
  // Trip Progress
  currentStopIndex: number;
  bookings: Booking[];

  // Simulation & Gamification
  trafficLevel: TrafficLevel;
  weather: WeatherCondition;
  stressLevel: number; // 0-100
  fatigueLevel: number; // 0-100
  activeEvents: DriverEvent[];
  etaAdjustment: number; // in minutes
  difficulty: number; // 1-5
  scheduleDeviation: number; // in minutes
  locationVerified: boolean;
}

interface DriverType extends DriverState {
  // Core Actions
  setActiveTrip: (trip: Trip | null) => void;
  setIsOnline: (online: boolean) => void;
  setIsDrivingMode: (mode: boolean) => void;
  setVoiceActive: (active: boolean) => void;
  playFeedback: (type: "success" | "error" | "action") => void;

  // Trip Management
  nextStop: () => void;
  prevStop: () => void;
  setBookings: (bookings: Booking[]) => void;

  // Event & Simulation Management
  addEvent: (event: Omit<DriverEvent, "id" | "timestamp">) => void;
  resolveEvent: (id: string) => void;
  setScheduleDeviation: (deviation: number) => void;
  setLocationVerified: (verified: boolean) => void;
}

const DriverContext = createContext<DriverType | undefined>(undefined);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  
  // Trip State
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Simulation State
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("low");
  const [weather, setWeather] = useState<WeatherCondition>("clear");
  const [stressLevel, setStressLevel] = useState(10);
  const [fatigueLevel, setFatigueLevel] = useState(5);
  const [activeEvents, setActiveEvents] = useState<DriverEvent[]>([]);
  const [etaAdjustment, setEtaAdjustment] = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [scheduleDeviation, setScheduleDeviation] = useState(0);
  const [locationVerified, setLocationVerified] = useState(false);

  const playFeedback = useCallback((type: "success" | "error" | "action") => {
    console.log(`[Audio Feedback] ${type}`);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      if (type === "success") navigator.vibrate([10, 30, 10]);
      if (type === "error") navigator.vibrate([100, 50, 100]);
      if (type === "action") navigator.vibrate(20);
    }
  }, []);

  const nextStop = useCallback(() => {
    if (!activeTrip) return;
    const totalStops = activeTrip.pickupPoints.length;
    setCurrentStopIndex((prev) => Math.min(prev + 1, totalStops));
    setLocationVerified(false); // Require re-verification at next stop
    playFeedback("action");
  }, [activeTrip, playFeedback]);

  const prevStop = useCallback(() => {
    setCurrentStopIndex((prev) => Math.max(prev - 1, 0));
    setLocationVerified(true); // Assume previous stop was verified
    playFeedback("action");
  }, [playFeedback]);

  const addEvent = useCallback((event: Omit<DriverEvent, "id" | "timestamp">) => {
    const newEvent: DriverEvent = {
      ...event,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    setActiveEvents((prev) => [...prev, newEvent]);
    playFeedback("error");
  }, [playFeedback]);

  const resolveEvent = useCallback((id: string) => {
    setActiveEvents((prev) => prev.filter((e) => e.id !== id));
    playFeedback("success");
  }, [playFeedback]);

  const handleSetActiveTrip = (trip: Trip | null) => {
    setActiveTrip(trip);
    // Reset all trip-related states when a new trip is set or trip ends
    if (trip) {
      setCurrentStopIndex(0);
      setScheduleDeviation(0);
      setLocationVerified(false);
      // Here you would fetch bookings for the trip
      // setBookings(fetchedBookings); 
    } else {
      // Reset all states to default when trip is cleared
      setCurrentStopIndex(0);
      setBookings([]);
      setScheduleDeviation(0);
      setLocationVerified(false);
      setIsDrivingMode(false);
    }
  };

  return (
    <DriverContext.Provider
      value={{
        activeTrip,
        isOnline,
        isDrivingMode,
        voiceActive,
        setActiveTrip: handleSetActiveTrip,
        setIsOnline,
        setIsDrivingMode,
        setVoiceActive,
        playFeedback,
        currentStopIndex,
        bookings,
        setBookings,
        trafficLevel,
        weather,
        stressLevel,
        fatigueLevel,
        activeEvents,
        etaAdjustment,
        difficulty,
        scheduleDeviation,
        locationVerified,
        nextStop,
        prevStop,
        addEvent,
        resolveEvent,
        setScheduleDeviation,
        setLocationVerified,
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
