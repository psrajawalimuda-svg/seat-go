import { useNavigate } from "react-router-dom";
import { useDriver, TrafficLevel, WeatherCondition } from "@/context/DriverContext";
import { usePickupPoints } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, CheckCircle2, Circle, MapPin, Navigation, 
  ChevronRight, ChevronLeft, Map as MapIcon, LayoutList,
  Clock, Users, Flag, Bus, AlertTriangle, CloudRain, Sun, 
  Wind, Activity, Zap, Info, ShieldAlert, Wifi, Globe,
  MessageSquare, Phone, MoreHorizontal, Brain, Plus, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceCommandLayer } from "@/components/driver/VoiceCommandLayer";
import { useState, useEffect, useMemo, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

// --- Leaflet Helpers ---
const makeBusIcon = (bearing: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,hsl(217,91%,50%),hsl(217,91%,60%));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,0.5);border:3px solid white;transform:rotate(${bearing}deg);transition:transform 0.3s ease-out">
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

function LiveBusMarker({ position, bearing, followBus }: { position: [number, number]; bearing: number; followBus: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (followBus) map.setView(position, map.getZoom(), { animate: true, duration: 0.8 });
  }, [position, followBus, map]);
  const icon = useMemo(() => makeBusIcon(bearing), [bearing]);
  return <Marker position={position} icon={icon}><Popup>🚌 Posisi Anda</Popup></Marker>;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

