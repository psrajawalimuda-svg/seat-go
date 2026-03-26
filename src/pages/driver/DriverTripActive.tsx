import { useNavigate } from "react-router-dom";
import { useDriver } from "@/context/DriverContext";
import { usePickupPoints } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { 
  Navigation, AlertTriangle, Flag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceCommandLayer } from "@/components/driver/VoiceCommandLayer";
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Sub-components ---
import { TripActiveHeader } from "@/components/driver/trip-active/TripActiveHeader";
import { TripActiveMapView } from "@/components/driver/trip-active/TripActiveMapView";
import { TripActiveListView } from "@/components/driver/trip-active/TripActiveListView";
import { LocationVerificationDialog } from "@/components/driver/trip-active/LocationVerificationDialog";

// --- Custom Hooks ---
import { useTripTracking } from "@/hooks/use-trip-tracking";

const DriverTripActive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    activeTrip, currentStopIndex, bookings, isDrivingMode, playFeedback, 
    nextStop, trafficLevel, weather, 
    activeEvents, resolveEvent, etaAdjustment, 
    scheduleDeviation, setScheduleDeviation, locationVerified, setLocationVerified
  } = useDriver();
  
  const { data: allPickupPoints = [], isLoading: isLoadingPoints } = usePickupPoints();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const [followBus, setFollowBus] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  const stops = useMemo(() => allPickupPoints, [allPickupPoints]);
  const routeCoords = useMemo(() => stops.map(s => s.coords), [stops]);

  // --- Real-time Tracking Hook ---
  const { currentPos, bearing, speed, error: trackingError } = useTripTracking({
    activeTrip,
    currentStopIndex,
    throttleMs: 5000 
  });

  // Handle tracking errors
  useEffect(() => {
    if (trackingError) {
      toast({
        title: "Tracking Status",
        description: trackingError,
        variant: "destructive"
      });
    }
  }, [trackingError, toast]);

  // Redirect if no active trip
  useEffect(() => {
    if (!activeTrip) {
      navigate("/driver");
    }
  }, [activeTrip, navigate]);

  if (!activeTrip) {
    return null; // Render nothing while redirecting
  }

  if (isLoadingPoints) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Loading Mission Data</h2>
        <p className="opacity-50 mt-2 font-bold uppercase tracking-widest text-xs">Syncing with satellite array...</p>
      </div>
    );
  }

  // Schedule Deviation Monitoring (Simulated)
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const drift = (Math.random() - 0.5) * 2;
      setScheduleDeviation(scheduleDeviation + drift);

      if (scheduleDeviation > 5) {
        toast({
          title: "Late Arrival Warning",
          description: `You are ${Math.round(scheduleDeviation)}m behind schedule. Passengers notified.`,
          variant: "destructive"
        });
      }
    }, 15000);

    return () => clearInterval(monitorInterval);
  }, [scheduleDeviation, setScheduleDeviation, toast]);

  // Traffic Alerts
  useEffect(() => {
    if (etaAdjustment > 20) {
      toast({
        title: "Critical Traffic Delay",
        description: "Significant delay detected. Customer service notified.",
        variant: "destructive"
      });
      playFeedback("error");
    }
  }, [etaAdjustment, toast, playFeedback]);

  const isLastStop = currentStopIndex >= stops.length - 1;
  const currentStop = stops[currentStopIndex];
  const progressPercent = stops.length > 0 ? ((currentStopIndex) / (stops.length - 1)) * 100 : 0;
  const totalPax = bookings.length;

  const handleArrive = () => {
    if (!locationVerified) {
      setShowLocationDialog(true);
      return;
    }
    if (isLastStop) {
      navigate("/driver");
      return;
    }
    playFeedback("success");
    nextStop();
    toast({
      title: "Arrived at Stop",
      description: `Arrived at ${stops[currentStopIndex].label}.`,
    });
  };

  const handleVoiceCommand = (command: string) => {
    if (command === "arrive") handleArrive();
    else if (command === "next stop" && currentStopIndex < stops.length - 1) nextStop();
  };

  return (
    <div className={cn(
      "min-h-screen pb-40 transition-colors duration-500",
      isDrivingMode ? "bg-black text-white" : "bg-background text-foreground"
    )}>
      <TripActiveHeader 
        routeName={activeTrip.routeName}
        isDrivingMode={isDrivingMode}
        weather={weather}
        trafficLevel={trafficLevel}
        viewMode={viewMode}
        setViewMode={setViewMode}
        scheduleDeviation={scheduleDeviation}
        locationVerified={locationVerified}
        currentStopIndex={currentStopIndex}
        totalStops={stops.length}
        totalPax={totalPax}
        progressPercent={progressPercent}
      />

      {/* Floating Alerts */}
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
          <TripActiveListView 
            stops={stops}
            currentStopIndex={currentStopIndex}
            bookings={bookings}
            scheduleDeviation={scheduleDeviation}
          />
        ) : (
          <TripActiveMapView 
            currentPos={currentPos || (stops.length > 0 ? stops[0].coords : null)}
            bearing={bearing}
            speed={speed}
            followBus={followBus}
            setFollowBus={setFollowBus}
            isDrivingMode={isDrivingMode}
            routeCoords={routeCoords}
            currentStopIndex={currentStopIndex}
            stops={stops}
            trafficLevel={trafficLevel}
            etaAdjustment={etaAdjustment}
            scheduleDeviation={scheduleDeviation}
            mapRef={mapRef}
          />
        )}
      </div>

      {/* Action Button */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-6 z-50 transition-all duration-500",
        isDrivingMode ? "bg-black/90 backdrop-blur-xl border-t border-white/10" : "bg-white/90 backdrop-blur-md border-t"
      )}>
        <div className="mx-auto max-w-md flex gap-4">
          <Button
            className={cn(
              "flex-grow h-24 text-3xl font-black gap-4 rounded-[2rem] shadow-2xl transition-all active:scale-95",
              isLastStop ? "bg-green-600 hover:bg-green-700" : "bg-primary",
              (!locationVerified) && "border-4 border-yellow-500"
            )}
            onClick={handleArrive}
          >
            {isLastStop ? (
              <>FINISH TRIP <Flag size={32} fill="currentColor" /></>
            ) : (
              <>ARRIVED <Navigation size={32} fill="currentColor" className="rotate-90" /></>
            )}
          </Button>
        </div>
      </div>

      <LocationVerificationDialog 
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        isDrivingMode={isDrivingMode}
        onConfirm={() => {
          setLocationVerified(true);
          setShowLocationDialog(false);
          toast({ title: "Location Confirmed" });
        }}
      />

      <VoiceCommandLayer onCommand={handleVoiceCommand} />

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
