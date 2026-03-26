import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Users, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Trip, formatPrice } from "@/data/shuttle-data";
import { MOCK_BOOKINGS } from "@/data/admin-data";

interface TripCardProps {
  trip: Trip;
  status?: "upcoming" | "active" | "completed";
}

export function TripCard({ trip, status = "upcoming" }: TripCardProps) {
  const navigate = useNavigate();
  const passengers = MOCK_BOOKINGS.filter(
    (b) => b.tripId === trip.id && b.status !== "cancelled"
  ).length;

  const statusConfig = {
    upcoming: { label: "Akan Datang", className: "bg-accent text-accent-foreground" },
    active: { label: "Sedang Jalan", className: "shuttle-gradient text-primary-foreground" },
    completed: { label: "Selesai", className: "bg-muted text-muted-foreground" },
  };

  const s = statusConfig[status];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/driver/trip/${trip.id}`)}
      className="shuttle-card cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">{trip.routeName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{trip.departureTime}</span>
          </div>
        </div>
        <Badge variant="secondary" className={s.className}>
          {s.label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{passengers}/{trip.totalSeats} kursi</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{trip.vehiclePlate}</span>
        </div>
        <span className="ml-auto font-semibold text-foreground">
          {formatPrice(trip.basePrice)}
        </span>
      </div>
    </motion.div>
  );
}
