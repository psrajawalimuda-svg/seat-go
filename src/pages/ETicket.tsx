import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Armchair, Clock, Bus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBooking } from "@/context/BookingContext";
import { MOCK_TRIPS, formatPrice, getPickupTime } from "@/data/shuttle-data";

export default function ETicket() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const trip = MOCK_TRIPS.find((t) => t.id === booking?.tripId);

  if (!booking || !trip) { navigate("/"); return null; }

  const pickupTime = getPickupTime(trip.departureTime, booking.pickupPoint);

  return (
    <div className="mobile-container min-h-screen bg-background">
      <ScreenHeader title="E-Ticket" onBack={() => navigate("/")} />

      <div className="px-4 py-6 space-y-5">
        {/* Success banner */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-full shuttle-gradient-green flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your ticket is ready</p>
        </motion.div>

        {/* Ticket card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="shuttle-card-elevated overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{trip.routeName}</span>
            </div>
            <Badge className="bg-shuttle-success/15 text-shuttle-success border-0 rounded-lg font-semibold">
              Paid
            </Badge>
          </div>

          {/* QR Code placeholder */}
          <div className="flex justify-center my-4">
            <div className="w-40 h-40 bg-foreground rounded-2xl p-3 flex items-center justify-center">
              <div className="w-full h-full bg-background rounded-xl grid grid-cols-5 grid-rows-5 gap-0.5 p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${Math.random() > 0.4 ? "bg-foreground" : "bg-background"}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mb-4">Show this QR to the driver</p>

          {/* Dashed separator */}
          <div className="relative my-4">
            <div className="border-t-2 border-dashed border-border" />
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
          </div>

          {/* Details */}
          <div className="space-y-3">
            {[
              { icon: <MapPin className="w-4 h-4 text-primary" />, label: "Pickup", value: `${booking.pickupPoint.label} — ${booking.pickupPoint.name}` },
              { icon: <Clock className="w-4 h-4 text-shuttle-warning" />, label: "Pickup Time", value: pickupTime },
              { icon: <Armchair className="w-4 h-4 text-secondary" />, label: "Seat", value: `#${booking.seatNumber}` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 mt-4 pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="text-lg font-extrabold text-foreground">{formatPrice(booking.totalPrice)}</span>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/tracking")}
            className="w-full h-13 rounded-xl shuttle-gradient text-primary-foreground font-semibold"
            size="lg"
          >
            Track Driver
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full h-13 rounded-xl font-semibold"
            size="lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
