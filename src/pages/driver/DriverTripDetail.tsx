import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Phone, Play, CheckCircle2, MapPin, Navigation, 
  Gauge, Clock, MessageSquare, Star, MoreVertical, X, Send,
  ChevronUp, ChevronDown, User, AlertCircle, Plus, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { PickupTimeline } from "@/components/driver/PickupTimeline";
import { getPickupTime, formatPrice, PickupPoint } from "@/data/shuttle-data";
import { useTrips, usePickupPoints, useBookings, toTrip } from "@/hooks/use-supabase-data";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SkeletonCard } from "@/components/SkeletonCard";
import { cn } from "@/lib/utils";

// --- Constants & Helpers ---

const PASSENGER_PHOTOS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=80&h=80&fit=crop",
];

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

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
    html: `<div style="width:${status === "current" ? 32 : 24}px;height:${status === "current" ? 32 : 24}px;border-radius:50%;background:${
      status === "completed" ? "hsl(152,69%,45%)" : status === "current" ? "linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%))" : "white"
    };border:2px solid ${status === "completed" ? "hsl(152,69%,40%)" : "hsl(217,91%,50%)"};display:flex;align-items:center;justify-content:center;font-size:${status === "current" ? 11 : 9}px;font-weight:700;color:${status === "upcoming" ? "hsl(217,91%,50%)" : "white"};font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.18)${status === "current" ? ";animation:pulse 2s infinite" : ""}">${status === "completed" ? "✓" : label}</div>`,
    iconSize: [status === "current" ? 32 : 24, status === "current" ? 32 : 24],
    iconAnchor: [status === "current" ? 16 : 12, status === "current" ? 16 : 12],
  });

// --- Internal Components ---

function LiveBusMarker({ position, bearing, followBus }: { position: [number, number]; bearing: number; followBus: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (followBus) map.setView(position, map.getZoom(), { animate: true, duration: 0.8 });
  }, [position, followBus, map]);
  const icon = useMemo(() => makeBusIcon(bearing), [bearing]);
  return <Marker position={position} icon={icon}><Popup>🚌 Posisi Anda</Popup></Marker>;
}

function CompletedRoute({ coords }: { coords: [number, number][] }) {
  if (coords.length < 2) return null;
  return <Polyline positions={coords} pathOptions={{ color: "hsl(152,69%,45%)", weight: 6, opacity: 0.8, lineJoin: "round" }} />;
}

