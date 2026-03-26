import { useState, useMemo, useEffect } from "react";
import { 
  Plus, Pencil, Phone, Star, Mail, FileText, 
  Search, Map as MapIcon, LayoutGrid, List,
  Navigation, Trash2, ShieldCheck, MoreVertical,
  Activity, Clock, AlertCircle, ChevronRight
} from "lucide-react";
import { useDrivers, DbDriver } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Fix Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Bus Icon for Driver Map
const createDriverIcon = (status: string, bearing: number = 0) => {
  const color = status === 'online' ? '#22c55e' : status === 'busy' ? '#eab308' : '#94a3b8';
  return L.divIcon({
    className: 'driver-marker-icon',
    html: `
      <div style="transform: rotate(${bearing}deg); transition: all 0.5s ease;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: white; border: 3px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L19 21l-7-4-7 4z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

interface DriverForm {
  id?: string;
  name: string;
  phone: string;
  email: string;
  license_number: string;
  plate: string;
  status: string;
}

const initialForm: DriverForm = {
  name: "",
  phone: "",
  email: "",
  license_number: "",
  plate: "",
  status: "offline"
};

// Component to handle map center updates
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function DriversManagement() {
  const { data: drivers = [], isLoading, upsert } = useDrivers();
  const qc = useQueryClient();
  
  const [viewMode, setViewMode] = useState<"table" | "map">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DriverForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // Real-time position tracking (Simulation for this project)
  // In real app, this would be handled by a Supabase realtime subscription
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery)
    );
  }, [drivers, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: drivers.length,
      online: drivers.filter(d => d.status === 'online').length,
      busy: drivers.filter(d => d.status === 'busy').length,
      offline: drivers.filter(d => d.status === 'offline').length,
    };
  }, [drivers]);

  const openAdd = () => {
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEdit = (d: DbDriver) => {
    setForm({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email || "",
      license_number: d.license_number || "",
      plate: d.plate,
      status: d.status
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.plate) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsert.mutateAsync(form as any);
      setDialogOpen(false);
      toast.success(form.id ? "Driver updated" : "Driver added");
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this driver?")) return;
    try {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Driver removed");
      qc.invalidateQueries({ queryKey: ["drivers"] });
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  if (isLoading) return <div className="p-8 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Fleet Management</h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Monitor & control driver operations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-xl flex gap-1">
            <Button 
              variant={viewMode === "table" ? "default" : "ghost"} 
              size="sm" 
              className="rounded-lg h-8 px-3 text-[10px] font-black uppercase"
              onClick={() => setViewMode("table")}
            >
              <List className="h-3.5 w-3.5 mr-1" /> List
            </Button>
            <Button 
              variant={viewMode === "map" ? "default" : "ghost"} 
              size="sm" 
              className="rounded-lg h-8 px-3 text-[10px] font-black uppercase"
              onClick={() => setViewMode("map")}
            >
              <MapIcon className="h-3.5 w-3.5 mr-1" /> Live Map
            </Button>
          </div>
          <Button onClick={openAdd} className="shuttle-gradient gap-2 font-black uppercase text-xs rounded-xl h-10 px-4">
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Fleet", value: stats.total, icon: Activity, color: "text-blue-500" },
          { label: "Active Now", value: stats.online, icon: ShieldCheck, color: "text-green-500" },
          { label: "On Mission", value: stats.busy, icon: Navigation, color: "text-yellow-500" },
          { label: "Offline", value: stats.offline, icon: Clock, color: "text-zinc-500" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-2 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
        <Input 
          placeholder="Search by name, license plate, or phone number..." 
          className="pl-12 h-14 rounded-2xl border-2 font-bold text-lg focus:border-primary"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {viewMode === "table" ? (
        <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest px-6">Driver Info</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Plate/License</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Rating</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/5 text-primary font-black uppercase">{d.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black uppercase tracking-tight text-base leading-none mb-1">{d.name}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold opacity-50 uppercase tracking-widest">
                            <Phone className="h-3 w-3" /> {d.phone}
                          </div>
                          {d.email && (
                            <div className="flex items-center gap-2 text-[10px] font-bold opacity-50 uppercase tracking-widest">
                              <Mail className="h-3 w-3" /> {d.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono text-xs border-2 bg-zinc-900 text-white px-2 py-0.5">{d.plate}</Badge>
                        <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">SIM: {d.license_number || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-lg font-black uppercase text-[9px] tracking-widest px-2 py-0.5",
                        d.status === 'online' ? "bg-green-500" : d.status === 'busy' ? "bg-yellow-500" : "bg-zinc-400"
                      )}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-600 px-2 py-1 rounded-lg w-fit">
                        <Star className="h-3.5 w-3.5 fill-yellow-600" />
                        <span className="font-black text-sm">{d.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500" onClick={() => handleDelete(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDrivers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <AlertCircle className="h-12 w-12 mb-2" />
                        <p className="font-black uppercase tracking-widest">No drivers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[700px]">
          <Card className="xl:col-span-3 rounded-[2.5rem] overflow-hidden border-2 shadow-xl relative z-0">
            <MapContainer 
              center={[-6.2088, 106.8456]} 
              zoom={12} 
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredDrivers.map(d => (
                d.latitude && d.longitude && (
                  <Marker 
                    key={d.id} 
                    position={[d.latitude, d.longitude]} 
                    icon={createDriverIcon(d.status, d.bearing)}
                    eventHandlers={{
                      click: () => setSelectedDriverId(d.id)
                    }}
                  >
                    <Popup className="driver-map-popup">
                      <div className="p-2 min-w-[150px]">
                        <p className="font-black uppercase text-xs text-primary leading-none mb-1">{d.name}</p>
                        <p className="text-[10px] font-black uppercase opacity-50 mb-2">{d.plate}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0",
                            d.status === 'online' ? "bg-green-500" : d.status === 'busy' ? "bg-yellow-500" : "bg-zinc-400"
                          )}>
                            {d.status}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(d)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
              {selectedDriverId && (
                <ChangeView center={[
                  drivers.find(d => d.id === selectedDriverId)?.latitude || -6.2088,
                  drivers.find(d => d.id === selectedDriverId)?.longitude || 106.8456
                ]} />
              )}
            </MapContainer>
            <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur p-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Fleet Tracking
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border-2 shadow-xl overflow-hidden flex flex-col h-full">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">Fleet List</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Quick select for map</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {filteredDrivers.map(d => (
                  <div 
                    key={d.id} 
                    className={cn(
                      "p-4 hover:bg-muted/30 transition-colors cursor-pointer group",
                      selectedDriverId === d.id && "bg-primary/5 border-l-4 border-primary"
                    )}
                    onClick={() => {
                      setSelectedDriverId(d.id);
                      if (d.latitude && d.longitude) setViewMode("map");
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          d.status === 'online' ? "bg-green-500" : d.status === 'busy' ? "bg-yellow-500" : "bg-zinc-400"
                        )} />
                        <div>
                          <p className="font-black uppercase tracking-tight text-sm leading-none mb-1">{d.name}</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{d.plate}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-30 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
              {form.id ? "Edit Driver" : "Register Driver"}
            </DialogTitle>
            <DialogDescription className="font-bold uppercase text-[10px] tracking-widest">
              Maintain personnel records & credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Full Name</Label>
              <Input placeholder="e.g. John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Phone Number</Label>
                <Input placeholder="+62..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Vehicle Plate</Label>
                <Input placeholder="B 1234 XX" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} className="font-mono font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Email Address</Label>
              <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">License (SIM)</Label>
                <Input placeholder="1234-5678-9012" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} className="font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Availability</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="font-black uppercase text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online" className="text-xs font-bold uppercase">Online / Active</SelectItem>
                    <SelectItem value="busy" className="text-xs font-bold uppercase">Busy / On Trip</SelectItem>
                    <SelectItem value="offline" className="text-xs font-bold uppercase">Offline / Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl font-bold uppercase text-xs h-12 px-8">Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting} className="shuttle-gradient rounded-xl font-black uppercase text-xs h-12 px-8 flex-1">
              {isSubmitting ? "Processing..." : "Commit Driver Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .driver-marker-icon { background: none; border: none; }
        .leaflet-container { font-family: inherit; }
        .driver-map-popup .leaflet-popup-content-wrapper { border-radius: 16px; padding: 0; overflow: hidden; }
        .driver-map-popup .leaflet-popup-content { margin: 0; }
      `}</style>
    </div>
  );
}
