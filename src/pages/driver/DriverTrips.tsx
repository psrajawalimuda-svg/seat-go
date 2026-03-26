import { useState } from "react";
import { motion } from "framer-motion";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { TripCard } from "@/components/driver/TripCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useTrips, toTrip } from "@/hooks/use-supabase-data";
import { SkeletonCard } from "@/components/SkeletonCard";

const tabs = ["Hari Ini", "Akan Datang", "Riwayat"] as const;

export default function DriverTrips() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Hari Ini");
  const { data: dbTrips, isLoading } = useTrips();

  const allTrips = (dbTrips || []).map(toTrip);

  const getStatus = (tab: string) => {
    if (tab === "Riwayat") return "completed" as const;
    if (tab === "Akan Datang") return "upcoming" as const;
    return "upcoming" as const;
  };

  const trips =
    activeTab === "Riwayat"
      ? allTrips.slice(-2)
      : activeTab === "Akan Datang"
      ? allTrips.slice(2, 4)
      : allTrips;

  return (
    <div className="mobile-container bg-background pb-24">
      <ScreenHeader title="Perjalanan Saya" />

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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
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
          </>
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}
