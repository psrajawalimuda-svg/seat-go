import { useState } from "react";
import { motion } from "framer-motion";
import { Power, TrendingUp, Users, DollarSign, Navigation } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { TripCard } from "@/components/driver/TripCard";
import { useDrivers, useBookings, useTrips, toTrip } from "@/hooks/use-supabase-data";
import { formatPrice } from "@/data/shuttle-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverHome() {
  const [isOnline, setIsOnline] = useState(true);
  const { data: drivers } = useDrivers();
  const { data: allBookings = [] } = useBookings();
  const { data: dbTrips, isLoading } = useTrips();

  const DRIVER = drivers?.[0];
  const allTrips = (dbTrips || []).map(toTrip);

  // Filter trips by driver name (first driver)
  const driverTrips = DRIVER ? allTrips.filter((t) => t.driverName === DRIVER.name) : [];

  const todayBookings = allBookings.filter((b) => b.date === "2026-03-26" && b.status !== "cancelled");
  const todayEarnings = todayBookings
    .filter((b) => driverTrips.some((t) => t.id === b.trip_id))
    .reduce((sum, b) => sum + b.total_price, 0);
  const todayPassengers = todayBookings.filter((b) =>
    driverTrips.some((t) => t.id === b.trip_id)
  ).length;

  const activeTrip = driverTrips[0];

  const stats = [
    { label: "Perjalanan", value: driverTrips.length.toString(), icon: Navigation, color: "text-primary" },
    { label: "Penumpang", value: todayPassengers.toString(), icon: Users, color: "text-secondary" },
    { label: "Pendapatan", value: formatPrice(todayEarnings), icon: DollarSign, color: "text-[hsl(var(--shuttle-warning))]" },
  ];

  return (
    <div className="mobile-container bg-background pb-24">
      <div className="shuttle-gradient px-5 pt-12 pb-8 rounded-b-3xl safe-top">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">Selamat pagi 👋</p>
            <h1 className="text-xl font-bold text-primary-foreground">{DRIVER?.name || "Driver"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary-foreground/80 font-medium">
              {isOnline ? "Online" : "Offline"}
            </span>
            <Switch checked={isOnline} onCheckedChange={setIsOnline} className="data-[state=checked]:bg-secondary" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <s.icon className="w-5 h-5 text-primary-foreground/80 mx-auto mb-1" />
              <p className="text-base font-bold text-primary-foreground">{s.value}</p>
              <p className="text-[10px] text-primary-foreground/70">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <>
            {activeTrip && (
              <div>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  Perjalanan Aktif
                </h2>
                <TripCard trip={activeTrip} status="active" />
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold text-foreground mb-2">Perjalanan Hari Ini</h2>
              <div className="space-y-3">
                {driverTrips.slice(1).map((trip) => (
                  <TripCard key={trip.id} trip={trip} status="upcoming" />
                ))}
                {driverTrips.length <= 1 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Tidak ada perjalanan lain hari ini</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <DriverBottomNav />
    </div>
  );
}
