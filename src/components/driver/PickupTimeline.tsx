import { Check, MapPin } from "lucide-react";
import { PickupPoint, getPickupTime } from "@/data/shuttle-data";
import { MOCK_BOOKINGS, BookingRecord } from "@/data/admin-data";

interface PickupTimelineProps {
  points: PickupPoint[];
  departureTime: string;
  tripId: string;
  currentStopIndex: number;
}

export function PickupTimeline({
  points,
  departureTime,
  tripId,
  currentStopIndex,
}: PickupTimelineProps) {
  const bookings = MOCK_BOOKINGS.filter(
    (b) => b.tripId === tripId && b.status !== "cancelled"
  );

  const getPassengersAtStop = (pointId: string): BookingRecord[] =>
    bookings.filter((b) => b.pickupPointId === pointId);

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

      {points.map((point, idx) => {
        const passengers = getPassengersAtStop(point.id);
        const isCompleted = idx < currentStopIndex;
        const isCurrent = idx === currentStopIndex;
        const time = getPickupTime(departureTime, point);

        return (
          <div key={point.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
            {/* Dot */}
            <div
              className={`absolute left-0 w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 text-xs font-bold border-2 ${
                isCompleted
                  ? "bg-secondary border-secondary text-secondary-foreground"
                  : isCurrent
                  ? "shuttle-gradient border-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : point.label}
            </div>

            {/* Content */}
            <div className="ml-[22px] flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-semibold ${
                    isCurrent ? "text-primary" : isCompleted ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {point.name}
                </p>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>

              {passengers.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {passengers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <MapPin className="w-3 h-3 text-secondary" />
                      <span className="font-medium text-foreground">{p.passengerName}</span>
                      <span>• Kursi {p.seatNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