const DriverTripActive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    activeTrip, currentStopIndex, bookings, isDrivingMode, playFeedback, 
    nextStop, prevStop, trafficLevel, weather, stressLevel, fatigueLevel,
    activeEvents, resolveEvent, etaAdjustment, addEvent, difficulty,
    scheduleDeviation, setScheduleDeviation, locationVerified, setLocationVerified
  } = useDriver();
  
  const { data: allPickupPoints = [] } = usePickupPoints();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationMethod, setLocationMethod] = useState<"gps" | "wifi" | "manual">("gps");

  // --- Real-time Location State ---
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [bearing, setBearing] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [followBus, setFollowBus] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  // In this app, pickup points are global for the route. 
  const stops = useMemo(() => allPickupPoints, [allPickupPoints]);
  const routeCoords = useMemo(() => stops.map(s => s.coords), [stops]);

  // --- Real-time Tracking Logic ---
  useEffect(() => {
    if (!activeTrip || !("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed: currentSpeed } = pos.coords;
        const newPos: [number, number] = [latitude, longitude];
        
        // Calculate bearing if heading is null
        if (currentPos && heading === null) {
          const dLon = ((longitude - currentPos[1]) * Math.PI) / 180;
          const lat1 = (currentPos[0] * Math.PI) / 180;
          const lat2 = (latitude * Math.PI) / 180;
          const y = Math.sin(dLon) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          const b = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
          setBearing(b);
        } else if (heading !== null) {
          setBearing(heading);
        }

        setCurrentPos(newPos);
        setSpeed(Math.round((currentSpeed || 0) * 3.6)); // m/s to km/h

        // Update Supabase
        supabase.from("driver_locations").upsert({
          trip_id: activeTrip.id,
          driver_id: activeTrip.driverId || activeTrip.driverName,
          latitude,
          longitude,
          bearing: heading || 0,
          speed: Math.round((currentSpeed || 0) * 3.6),
          current_stop_index: currentStopIndex,
          updated_at: new Date().toISOString(),
        }, { onConflict: "trip_id" }).then(({ error }) => {
          if (error) console.error("Error updating location:", error);
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTrip, currentStopIndex, currentPos]);

  // Fallback for demo if no GPS or for initial center
  useEffect(() => {
    if (!currentPos && stops.length > 0) {
      setCurrentPos(stops[0].coords);
    }
  }, [stops, currentPos]);

  if (!activeTrip) {
    navigate("/driver");
    return null;
  }

  // Schedule Deviation Monitoring
  useEffect(() => {
    if (!activeTrip) return;
    
    const monitorInterval = setInterval(() => {
      // Simulate deviation drift
      const drift = (Math.random() - 0.5) * 2;
      setScheduleDeviation(scheduleDeviation + drift);

      // Notify for significant deviations
      if (scheduleDeviation > 5) {
        toast({
          title: "Late Arrival Warning",
          description: `You are ${Math.round(scheduleDeviation)}m behind schedule. Automatic passenger alerts sent.`,
          variant: "destructive"
        });
      } else if (scheduleDeviation < -10) {
        toast({
          title: "Early Arrival Warning",
          description: `You are ${Math.abs(Math.round(scheduleDeviation))}m ahead of schedule. Passengers notified to prepare early.`,
          variant: "default"
        });
      }
    }, 10000);

    return () => clearInterval(monitorInterval);
  }, [activeTrip, scheduleDeviation, setScheduleDeviation, toast]);

  // Traffic & Escalation Logic
  useEffect(() => {
    if (etaAdjustment > 20) {
      toast({
        title: "Critical Traffic Delay",
        description: "Delay > 20m. Proactive customer service escalation initiated.",
        variant: "destructive"
      });
      playFeedback("error");
    }
  }, [etaAdjustment, toast, playFeedback]);

  const isLastStop = currentStopIndex >= stops.length - 1;

  const handleArrive = () => {
    if (!locationVerified) {
      setShowLocationDialog(true);
      return;
    }
    if (isLastStop) {
      navigate("/driver"); // Or a summary page if exists
      return;
    }
    playFeedback("success");
    // In seat-go, we might want to stay on this page but advance the stop
    nextStop();
    toast({
      title: "Arrived at Stop",
      description: `Arrived at ${stops[currentStopIndex].label}. Please check passengers.`,
    });
  };

  const progressPercent = stops.length > 0 ? ((currentStopIndex) / (stops.length - 1)) * 100 : 0;
  const currentStop = stops[currentStopIndex];
  const totalPax = bookings.length;

  const handleVoiceCommand = (command: string) => {
    if (command === "arrive") {
      handleArrive();
    } else if (command === "next stop") {
      if (currentStopIndex < stops.length - 1) nextStop();
    }
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "high": return "text-orange-500";
      case "rush_hour": return "text-red-500 animate-pulse";
      default: return "text-white";
    }
  };

  const getWeatherIcon = (w: string) => {
    switch (w) {
      case "clear": return <Sun size={18} className="text-yellow-400" />;
      case "rain": return <CloudRain size={18} className="text-blue-400" />;
      case "fog": return <Wind size={18} className="text-zinc-400" />;
      case "storm": return <Zap size={18} className="text-purple-400" />;
      default: return <Sun size={18} />;
    }
  };

  return (
    <div className={cn(
      "min-h-screen pb-40 transition-colors duration-500",
      isDrivingMode ? "bg-black text-white" : "bg-background text-foreground"
    )}>
      {/* High Contrast Header with Simulation Status */}
      <div className={cn(
        "px-6 pb-6 pt-16 sticky top-0 z-40 shadow-2xl transition-all duration-500",
        isDrivingMode ? "bg-zinc-900 border-b border-white/10" : "bg-primary text-primary-foreground"
      )}>
        <div className="mx-auto max-w-md">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate("/driver")}
              className="flex items-center gap-2 text-sm font-black uppercase tracking-widest opacity-70"
            >
              <ArrowLeft size={20} strokeWidth={3} />
              Exit
            </button>
            
            {/* Simulation Status Pills */}
            <div className="flex gap-2">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                {getWeatherIcon(weather)}
                <span className="text-[10px] font-black uppercase">{weather}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                <Activity size={14} className={getTrafficColor(trafficLevel)} />
                <span className="text-[10px] font-black uppercase">{trafficLevel.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex bg-black/20 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-4 py-2 rounded-lg flex items-center gap-2 transition-all",
                  viewMode === "list" ? "bg-white text-black shadow-lg" : "text-white/50"
                )}
              >
                <LayoutList size={18} strokeWidth={3} />
              </button>
              <button 
                onClick={() => setViewMode("map")}
                className={cn(
                  "px-4 py-2 rounded-lg flex items-center gap-2 transition-all",
                  viewMode === "map" ? "bg-white text-black shadow-lg" : "text-white/50"
                )}
              >
                <MapIcon size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Schedule & Location Status */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/20 p-4 rounded-2xl flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase opacity-50 mb-1">Schedule Status</p>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-lg font-black",
                  scheduleDeviation > 5 ? "text-red-500" : scheduleDeviation < -5 ? "text-green-500" : "text-white"
                )}>
                  {scheduleDeviation > 0 ? `+${Math.round(scheduleDeviation)}m` : scheduleDeviation < 0 ? `${Math.round(scheduleDeviation)}m` : "ON TIME"}
                </span>
                <Clock size={16} className="opacity-30" />
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase opacity-50 mb-1">Location Lock</p>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-lg font-black",
                  locationVerified ? "text-green-500" : "text-yellow-500 animate-pulse"
                )}>
                  {locationVerified ? "VERIFIED" : "LOCKING..."}
                </span>
                <MapPin size={16} className="opacity-30" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{activeTrip.routeName}</h1>
              <div className="flex items-center gap-2 opacity-60">
                <Users size={14} strokeWidth={3} />
                <p className="text-xs font-black uppercase tracking-widest">{totalPax} PAX TOTAL</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black leading-none tracking-tighter">{currentStopIndex + 1}/{stops.length}</p>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-50">STOPS</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50">
              <span>Trip Progress</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3 bg-white/10" />
          </div>
        </div>
      </div>

      {/* Floating Active Events / Alerts */}
      {activeEvents.length > 0 && (
        <div className="fixed top-80 left-6 right-6 z-50 space-y-3 pointer-events-none">
          {activeEvents.map((event) => (
            <div 
              key={event.id}
              className="bg-red-600/90 backdrop-blur-xl p-4 rounded-2xl border-2 border-white/20 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 pointer-events-auto"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{event.type.replace('_', ' ')}</p>
                  <p className="text-sm font-bold text-white leading-tight">{event.message}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/10"
                onClick={() => resolveEvent(event.id)}
              >
                Resolve
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-md px-6 mt-8">
        {viewMode === "list" ? (
          <div className="space-y-12 relative before:content-[''] before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1.5 before:bg-muted-foreground/10">
            {stops.map((stop, index) => {
              const isCompleted = index < currentStopIndex;
              const isCurrent = index === currentStopIndex;
              const stopBookings = bookings.filter((b) => b.pickupPoint.id === stop.id);
              const passengerCount = stopBookings.length;

              return (
                <div 
                  key={stop.id} 
                  className={cn(
                    "relative flex gap-8 transition-all duration-300",
                    !isCurrent && !isCompleted && "opacity-30 grayscale"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center z-10 border-4",
                      isCompleted 
                        ? "bg-green-600 border-white text-white" 
                        : isCurrent 
                          ? "bg-primary border-white text-white scale-110 shadow-[0_0_30px_rgba(59,130,246,0.5)]" 
                          : "bg-zinc-800 border-white/10 text-white/30"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 size={32} strokeWidth={3} /> : <Navigation size={32} fill="white" />}
                  </div>

                  <div className="flex-grow pt-2">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={cn(
                        "text-2xl font-black uppercase tracking-tight leading-none",
                        isCurrent ? "text-primary" : ""
                      )}>
                        {stop.label}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {passengerCount > 0 && (
                        <span className={cn(
                          "text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest",
                          isCurrent ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {passengerCount} PAX
                        </span>
                      )}
                      <span className="text-xs font-black opacity-40 uppercase tracking-widest">
                        +{stop.minutesFromStart + (isCurrent ? Math.round(scheduleDeviation) : 0)}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Real Leaflet Map Mode */
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className={cn(
              "relative h-[600px] rounded-[3rem] overflow-hidden border-4 shadow-2xl",
              isDrivingMode ? "bg-zinc-900 border-white/10" : "bg-muted border-primary/10"
            )}>
              {/* Map Component */}
              <MapContainer 
                center={currentPos || [0, 0]} 
                zoom={16} 
                scrollWheelZoom={true} 
                zoomControl={false} 
                attributionControl={false} 
                style={{ height: "100%", width: "100%" }}
                ref={(m) => { if (m) mapRef.current = m; }}
              >
                <TileLayer url={isDrivingMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
                
                {/* Full Route Polyline (Dashed) */}
                <Polyline positions={routeCoords} pathOptions={{ color: "hsl(217,91%,50%)", weight: 4, opacity: 0.2, dashArray: "10 10" }} />
                
                {/* Completed Route (Solid) */}
                {routeCoords.length > 0 && currentStopIndex > 0 && (
                  <Polyline positions={routeCoords.slice(0, currentStopIndex + 1)} pathOptions={{ color: "hsl(152,69%,45%)", weight: 6, opacity: 0.8 }} />
                )}

                {/* Stop Markers */}
                {stops.map((stop, idx) => {
                  const status = idx < currentStopIndex ? "completed" : idx === currentStopIndex ? "current" : "upcoming";
                  return (
                    <Marker 
                      key={stop.id} 
                      position={stop.coords} 
                      icon={makeStopIcon(stop.label, status)}
                      eventHandlers={{
                        click: () => {
                          setFollowBus(false);
                          mapRef.current?.setView(stop.coords, 17, { animate: true });
                        }
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <p className="text-[10px] font-black text-primary uppercase mb-0.5">STOP {stop.label}</p>
                          <p className="text-xs font-bold leading-tight">{stop.name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Driver Live Marker */}
                {currentPos && (
                  <LiveBusMarker position={currentPos} bearing={bearing} followBus={followBus} />
                )}
              </MapContainer>

              {/* Map Controls */}
              <div className="absolute right-6 top-6 z-[400] flex flex-col gap-3">
                <div className="bg-black/80 backdrop-blur-md rounded-2xl p-1 shadow-2xl border border-white/10 flex flex-col">
                  <button 
                    onClick={() => mapRef.current?.zoomIn()} 
                    className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-t-xl transition-colors border-b border-white/10"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </button>
                  <button 
                    onClick={() => mapRef.current?.zoomOut()} 
                    className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-b-xl transition-colors"
                  >
                    <Minus className="w-6 h-6 text-white" />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setFollowBus(true);
                    if (currentPos) mapRef.current?.setView(currentPos, 16, { animate: true });
                  }} 
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-2",
                    followBus ? "bg-primary border-white text-white" : "bg-black/80 border-white/10 text-white/50"
                  )}
                >
                  <Navigation className="w-6 h-6" />
                </button>
              </div>

              {/* Floating Map Overlay Info */}
              <div className="absolute top-6 left-6 right-24 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl pointer-events-auto">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Dynamic Navigation</p>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full",
                      trafficLevel === 'rush_hour' ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary"
                    )}>
                      <Clock size={12} />
                      <span className="text-xs font-black uppercase">
                        {speed > 0 ? `${speed} km/h` : `+${etaAdjustment}m delay`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                      <Navigation size={24} fill="white" className="rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none mb-1">
                        {currentStop?.label || "DESTINATION"}
                      </h4>
                      <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
                        {trafficLevel === 'rush_hour' ? "HEAVY TRAFFIC DETECTED" : "LIVE POSITION ACTIVE"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Predictive Assistance Panel */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 pointer-events-none">
                {scheduleDeviation > 5 && (
                  <div className="bg-red-600/90 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl animate-in slide-in-from-bottom-2 pointer-events-auto">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-white" />
                      <p className="text-xs font-black uppercase text-white">Behind Schedule: +{Math.round(scheduleDeviation)}m</p>
                    </div>
                  </div>
                )}
                <div className="bg-primary/90 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl pointer-events-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain size={16} className="text-white" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/80">AI Route Optimization</p>
                  </div>
                  <p className="text-sm font-bold text-white leading-snug">
                    {trafficLevel === 'rush_hour' ? "Detected heavy traffic. Detour suggested for efficiency." : "Real-time GPS tracking active. Maintaining ETA."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Giant Action Button */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-6 z-50 transition-all duration-500",
        isDrivingMode ? "bg-black/90 backdrop-blur-xl border-t border-white/10" : "bg-white/90 backdrop-blur-md border-t"
      )}>
        <div className="mx-auto max-w-md flex gap-4">
          <Button
            className={cn(
              "flex-grow h-24 text-3xl font-black gap-4 rounded-[2rem] shadow-2xl transition-all active:scale-95",
              isLastStop ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" : "bg-primary shadow-primary/20",
              (!locationVerified) && "border-4 border-yellow-500"
            )}
            onClick={handleArrive}
          >
            {isLastStop ? (
              <>
                FINISH TRIP
                <Flag size={32} fill="currentColor" />
              </>
            ) : (
              <>
                ARRIVED
                <Navigation size={32} fill="currentColor" className="rotate-90" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Multi-Modal Location Verification Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className={cn(
          "sm:max-w-[425px] rounded-[3rem] border-0",
          isDrivingMode ? "bg-zinc-900 text-white" : "bg-white"
        )}>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <Globe className="text-primary" size={32} />
              Location Check
            </DialogTitle>
            <DialogDescription className="font-bold uppercase tracking-widest text-xs opacity-50">
              Multi-modal verification required
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 grid grid-cols-3 gap-4">
            <button 
              onClick={() => setLocationMethod("gps")}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-[2rem] border-4 transition-all",
                locationMethod === "gps" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"
              )}
            >
              <Navigation size={32} className={locationMethod === "gps" ? "text-primary" : "opacity-30"} />
              <span className="text-[10px] font-black uppercase">GPS Lock</span>
            </button>
            <button 
              onClick={() => setLocationMethod("wifi")}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-[2rem] border-4 transition-all",
                locationMethod === "wifi" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"
              )}
            >
              <Wifi size={32} className={locationMethod === "wifi" ? "text-primary" : "opacity-30"} />
              <span className="text-[10px] font-black uppercase">WiFi Tri</span>
            </button>
            <button 
              onClick={() => setLocationMethod("manual")}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-[2rem] border-4 transition-all",
                locationMethod === "manual" ? "border-primary bg-primary/10" : "border-transparent bg-white/5"
              )}
            >
              <MapPin size={32} className={locationMethod === "manual" ? "text-primary" : "opacity-30"} />
              <span className="text-[10px] font-black uppercase">Landmark</span>
            </button>
          </div>

          <div className="p-6 rounded-[2rem] bg-primary/10 border-2 border-primary/20">
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">System Insight</p>
            <p className="text-sm font-bold opacity-70 leading-tight">
              {locationMethod === "gps" ? "Connecting to satellite array... Signal strength: Weak" : 
               locationMethod === "wifi" ? "Scanning local networks... MAC address matching active" : 
               "Identify nearby landmarks (e.g., Gas Station, Bank) to confirm position"}
            </p>
          </div>

          <DialogFooter>
            <Button
              className="w-full h-20 text-2xl font-black rounded-2xl transition-all bg-primary text-white"
              onClick={() => {
                setLocationVerified(true);
                setShowLocationDialog(false);
                toast({ title: "Location Confirmed", description: "Multi-modal verification successful." });
              }}
            >
              CONFIRM & ARRIVE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VoiceCommandLayer onCommand={handleVoiceCommand} />

      {/* Global CSS for Animations & Leaflet Customization */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-div-icon { background: transparent; border: none; }
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper { 
          border-radius: 1rem; 
          background: rgba(0,0,0,0.8); 
          color: white; 
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-popup-tip { background: rgba(0,0,0,0.8); }
      `}</style>
    </div>
  );
};

export default DriverTripActive;
