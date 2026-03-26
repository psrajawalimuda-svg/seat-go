import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Play, CheckCircle2, MapPin, Navigation, Gauge, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PickupTimeline } from "@/components/driver/PickupTimeline";
import { MOCK_TRIPS, PICKUP_POINTS, getPickupTime } from "@/data/shuttle-data";
import { MOCK_BOOKINGS } from "@/data/admin-data";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ROUTE_COORDS = PICKUP_POINTS.map((p) => p.coords);

// Interpolate between two coordinates
function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Generate smooth path between pickup points with intermediate steps
function generateSmoothPath(coords: [number, number][], stepsPerSegment = 20): [number, number][] {
  const path: [number, number][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    for (let s = 0; s < stepsPerSegment; s++) {
      path.push(lerp(coords[i], coords[i + 1], s / stepsPerSegment));
    }
  }
  path.push(coords[coords.length - 1]);
  return path;
}

// Calculate bearing between two points for rotation
function getBearing(from: [number, number], to: [number, number]): number {
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const makeBusIcon = (bearing: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,0.5);border:3px solid white;transform:rotate(${bearing}deg)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L19 21l-7-4-7 4z"/></svg>
    </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

const makeStopIcon = (label: string, status: "completed" | "current" | "upcoming") =>
  L.divIcon({
    className: "",
    html: `<div style="width:${status === "current" ? 28 : 22}px;height:${status === "current" ? 28 : 22}px;border-radius:50%;background:${
      status === "completed"
        ? "hsl(152,69%,45%)"
        : status === "current"
        ? "linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%))"
        : "white"
    };border:2px solid ${
      status === "completed" ? "hsl(152,69%,40%)" : "hsl(217,91%,50%)"
    };display:flex;align-items:center;justify-content:center;font-size:${status === "current" ? 10 : 8}px;font-weight:700;color:${
      status === "upcoming" ? "hsl(217,91%,50%)" : "white"
    };font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.18)${
      status === "current" ? ";animation:pulse 2s infinite" : ""
    }">${status === "completed" ? "✓" : label}</div>`,
    iconSize: [status === "current" ? 28 : 22, status === "current" ? 28 : 22],
    iconAnchor: [status === "current" ? 14 : 11, status === "current" ? 14 : 11],
  });

// Component to animate bus and auto-pan map
function LiveBusMarker({
  position,
  bearing,
  followBus,
}: {
  position: [number, number];
  bearing: number;
  followBus: boolean;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (followBus) {
      map.setView(position, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [position, followBus, map]);

  const icon = useMemo(() => makeBusIcon(bearing), [bearing]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Popup>🚌 Posisi driver saat ini</Popup>
    </Marker>
  );
}

// Completed route overlay (green)
function CompletedRoute({ coords }: { coords: [number, number][] }) {
  if (coords.length < 2) return null;
  return (
    <Polyline
      positions={coords}
      pathOptions={{ color: "hsl(152,69%,45%)", weight: 5, opacity: 0.8 }}
    />
  );
}

export default function DriverTripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trip = MOCK_TRIPS.find((t) => t.id === id);
  const [currentStop, setCurrentStop] = useState(2);
  const [followBus, setFollowBus] = useState(true);

  // Smooth GPS simulation
  const smoothPath = useMemo(() => generateSmoothPath(ROUTE_COORDS, 30), []);
  const [busIndex, setBusIndex] = useState(0);

  // Calculate target bus index based on current stop
  const targetIndex = useMemo(() => {
    const stepsPerSegment = 30;
    // Bus should be between previous stop and current stop
    if (currentStop === 0) return 0;
    if (currentStop >= PICKUP_POINTS.length) return smoothPath.length - 1;
    // Position bus slightly past the last completed stop
    return Math.min(currentStop * stepsPerSegment, smoothPath.length - 1);
  }, [currentStop, smoothPath.length]);

  // Animate bus movement smoothly
  useEffect(() => {
    if (busIndex === targetIndex) return;
    const step = busIndex < targetIndex ? 1 : -1;
    const interval = setInterval(() => {
      setBusIndex((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= targetIndex) || (step < 0 && next <= targetIndex)) {
          clearInterval(interval);
          return targetIndex;
        }
        return next;
      });
    }, 60); // smooth 60ms per step
    return () => clearInterval(interval);
  }, [targetIndex, busIndex]);

  // Simulate micro-movement when idle (GPS jitter simulation)
  const [jitter, setJitter] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    const interval = setInterval(() => {
      setJitter([
        (Math.random() - 0.5) * 0.0002,
        (Math.random() - 0.5) * 0.0002,
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Write position to database for passenger real-time tracking
  useEffect(() => {
    if (!id) return;
    const pos = smoothPath[busIndex];
    const nextI = Math.min(busIndex + 1, smoothPath.length - 1);
    const b = getBearing(smoothPath[busIndex], smoothPath[nextI]);
    const spd = currentStop > 0 && currentStop < PICKUP_POINTS.length ? Math.floor(25 + Math.random() * 15) : 0;

    const upsert = async () => {
      await supabase.from("driver_locations").upsert(
        {
          trip_id: id,
          driver_id: "d1",
          latitude: pos[0] + jitter[0],
          longitude: pos[1] + jitter[1],
          bearing: b,
          speed: spd,
          current_stop_index: currentStop,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "trip_id" }
      );
    };
    upsert();
  }, [id, busIndex, currentStop, jitter, smoothPath]);


    navigate("/driver");
    return null;
  }

  const passengers = MOCK_BOOKINGS.filter(
    (b) => b.tripId === trip.id && b.status !== "cancelled"
  );

  const tripStatus =
    currentStop === 0 ? "start" : currentStop >= PICKUP_POINTS.length ? "done" : "running";

  const busPosition: [number, number] = [
    smoothPath[busIndex][0] + jitter[0],
    smoothPath[busIndex][1] + jitter[1],
  ];

  // Calculate bearing
  const nextIdx = Math.min(busIndex + 1, smoothPath.length - 1);
  const bearing = getBearing(smoothPath[busIndex], smoothPath[nextIdx]);

  // Completed path segments
  const completedCoords = smoothPath.slice(0, busIndex + 1);

  // Speed simulation
  const speed = tripStatus === "running" ? Math.floor(25 + Math.random() * 15) : 0;

  // ETA to next stop
  const etaMinutes = tripStatus === "running" && currentStop < PICKUP_POINTS.length
    ? PICKUP_POINTS[currentStop].minutesFromStart - PICKUP_POINTS[Math.max(0, currentStop - 1)].minutesFromStart
    : 0;

  return (
    <div className="mobile-container bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="tap-highlight">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">{trip.routeName}</p>
            {tripStatus === "running" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                LIVE
              </span>
            )}
          </div>
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

      {/* Map - larger for GPS tracking */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-64 mx-4 mt-4 rounded-2xl overflow-hidden border border-border/50 shadow-lg relative"
      >
        <MapContainer
          center={busPosition}
          zoom={14}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {/* Full route (dashed) */}
          <Polyline
            positions={ROUTE_COORDS}
            pathOptions={{ color: "hsl(217,91%,50%)", weight: 3, opacity: 0.25, dashArray: "6 6" }}
          />
          {/* Completed route (solid green) */}
          <CompletedRoute coords={completedCoords} />
          {/* Stop markers */}
          {PICKUP_POINTS.map((p, idx) => {
            const status = idx < currentStop ? "completed" : idx === currentStop ? "current" : "upcoming";
            return (
              <Marker key={p.id} position={p.coords} icon={makeStopIcon(p.label, status)}>
                <Popup>
                  <strong>{p.label}</strong> — {p.name}
                  <br />
                  {getPickupTime(trip.departureTime, p)}
                </Popup>
              </Marker>
            );
          })}
          {/* Live bus marker */}
          <LiveBusMarker position={busPosition} bearing={bearing} followBus={followBus} />
        </MapContainer>

        {/* Follow button overlay */}
        <button
          onClick={() => setFollowBus(!followBus)}
          className={`absolute bottom-3 right-3 z-[1000] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${
            followBus
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground border border-border"
          }`}
        >
          <Navigation className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Live stats bar */}
      <AnimatePresence>
        {tripStatus === "running" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mt-3 flex items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{speed} km/h</span>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-secondary/10 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4 text-secondary" />
              <span className="text-sm font-bold text-secondary">~{etaMinutes} min</span>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-[hsl(var(--shuttle-warning))]/10 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-[hsl(var(--shuttle-warning))]" />
              <span className="text-sm font-bold text-[hsl(var(--shuttle-warning))]">
                {PICKUP_POINTS[currentStop]?.label || "—"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info bar */}
      <div className="mx-4 mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{PICKUP_POINTS.length} halte</span>
        </div>
        <span>•</span>
        <span>{passengers.length} penumpang</span>
        <span>•</span>
        <span>Stop {Math.min(currentStop + 1, PICKUP_POINTS.length)}/{PICKUP_POINTS.length}</span>
      </div>

      {/* Timeline */}
      <div className="px-4 mt-4 pb-24">
        <PickupTimeline
          points={PICKUP_POINTS}
          departureTime={trip.departureTime}
          tripId={trip.id}
          currentStopIndex={currentStop}
        />
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent z-10">
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
