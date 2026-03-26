import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BottomCTA } from "@/components/BottomCTA";
import { useBooking } from "@/context/BookingContext";
import { formatPrice } from "@/data/shuttle-data";
import { useTrips, toTrip } from "@/hooks/use-supabase-data";
import { SkeletonCard } from "@/components/SkeletonCard";
import { cn } from "@/lib/utils";

type SeatStatus = "available" | "booked" | "selected";

function SeatIcon({ status, number, onSelect }: { status: SeatStatus; number: number; onSelect: () => void }) {
  return (
    <motion.button
      whileTap={status === "available" ? { scale: 0.9 } : {}}
      onClick={status !== "booked" ? onSelect : undefined}
      disabled={status === "booked"}
      className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-colors relative",
        status === "available" && "bg-primary-light text-primary border-2 border-primary/20 tap-highlight",
        status === "selected" && "shuttle-gradient text-primary-foreground shadow-md animate-seat-pop",
        status === "booked" && "bg-muted text-muted-foreground/40 cursor-not-allowed"
      )}
    >
      {status === "booked" ? <User className="w-4 h-4" /> : number}
    </motion.button>
  );
}

export default function SeatSelection() {
  const navigate = useNavigate();
  const { selectedTripId, selectedSeat, setSelectedSeat } = useBooking();
  const { data: dbTrips, isLoading } = useTrips();

  const trip = dbTrips ? toTrip(dbTrips.find((t) => t.id === selectedTripId)!) : null;

  if (!isLoading && !trip) { navigate("/"); return null; }

  if (isLoading || !trip) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <ScreenHeader title="Choose Your Seat" />
        <div className="px-4 py-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  const cols = trip.totalSeats <= 12 ? 3 : 4;
  const rows = Math.ceil(trip.totalSeats / cols);

  const getSeatStatus = (num: number): SeatStatus => {
    if (trip.bookedSeats.includes(num)) return "booked";
    if (selectedSeat === num) return "selected";
    return "available";
  };

  const handleContinue = () => {
    if (selectedSeat) navigate("/checkout");
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <ScreenHeader title="Choose Your Seat" />
      <div className="px-4 py-4 space-y-5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="shuttle-card-elevated">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/50">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Driver</span>
            <div className="ml-auto text-xs text-muted-foreground">Front</div>
          </div>
          <div className="flex flex-col items-center gap-2.5">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className="flex gap-2.5 items-center">
                {Array.from({ length: cols }).map((_, col) => {
                  const seatNum = row * cols + col + 1;
                  if (seatNum > trip.totalSeats) return <div key={col} className="w-12 h-12" />;
                  const isAfterAisle = cols === 4 && col === 2;
                  return (
                    <div key={col} className={cn("flex", isAfterAisle && "ml-4")}>
                      <SeatIcon number={seatNum} status={getSeatStatus(seatNum)} onSelect={() => setSelectedSeat(selectedSeat === seatNum ? null : seatNum)} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
        <div className="flex items-center justify-center gap-5">
          {[
            { color: "bg-primary-light border-2 border-primary/20", label: "Available" },
            { color: "shuttle-gradient", label: "Selected" },
            { color: "bg-muted", label: "Booked" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={cn("w-5 h-5 rounded-md", item.color)} />
              <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {selectedSeat && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="shuttle-card bg-shuttle-success-light border-shuttle-success/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Seat #{selectedSeat}</p>
                  <p className="text-xs text-muted-foreground">{trip.routeName}</p>
                </div>
                <p className="text-lg font-extrabold text-foreground">{formatPrice(trip.basePrice)}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomCTA onClick={handleContinue} disabled={!selectedSeat} subtitle={selectedSeat ? `Seat #${selectedSeat} selected` : undefined}>
        Continue
      </BottomCTA>
    </div>
  );
}
