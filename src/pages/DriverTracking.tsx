import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Navigation, Bus, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBooking } from "@/context/BookingContext";
import { MOCK_TRIPS, getPickupTime } from "@/data/shuttle-data";

export default function DriverTracking() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const trip = MOCK_TRIPS.find((t) => t.id === booking?.tripId);
  const [eta, setEta] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!booking || !trip) { navigate("/"); return null; }

  const pickupTime = getPickupTime(trip.departureTime, booking.pickupPoint);

  return (
    <div className="mobile-container min-h-screen bg-background">
      <ScreenHeader title="Track Driver" />

      <div className="px-4 py-4 space-y-4">
        {/* Map placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-64 rounded-2xl bg-primary-light relative overflow-hidden"
        >
          {/* Simulated map */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="absolute border-t border-primary/20" style={{ top: `${(i + 1) * 12}%`, left: 0, right: 0 }} />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute border-l border-primary/20" style={{ left: `${(i + 1) * 16}%`, top: 0, bottom: 0 }} />
            ))}
          </div>

          {/* Route line */}
          <div className="absolute top-1/2 left-[15%] right-[20%] h-1 bg-primary/30 rounded-full">
            <motion.div
              initial={{ width: "30%" }}
              animate={{ width: `${Math.min(90, 100 - eta * 8)}%` }}
              transition={{ duration: 2 }}
              className="h-full shuttle-gradient rounded-full"
            />
          </div>

          {/* Driver marker */}
          <motion.div
            initial={{ left: "25%" }}
            animate={{ left: `${Math.min(70, 80 - eta * 5)}%` }}
            transition={{ duration: 2 }}
            className="absolute top-1/2 -translate-y-1/2"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full shuttle-gradient flex items-center justify-center shadow-lg">
                <Bus className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary/20 rounded-full blur-sm" />
            </div>
          </motion.div>

          {/* Pickup marker */}
          <div className="absolute top-1/2 right-[18%] -translate-y-1/2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
        </motion.div>

        {/* ETA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="shuttle-card-elevated"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl shuttle-gradient flex items-center justify-center">
              <Navigation className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">Driver is approaching</p>
              <p className="text-sm text-muted-foreground">Estimated arrival in <span className="font-bold text-primary">{eta} min</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground">
                {trip.driverName.split(" ")[1]?.[0] || "D"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{trip.driverName}</p>
              <p className="text-xs text-muted-foreground">{trip.vehiclePlate}</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl shuttle-gradient-green text-secondary-foreground font-semibold"
              onClick={() => window.open(`tel:${trip.driverPhone}`)}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </Button>
          </div>
        </motion.div>

        {/* Trip info */}
        <div className="shuttle-card space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              <span className="font-semibold">{booking.pickupPoint.label}</span> — {booking.pickupPoint.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-shuttle-warning" />
            <span className="text-sm text-foreground">Pickup at <span className="font-semibold">{pickupTime}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
