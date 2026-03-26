import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, UserCheck, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MOCK_BOOKINGS, BookingRecord } from "@/data/admin-data";
import { MOCK_TRIPS, PICKUP_POINTS } from "@/data/shuttle-data";

export default function DriverPassengers() {
  const [expandedTrip, setExpandedTrip] = useState<string | null>("t1");
  const [boardedIds, setBoardedIds] = useState<Set<string>>(new Set());

  const driverTrips = MOCK_TRIPS.filter((t) => t.driverName === "Pak Ahmad");

  const toggleBoarded = (id: string) => {
    setBoardedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getPickupName = (id: string) =>
    PICKUP_POINTS.find((p) => p.id === id)?.name || id;

  const getPickupLabel = (id: string) =>
    PICKUP_POINTS.find((p) => p.id === id)?.label || id;

  return (
    <div className="mobile-container bg-background pb-24">
      <ScreenHeader title="Daftar Penumpang" />

      <div className="px-4 py-3 space-y-3">
        {driverTrips.map((trip) => {
          const passengers = MOCK_BOOKINGS.filter(
            (b) => b.tripId === trip.id && b.status !== "cancelled"
          );
          const isOpen = expandedTrip === trip.id;

          return (
            <div key={trip.id} className="shuttle-card">
              {/* Trip header */}
              <button
                onClick={() => setExpandedTrip(isOpen ? null : trip.id)}
                className="w-full flex items-center justify-between tap-highlight"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{trip.routeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.departureTime} • {passengers.length} penumpang
                  </p>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Passengers */}
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 space-y-2"
                >
                  {passengers.map((p) => {
                    const boarded = boardedIds.has(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          boarded
                            ? "bg-secondary/10 border-secondary/30"
                            : "bg-muted/30 border-border/50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {p.passengerName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {getPickupLabel(p.pickupPointId)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Kursi {p.seatNumber}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => window.open(`tel:${p.passengerPhone}`)}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="icon"
                          variant={boarded ? "default" : "outline"}
                          className={`h-8 w-8 rounded-lg ${
                            boarded ? "shuttle-gradient-green text-secondary-foreground" : ""
                          }`}
                          onClick={() => toggleBoarded(p.id)}
                        >
                          {boarded ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    );
                  })}

                  {passengers.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Belum ada penumpang
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <DriverBottomNav />
    </div>
  );
}
