import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Armchair, Clock, Bus, Share2, Printer, Calendar, Route } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBooking } from "@/context/BookingContext";
import { formatPrice, getPickupTime } from "@/data/shuttle-data";
import { useTrips, toTrip } from "@/hooks/use-supabase-data";
import { SkeletonCard } from "@/components/SkeletonCard";
import { toast } from "sonner";

function generateRef(tripId: string, seat: number): string {
  let hash = 0;
  const str = `${tripId}-${seat}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `SG-${Math.abs(hash).toString(36).toUpperCase().slice(0, 4).padEnd(4, "0")}`;
}

export default function ETicket() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { data: dbTrips, isLoading } = useTrips();

  const dbTrip = dbTrips?.find((t) => t.id === booking?.tripId);
  const trip = dbTrip ? toTrip(dbTrip) : null;

  if (!booking || (!isLoading && !trip)) { navigate("/"); return null; }
  if (isLoading || !trip) {
    return <div className="mobile-container min-h-screen bg-background"><ScreenHeader title="E-Ticket" /><div className="px-4 py-6"><SkeletonCard /></div></div>;
  }

  const pickupTime = getPickupTime(trip.departureTime, booking.pickupPoint);
  const bookingRef = generateRef(booking.tripId, booking.seatNumber);

  const qrPayload = JSON.stringify({
    ref: bookingRef,
    t: booking.tripId,
    s: booking.seatNumber,
    d: booking.date,
  });

  const ticketText = [
    `ShuttleGo E-Ticket`,
    `Ref: ${bookingRef}`,
    `Route: ${trip.routeName}`,
    `Date: ${booking.date}`,
    `Pickup: ${booking.pickupPoint.label} — ${booking.pickupPoint.name}`,
    `Pickup Time: ${pickupTime}`,
    `Seat: #${booking.seatNumber}`,
    `Total Paid: ${formatPrice(booking.totalPrice)}`,
  ].join("\n");

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "ShuttleGo Ticket", text: ticketText });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(ticketText);
      toast.success("Ticket details copied to clipboard!");
    }
  };

  const handlePrint = () => window.print();

  const details = [
    { icon: <Route className="w-4 h-4 text-primary" />, label: "Route", value: trip.routeName },
    { icon: <Calendar className="w-4 h-4 text-primary" />, label: "Date", value: booking.date },
    { icon: <MapPin className="w-4 h-4 text-primary" />, label: "Pickup", value: `${booking.pickupPoint.label} — ${booking.pickupPoint.name}` },
    { icon: <Clock className="w-4 h-4 text-shuttle-warning" />, label: "Pickup Time", value: pickupTime },
    { icon: <Armchair className="w-4 h-4 text-secondary" />, label: "Seat", value: `#${booking.seatNumber}` },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background print:bg-white">
      <div className="print:hidden">
        <ScreenHeader title="E-Ticket" onBack={() => navigate("/")} />
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Success header */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center print:hidden">
          <div className="w-16 h-16 rounded-full shuttle-gradient-green flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your ticket is ready</p>
        </motion.div>

        {/* Ticket card */}
        <motion.div id="ticket-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="shuttle-card-elevated overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">ShuttleGo</span>
            </div>
            <Badge className="bg-shuttle-success/15 text-shuttle-success border-0 rounded-lg font-semibold">Paid</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4 font-mono tracking-wider">{bookingRef}</p>

          {/* QR Code */}
          <div className="flex justify-center my-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <QRCodeSVG value={qrPayload} size={160} level="H" />
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mb-4">Show this QR to the driver</p>

          {/* Tear line */}
          <div className="relative my-4">
            <div className="border-t-2 border-dashed border-border" />
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full" />
          </div>

          {/* Trip details */}
          <div className="space-y-3">
            {details.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.icon}
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t border-border/50 mt-4 pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="text-lg font-extrabold text-foreground">{formatPrice(booking.totalPrice)}</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="space-y-3 print:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleShare} className="h-12 rounded-xl font-semibold gap-2">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button variant="outline" onClick={handlePrint} className="h-12 rounded-xl font-semibold gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
          <Button onClick={() => navigate("/tracking")} className="w-full h-13 rounded-xl shuttle-gradient text-primary-foreground font-semibold" size="lg">
            Track Driver
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full h-13 rounded-xl font-semibold" size="lg">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
