import { useState } from "react";
import { motion } from "framer-motion";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { TripCard } from "@/components/driver/TripCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MOCK_TRIPS } from "@/data/shuttle-data";

const tabs = ["Hari Ini", "Akan Datang", "Riwayat"] as const;

export default function DriverTrips() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Hari Ini");

  const getStatus = (tab: string) => {
    if (tab === "Riwayat") return "completed" as const;
    if (tab === "Akan Datang") return "upcoming" as const;
    return "upcoming" as const;
  };

  // Simulate: first trip active today, rest upcoming, last 2 history
  const trips =
    activeTab === "Riwayat"
      ? MOCK_TRIPS.slice(-2)
      : activeTab === "Akan Datang"
      ? MOCK_TRIPS.slice(2, 4)
      : MOCK_TRIPS;

  return (
    <div className="mobile-container bg-background pb-24">
      <ScreenHeader title="Perjalanan Saya" />

      {/* Tabs */}
      <div className="px-4 pt-2 pb-3 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === tab
                ? "shuttle-gradient text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {trips.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <TripCard trip={trip} status={getStatus(activeTab)} />
          </motion.div>
        ))}
        {trips.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">
            Belum ada perjalanan
          </p>
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}