function ChatDrawer({ isOpen, onOpenChange, passengerName }: { isOpen: boolean; onOpenChange: (open: boolean) => void; passengerName: string }) {
  const [messages, setMessages] = useState([
    { text: "Halo Pak, saya sudah di titik jemput.", sender: "passenger", time: "10:05" },
    { text: "Oke Bu, saya sebentar lagi sampai. Mohon ditunggu ya.", sender: "driver", time: "10:06" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: "driver", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput("");
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-[480px] mx-auto h-[80vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={PASSENGER_PHOTOS[0]} />
              <AvatarFallback>{passengerName[0]}</AvatarFallback>
            </Avatar>
            <span>{passengerName}</span>
          </DrawerTitle>
        </DrawerHeader>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col", m.sender === "driver" ? "items-end" : "items-start")}>
              <div className={cn("max-w-[80%] px-4 py-2 rounded-2xl text-sm", 
                m.sender === "driver" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none")}>
                {m.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-2 pb-8">
          <Input 
            placeholder="Ketik pesan..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="rounded-xl"
          />
          <Button size="icon" className="rounded-xl" onClick={handleSend}><Send className="w-4 h-4" /></Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// --- Main Page ---

export default function DriverTripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dbTrips, isLoading: tripsLoading } = useTrips();
  const { data: pickupPoints = [], isLoading: ppLoading } = usePickupPoints();
  const { data: allBookings = [] } = useBookings();

  const dbTrip = dbTrips?.find((t) => t.id === id);
  const trip = dbTrip ? toTrip(dbTrip) : null;

  const [currentStop, setCurrentStop] = useState(0);
  const [followBus, setFollowBus] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const handlePointClick = useCallback((point: PickupPoint) => {
    if (mapRef.current) {
      setFollowBus(false);
      mapRef.current.setView(point.coords, 16, { animate: true });
    }
  }, []);

  const ROUTE_COORDS = useMemo(() => pickupPoints.map((p) => p.coords), [pickupPoints]);
  const smoothPath = useMemo(() => ROUTE_COORDS.length > 1 ? generateSmoothPath(ROUTE_COORDS, 30) : [[0, 0] as [number, number]], [ROUTE_COORDS]);
  const [busIndex, setBusIndex] = useState(0);

  const targetIndex = useMemo(() => {
    const stepsPerSegment = 30;
    if (currentStop === 0) return 0;
    if (currentStop >= pickupPoints.length) return smoothPath.length - 1;
    return Math.min(currentStop * stepsPerSegment, smoothPath.length - 1);
  }, [currentStop, smoothPath.length, pickupPoints.length]);

  useEffect(() => {
    if (busIndex === targetIndex) return;
    const step = busIndex < targetIndex ? 1 : -1;
    const interval = setInterval(() => {
      setBusIndex((prev) => {
        const next = prev + step;
        if ((step > 0 && next >= targetIndex) || (step < 0 && next <= targetIndex)) { clearInterval(interval); return targetIndex; }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [targetIndex, busIndex]);

  useEffect(() => {
    if (!id || smoothPath.length <= 1) return;
    const pos = smoothPath[busIndex];
    const nextI = Math.min(busIndex + 1, smoothPath.length - 1);
    const b = getBearing(smoothPath[busIndex], smoothPath[nextI]);
    const spd = currentStop > 0 && currentStop < pickupPoints.length ? Math.floor(35 + Math.random() * 10) : 0;
    
    const upsert = async () => {
      await supabase.from("driver_locations").upsert({
        trip_id: id, driver_id: "d1",
        latitude: pos[0], longitude: pos[1],
        bearing: b, speed: spd, current_stop_index: currentStop,
        updated_at: new Date().toISOString(),
      }, { onConflict: "trip_id" });
    };
    upsert();
  }, [id, busIndex, currentStop, smoothPath, pickupPoints.length]);

  if (tripsLoading || ppLoading) {
    return <div className="mobile-container bg-background"><div className="px-4 py-4"><SkeletonCard /><SkeletonCard /></div></div>;
  }

  if (!trip) { navigate("/driver"); return null; }

  const passengers = allBookings.filter((b) => b.trip_id === trip.id && b.status !== "cancelled");
  const currentPassenger = passengers[0] || { passenger_name: "No Passenger", passenger_phone: "" };
  const tripStatus = currentStop === 0 ? "start" : currentStop >= pickupPoints.length ? "done" : "running";

  const busPosition: [number, number] = [smoothPath[busIndex][0], smoothPath[busIndex][1]];
  const nextIdx = Math.min(busIndex + 1, smoothPath.length - 1);
  const bearing = getBearing(smoothPath[busIndex], smoothPath[nextIdx]);
  const completedCoords = smoothPath.slice(0, busIndex + 1);
  const speed = tripStatus === "running" ? Math.floor(35 + Math.random() * 10) : 0;
  const etaMinutes = tripStatus === "running" && currentStop < pickupPoints.length
    ? pickupPoints[currentStop].minutesFromStart - pickupPoints[Math.max(0, currentStop - 1)].minutesFromStart
    : 0;

  return (
    <div className="mobile-container h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/20 to-transparent p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-background shadow-lg flex items-center justify-center tap-highlight">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-full bg-background shadow-lg border-none" onClick={() => window.open(`tel:${trip.driverPhone}`)}>
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-10 h-10 rounded-full bg-background shadow-lg border-none">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={busPosition} 
          zoom={15} 
          scrollWheelZoom={true} 
          zoomControl={false} 
          attributionControl={false} 
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Polyline positions={ROUTE_COORDS} pathOptions={{ color: "hsl(217,91%,50%)", weight: 4, opacity: 0.15, dashArray: "8 8" }} />
          <CompletedRoute coords={completedCoords} />
          {pickupPoints.map((p, idx) => {
            const status = idx < currentStop ? "completed" : idx === currentStop ? "current" : "upcoming";
            return (
              <Marker 
                key={p.id} 
                position={p.coords} 
                icon={makeStopIcon(p.label, status)}
                eventHandlers={{
                  click: () => handlePointClick(p)
                }}
              >
                <Popup className="driver-map-popup">
                  <div className="p-1">
                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter mb-0.5">HALTE {p.label}</p>
                    <p className="text-xs font-bold text-foreground leading-tight">{p.name}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          <LiveBusMarker position={busPosition} bearing={bearing} followBus={followBus} />
        </MapContainer>
        
        {/* Map Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          <div className="bg-background/90 backdrop-blur-md rounded-2xl p-1 shadow-xl border flex flex-col">
            <button 
              onClick={() => mapRef.current?.zoomIn()} 
              className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-t-xl transition-colors border-b"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={() => mapRef.current?.zoomOut()} 
              className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-b-xl transition-colors"
            >
              <Minus className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <button 
            onClick={() => {
              setFollowBus(true);
              if (mapRef.current) mapRef.current.setView(busPosition, 16, { animate: true });
            }} 
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
              followBus ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
            }`}
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Real-time Stats Overlay */}
      {tripStatus === "running" && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="absolute left-4 top-20 z-10 space-y-2">
          <div className="bg-background/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Gauge className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Kecepatan</p>
              <p className="text-sm font-bold">{speed} km/jam</p>
            </div>
          </div>
          <div className="bg-background/90 backdrop-blur-md rounded-2xl p-3 shadow-xl border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><Clock className="w-5 h-5 text-secondary" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimasi</p>
              <p className="text-sm font-bold">{etaMinutes} menit</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Info Card (Floating) */}
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-background rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.12)] border-t safe-bottom">
          {/* Handle */}
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-3 mb-1" />

          <div className="px-5 py-4">
            {/* Passenger Info Row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-2 border-primary/20 p-0.5 shadow-inner">
                    <AvatarImage src={PASSENGER_PHOTOS[0]} className="rounded-full object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {currentPassenger.passenger_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1.5 py-0.5 border shadow-sm flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-shuttle-warning text-shuttle-warning" />
                    <span className="text-[10px] font-bold">4.9</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{currentPassenger.passenger_name}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px]">Gold Member</Badge>
                    • {formatPrice(trip.basePrice)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="w-11 h-11 rounded-full bg-muted/30 border-none" onClick={() => setIsChatOpen(true)}>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </Button>
                <Button size="icon" variant="outline" className="w-11 h-11 rounded-full bg-muted/30 border-none" onClick={() => window.open(`tel:${currentPassenger.passenger_phone}`)}>
                  <Phone className="w-5 h-5 text-secondary" />
                </Button>
              </div>
            </div>

            {/* Status & Points Card */}
            <div className="bg-muted/30 rounded-[24px] p-4 mb-5 border border-muted-foreground/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Lokasi Penjemputan</p>
                  <p className="text-sm font-bold truncate">{pickupPoints[currentStop]?.name || "Titik Akhir"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{etaMinutes} mnt</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hingga Tiba</p>
                </div>
              </div>
              
              <div className="h-px bg-muted-foreground/10 mb-4" />

              <button 
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Lihat Rute Lengkap</span>
                {isTimelineExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {isTimelineExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                    <PickupTimeline 
                      points={pickupPoints} 
                      departureTime={trip.departureTime} 
                      tripId={trip.id} 
                      currentStopIndex={currentStop}
                      onPointClick={handlePointClick}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Button */}
            <div className="flex gap-3">
              {tripStatus === "start" && (
                <Button className="flex-1 h-14 rounded-2xl shuttle-gradient text-primary-foreground font-bold text-base shadow-lg" onClick={() => setCurrentStop(1)}>
                  <Play className="w-5 h-5 mr-2" /> Mulai Perjalanan
                </Button>
              )}
              {tripStatus === "running" && (
                <Button className="flex-1 h-14 rounded-2xl shuttle-gradient text-primary-foreground font-bold text-base shadow-lg" onClick={() => setCurrentStop((prev) => prev + 1)}>
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Tiba di Halte
                </Button>
              )}
              {tripStatus === "done" && (
                <Button className="flex-1 h-14 rounded-2xl shuttle-gradient-green text-secondary-foreground font-bold text-base shadow-lg" onClick={() => navigate("/driver")}>
                  <CheckCircle2 className="w-5 h-5 mr-2" /> Selesaikan Trip
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Drawer Component */}
      <ChatDrawer 
        isOpen={isChatOpen} 
        onOpenChange={setIsChatOpen} 
        passengerName={currentPassenger.passenger_name} 
      />

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-div-icon { background: transparent; border: none; }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 24px); }
      `}</style>
    </div>
  );
}
