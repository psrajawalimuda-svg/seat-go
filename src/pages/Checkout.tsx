import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Armchair, Clock, CreditCard, Wallet, QrCode } from "lucide-react";
import { format } from "date-fns";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomCTA } from "@/components/BottomCTA";
import { useBooking } from "@/context/BookingContext";
import { MOCK_TRIPS, formatPrice, getPickupTime } from "@/data/shuttle-data";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PAYMENT_METHODS = [
  { id: "ewallet", label: "E-Wallet", icon: Wallet, detail: "GoPay, OVO, Dana" },
  { id: "bank", label: "Bank Transfer", icon: CreditCard, detail: "BCA, Mandiri, BNI" },
  { id: "qr", label: "QR Payment", icon: QrCode, detail: "QRIS compatible" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { pickupPoint, destination, date, selectedTripId, selectedSeat, setBooking } = useBooking();
  const [paymentMethod, setPaymentMethod] = useState("ewallet");
  const trip = MOCK_TRIPS.find((t) => t.id === selectedTripId);

  if (!trip || !pickupPoint || !selectedSeat || !date) { navigate("/"); return null; }

  const pickupTime = getPickupTime(trip.departureTime, pickupPoint);

  const handlePay = () => {
    setBooking({
      tripId: trip.id,
      pickupPoint,
      seatNumber: selectedSeat,
      date: format(date, "yyyy-MM-dd"),
      destination,
      totalPrice: trip.basePrice,
    });
    navigate("/ticket");
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <ScreenHeader title="Checkout" />

      <div className="px-4 py-4 space-y-4">
        {/* Booking summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="shuttle-card-elevated space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Booking Summary</h3>

          <div className="space-y-3">
            {[
              { icon: <MapPin className="w-4 h-4 text-primary" />, label: "Pickup", value: `${pickupPoint.label} — ${pickupPoint.name}` },
              { icon: <Clock className="w-4 h-4 text-shuttle-warning" />, label: "Pickup Time", value: pickupTime },
              { icon: <Armchair className="w-4 h-4 text-secondary" />, label: "Seat", value: `#${selectedSeat}` },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold text-foreground">{formatPrice(trip.basePrice)}</span>
          </div>
        </motion.div>

        {/* Route visualization */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="shuttle-card"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Route</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const isPickup = i === 0;
              const isDestination = i === 4;
              return (
                <div key={i} className="flex items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    isPickup ? "shuttle-gradient text-primary-foreground" : isDestination ? "shuttle-gradient-green text-secondary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {isPickup ? pickupPoint.label : isDestination ? "🏁" : `J${pickupPoint.order + i}`}
                  </div>
                  {!isDestination && <div className="w-6 h-0.5 bg-border mx-0.5" />}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Payment methods */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="shuttle-card-elevated space-y-3"
        >
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Payment Method</h3>
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all tap-highlight",
                  isSelected ? "border-primary bg-primary-light" : "border-border/50 bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isSelected ? "shuttle-gradient" : "bg-muted"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? "text-primary-foreground" : "text-muted-foreground")} />
                </div>
                <div className="text-left flex-1">
                  <p className={cn("text-sm font-semibold", isSelected ? "text-foreground" : "text-foreground")}>{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.detail}</p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2",
                  isSelected ? "border-primary bg-primary" : "border-border"
                )}>
                  {isSelected && <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>}
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>

      <BottomCTA onClick={handlePay} subtitle={formatPrice(trip.basePrice)}>
        Pay Now
      </BottomCTA>
    </div>
  );
}
