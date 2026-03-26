import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Navigation, MapPin, Clock, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBooking } from "@/context/BookingContext";
import { getPickupTime } from "@/data/shuttle-data";
import { useTrips, usePickupPoints, toTrip } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SkeletonCard } from "@/components/SkeletonCard";

const makeBusIcon = (bearing: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,0.5);border:3px solid white;transform:rotate(${bearing}deg)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L19 21l-7-4-7 4z"/></svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const makeStopIcon = (label: string, isSelected: boolean, isCompleted: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${isSelected ? 28 : 22}px;height:${isSelected ? 28 : 22}px;border-radius:50%;background:${
      isCompleted ? "hsl(152,69%,45%)" : isSelected ? "linear-gradient(135deg,hsl(152,69%,45%),hsl(152,69%,55%))" : "white"
    };border:2px solid ${isSelected || isCompleted ? "hsl(152,69%,40%)" : "hsl(217,91%,50%)"};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:${isSelected ? 10 : 8}px;font-weight:700;color:${isSelected || isCompleted ? "white" : "hsl(217,91%,50%)"};font-family:sans-serif">${isCompleted ? "✓" : label}</div>`,
    iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
    iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
  });

function LiveBusMarker({ position, bearing }: { position: [number, number]; bearing: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true, duration: 0.8 });
  }, [position, map]);
  const icon = useMemo(() => makeBusIcon(bearing), [bearing]);
  return <Marker position={position} icon={icon}><Popup>🚌 Posisi driver saat ini</Popup></Marker>;
}

interface DriverLocation {
  latitude: number; longitude: number; bearing: number; speed: number; current_stop_index: number; updated_at: string;
}

export default function DriverTracking() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { data: dbTrips, isLoading: tripsLoading } = useTrips();
  const { data: pickupPoints = [], isLoading: ppLoading } = usePickupPoints();

  const dbTrip = dbTrips?.find((t) => t.id === booking?.tripId);
  const trip = dbTrip ? toTrip(dbTrip) : null;

  const [driverLoc, setDriverLoc] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!booking?.tripId) return;
    const fetchLocation = async () => {
      const { data } = await supabase.from("driver_locations").select("*").eq("trip_id", booking.tripId).maybeSingle();
      if (data) { setDriverLoc(data as DriverLocation); setIsConnected(true); }
    };
    fetchLocation();
    const channel = supabase.channel(`driver-loc-${booking.tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations", filter: `trip_id=eq.${booking.tripId}` },
        (payload) => { if (payload.new) { setDriverLoc(payload.new as DriverLocation); setIsConnected(true); } })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [booking?.tripId]);

  if (!booking || (!(tripsLoading || ppLoading) && !trip)) { navigate("/"); return null; }
  if (tripsLoading || ppLoading || !trip) {
    return <div className="mobile-container min-h-screen bg-background"><ScreenHeader title="Lacak Driver" /><div className="px-4 py-4"><SkeletonCard /><SkeletonCard /></div></div>;
  }

  const ROUTE_COORDS = pickupPoints.map((p) => p.coords);
  const pickupTime = getPickupTime(trip.departureTime, booking.pickupPoint);
  const busPosition: [number, number] = driverLoc ? [driverLoc.latitude, driverLoc.longitude] : [-6.9175, 107.6235];
  const bearing = driverLoc?.bearing || 0;
  const speed = driverLoc?.speed || 0;
  const currentStopIndex = driverLoc?.current_stop_index || 0;

  const passengerStopIndex = pickupPoints.findIndex((p) => p.id === booking.pickupPoint.id);
  const stopsAway = Math.max(0, passengerStopIndex - currentStopIndex);
  const etaMinutes = stopsAway > 0 && passengerStopIndex >= 0
    ? pickupPoints[passengerStopIndex].minutesFromStart - (pickupPoints[currentStopIndex]?.minutesFromStart || 0)
    : 0;
  const driverPassed = currentStopIndex > passengerStopIndex;

  return (
    <div className="mobile-container min-h-screen bg-background">
      <ScreenHeader title="Lacak Driver" />
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 justify-center">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-secondary animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-xs font-semibold text-muted-foreground">{isConnected ? "GPS Real-time Aktif" : "Menghubungkan..."}</span>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[40vh] min-h-[260px] rounded-2xl overflow-hidden shadow-lg border border-border/50">
          <MapContainer center={busPosition} zoom={14} scrollWheelZoom={false} zoomControl={false} attributionControl={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={ROUTE_COORDS} pathOptions={{ color: "hsl(217, 91%, 50%)", weight: 3, opacity: 0.3, dashArray: "6 6" }} />
            {pickupPoints.map((p, idx) => (
              <Marker key={p.id} position={p.coords} icon={makeStopIcon(p.label, p.id === booking.pickupPoint.id, idx < currentStopIndex)}>
                <Popup><strong>{p.label}</strong> — {p.name}{p.id === booking.pickupPoint.id && <><br />✅ Titik jemput kamu</>}</Popup>
              </Marker>
            ))}
            {isConnected && <LiveBusMarker position={busPosition} bearing={bearing} />}
          </MapContainer>
        </motion.div>

        {isConnected && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
              <Gauge className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-primary">{Math.round(speed)} km/h</span>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-secondary/10 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-secondary" /><span className="text-sm font-bold text-secondary">{stopsAway > 0 ? `${stopsAway} halte lagi` : driverPassed ? "Sudah lewat" : "Sudah tiba!"}</span>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="shuttle-card-elevated">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl shuttle-gradient flex items-center justify-center"><Navigation className="w-6 h-6 text-primary-foreground" /></div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">{driverPassed ? "Driver sudah melewati halte kamu" : etaMinutes > 0 ? "Driver sedang menuju" : "Driver akan segera tiba"}</p>
              <p className="text-sm text-muted-foreground">{etaMinutes > 0 ? <>Perkiraan tiba dalam <span className="font-bold text-primary">~{etaMinutes} menit</span></> : "Bersiap di titik jemput"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><span className="text-sm font-bold text-muted-foreground">{trip.driverName.split(" ")[1]?.[0] || "D"}</span></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{trip.driverName}</p>
              <p className="text-xs text-muted-foreground">{trip.vehiclePlate}</p>
            </div>
            <Button size="sm" className="rounded-xl shuttle-gradient-green text-secondary-foreground font-semibold" onClick={() => window.open(`tel:${trip.driverPhone}`)}>
              <Phone className="w-4 h-4 mr-1" />Hubungi
            </Button>
          </div>
        </motion.div>

        <div className="shuttle-card space-y-2">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span className="text-sm text-foreground"><span className="font-semibold">{booking.pickupPoint.label}</span> — {booking.pickupPoint.name}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[hsl(var(--shuttle-warning))]" /><span className="text-sm text-foreground">Dijemput pukul <span className="font-semibold">{pickupTime}</span></span></div>
        </div>
      </div>
    </div>
  );
}
