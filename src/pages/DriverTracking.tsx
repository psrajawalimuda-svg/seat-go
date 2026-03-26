import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Navigation, Bus, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBooking } from "@/context/BookingContext";
import { MOCK_TRIPS, getPickupTime, PICKUP_POINTS } from "@/data/shuttle-data";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom icons
const busIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,0.4)">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,hsl(152,69%,45%),hsl(152,69%,55%));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(34,197,94,0.4)">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Route coords derived from all pickup points
const ROUTE_COORDS = PICKUP_POINTS.map((p) => p.coords);

const makeStopIcon = (label: string, isSelected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${isSelected ? 28 : 22}px;height:${isSelected ? 28 : 22}px;border-radius:50%;background:${isSelected ? "linear-gradient(135deg,hsl(152,69%,45%),hsl(152,69%,55%))" : "white"};border:2px solid ${isSelected ? "hsl(152,69%,40%)" : "hsl(217,91%,50%)"};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:${isSelected ? 10 : 8}px;font-weight:700;color:${isSelected ? "white" : "hsl(217,91%,50%)"};font-family:sans-serif">${label}</div>`,
    iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
    iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
  });

function AnimatedBusMarker({ progress }: { progress: number }) {
  const map = useMap();
  const idx = Math.min(Math.floor(progress * (ROUTE_COORDS.length - 1)), ROUTE_COORDS.length - 1);
  const pos = ROUTE_COORDS[idx];

  useEffect(() => {
    map.setView(pos, map.getZoom(), { animate: true, duration: 1 });
  }, [pos, map]);

  return <Marker position={pos} icon={busIcon}><Popup>🚌 Driver is here</Popup></Marker>;
}

export default function DriverTracking() {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const trip = MOCK_TRIPS.find((t) => t.id === booking?.tripId);
  const [eta, setEta] = useState(8);
  const [progress, setProgress] = useState(0.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(1, prev - 1));
      setProgress((prev) => Math.min(0.95, prev + 0.08));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!booking || !trip) { navigate("/"); return null; }

  const pickupTime = getPickupTime(trip.departureTime, booking.pickupPoint);
  const center: [number, number] = [-6.9175, 107.6235];

  return (
    <div className="mobile-container min-h-screen bg-background">
      <ScreenHeader title="Track Driver" />

      <div className="px-4 py-4 space-y-4">
        {/* Leaflet Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-72 rounded-2xl overflow-hidden shadow-lg border border-border/50"
        >
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline
              positions={ROUTE_COORDS}
              pathOptions={{ color: "hsl(217, 91%, 50%)", weight: 4, opacity: 0.5, dashArray: "8 8" }}
            />
            {PICKUP_POINTS.map((p) => (
              <Marker
                key={p.id}
                position={p.coords}
                icon={makeStopIcon(p.label, p.id === booking.pickupPoint.id)}
              >
                <Popup>
                  <strong>{p.label}</strong> — {p.name}
                  {p.id === booking.pickupPoint.id && <><br/>✅ Your pickup</>}
                </Popup>
              </Marker>
            ))}
            <AnimatedBusMarker progress={progress} />
          </MapContainer>
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
