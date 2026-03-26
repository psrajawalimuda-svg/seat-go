import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Play, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PickupTimeline } from "@/components/driver/PickupTimeline";
import { MOCK_TRIPS, PICKUP_POINTS, getPickupTime } from "@/data/shuttle-data";
import { MOCK_BOOKINGS } from "@/data/admin-data";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ROUTE_COORDS = PICKUP_POINTS.map((p) => p.coords);

const makeIcon = (label: string, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="width:${active ? 26 : 20}px;height:${active ? 26 : 20}px;border-radius:50%;background:${active ? "hsl(217,91%,50%)" : "white"};border:2px solid hsl(217,91%,50%);display:flex;align-items:center;justify-content:center;font-size:${active ? 9 : 7}px;font-weight:700;color:${active ? "white" : "hsl(217,91%,50%)"};font-family:sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.15)">${label}</div>`,
    iconSize: [active ? 26 : 20, active ? 26 : 20],
    iconAnchor: [active ? 13 : 10, active ? 13 : 10],
  });

export default function DriverTripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trip = MOCK_TRIPS.find((t) => t.id === id);
  const [currentStop, setCurrentStop] = useState(2);

  if (!trip) {
    navigate("/driver");
    return null;
  }

  const passengers = MOCK_BOOKINGS.filter(
    (b) => b.tripId === trip.id && b.status !== "cancelled"
  );

  const tripStatus = currentStop === 0 ? "start" : currentStop >= PICKUP_POINTS.length ? "done" : "running";

  return (
    <div className="mobile-container bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{trip.routeName}</p>
          <p className="text-xs text-muted-foreground">
            {trip.departureTime} • {trip.vehiclePlate}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          onClick={() => window.open(`tel:${trip.driverPhone}`)}
        >
          <Phone className="w-4 h-4" />
        </Button>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-48 mx-4 mt-4 rounded-2xl overflow-hidden border border-border/50 shadow-sm"
      >
        <MapContainer
          center={[-6.917, 107.623]}
          zoom={13}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline
            positions={ROUTE_COORDS}
            pathOptions={{ color: "hsl(217,91%,50%)", weight: 3, opacity: 0.5, dashArray: "6 6" }}
          />
          {PICKUP_POINTS.map((p, idx) => (
            <Marker key={p.id} position={p.coords} icon={makeIcon(p.label, idx === currentStop)}>
              <Popup>{p.label} — {p.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </motion.div>

      {/* Info bar */}
      <div className="mx-4 mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{PICKUP_POINTS.length} halte</span>
        </div>
        <span>•</span>
        <span>{passengers.length} penumpang</span>
        <span>•</span>
        <span>Stop {currentStop + 1}/{PICKUP_POINTS.length}</span>
      </div>

      {/* Timeline */}
      <div className="px-4 mt-4">
        <PickupTimeline
          points={PICKUP_POINTS}
          departureTime={trip.departureTime}
          tripId={trip.id}
          currentStopIndex={currentStop}
        />
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        {tripStatus === "start" && (
          <Button
            className="w-full h-14 rounded-2xl shuttle-gradient text-primary-foreground font-bold text-base"
            onClick={() => setCurrentStop(1)}
          >
            <Play className="w-5 h-5 mr-2" /> Mulai Perjalanan
          </Button>
        )}
        {tripStatus === "running" && (
          <Button
            className="w-full h-14 rounded-2xl shuttle-gradient text-primary-foreground font-bold text-base"
            onClick={() => setCurrentStop((prev) => prev + 1)}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" /> Tiba di {PICKUP_POINTS[currentStop]?.label}
          </Button>
        )}
        {tripStatus === "done" && (
          <Button
            className="w-full h-14 rounded-2xl shuttle-gradient-green text-secondary-foreground font-bold text-base"
            onClick={() => navigate("/driver")}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" /> Perjalanan Selesai
          </Button>
        )}
      </div>
    </div>
  );
}
