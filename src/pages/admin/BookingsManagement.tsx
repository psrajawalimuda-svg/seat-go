import { useState, useMemo } from "react";
import { useBookings, useTrips, usePickupPoints, toTrip } from "@/hooks/use-supabase-data";
import { formatPrice } from "@/data/shuttle-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Search, Filter, CheckCircle2, XCircle, Clock, 
  MoreVertical, Download, Printer, FileText,
  Calendar, User, MapPin
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";

export default function BookingsManagement() {
  const { data: bookings = [], isLoading, updateStatus } = useBookings();
  const { data: dbTrips = [] } = useTrips();
  const { data: pickupPoints = [] } = usePickupPoints();
  
  const [filter, setFilter] = useState<"all" | "paid" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const trips = useMemo(() => dbTrips.map(toTrip), [dbTrips]);

  const filtered = useMemo(() => {
    return bookings
      .filter(b => filter === "all" || b.status === filter)
      .filter(b => 
        b.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      );
  }, [bookings, filter, search]);

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    paid: { label: "Paid", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Clock },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-600 border-red-200", icon: XCircle },
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Booking ${status} successfully`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const openDetails = (booking: any) => {
    const trip = trips.find(t => t.id === booking.trip_id);
    const pickup = pickupPoints.find(p => p.id === booking.pickup_point_id);
    setSelectedBooking({ ...booking, trip, pickup });
    setDetailsOpen(true);
  };

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-12 w-1/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Booking Registry</h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Real-time ticket management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 font-bold uppercase text-xs rounded-xl h-10 px-4">
            <Printer className="h-4 w-4" /> Print All
          </Button>
          <Button variant="outline" className="gap-2 font-bold uppercase text-xs rounded-xl h-10 px-4">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
          <Input 
            placeholder="Search by passenger name or ticket ID..." 
            className="pl-12 h-14 rounded-2xl border-2 font-bold text-lg focus:border-primary"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-muted p-1 rounded-2xl flex gap-1 h-14">
          {(["all", "paid", "completed", "cancelled"] as const).map(s => (
            <Button 
              key={s} 
              variant={filter === s ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setFilter(s)} 
              className={cn(
                "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-full",
                filter === s ? "shuttle-gradient text-white shadow-lg" : "hover:bg-background"
              )}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <Card className="rounded-[2rem] border-2 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px] tracking-widest px-6 py-4">Passenger</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Trip / Route</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Pickup & Seat</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Date & Price</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const trip = trips.find(t => t.id === b.trip_id);
                const pickup = pickupPoints.find(p => p.id === b.pickup_point_id);
                const config = statusConfig[b.status] || statusConfig.paid;
                const StatusIcon = config.icon;

                return (
                  <TableRow key={b.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                          {b.passenger_name[0]}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tight leading-none mb-1">{b.passenger_name}</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{b.passenger_phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-tight">{trip?.routeName || "Unknown Trip"}</p>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-zinc-900 text-white border-0">
                          {b.id.slice(0, 8)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-tight">{pickup?.label}</span>
                      </div>
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20 font-black text-[9px] uppercase px-1.5 py-0">
                        Seat #{b.seat_number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase opacity-60">
                          <Calendar className="h-3 w-3" /> {b.date}
                        </div>
                        <p className="text-xs font-black text-primary">{formatPrice(b.total_price)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-lg font-black uppercase text-[9px] tracking-widest px-2 py-0.5 border-2", config.color)}>
                        <StatusIcon className="h-2.5 w-2.5 mr-1" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          onClick={() => openDetails(b)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-2">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50 tracking-widest">Update Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(b.id, "paid")} className="text-xs font-bold uppercase gap-2">
                              <Clock className="h-3.5 w-3.5 text-blue-500" /> Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(b.id, "completed")} className="text-xs font-bold uppercase gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(b.id, "cancelled")} className="text-xs font-bold uppercase gap-2 text-red-500">
                              <XCircle className="h-3.5 w-3.5" /> Cancel Booking
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-bold italic opacity-30">
                    No bookings found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-2 shadow-2xl">
          {selectedBooking && (
            <>
              <div className="bg-primary p-8 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Ticket Manifest</p>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">SG-{selectedBooking.id.slice(0, 6).toUpperCase()}</h2>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 font-black uppercase text-[10px] tracking-widest">
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-xl">
                    {selectedBooking.passenger_name[0]}
                  </div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-tight">{selectedBooking.passenger_name}</p>
                    <p className="text-xs font-bold opacity-70 tracking-widest">{selectedBooking.passenger_phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Travel Date
                    </p>
                    <p className="font-bold">{selectedBooking.date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Pickup
                    </p>
                    <p className="font-bold">{selectedBooking.pickup?.label || "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Seat No.
                    </p>
                    <p className="font-bold">#{selectedBooking.seat_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Fare
                    </p>
                    <p className="font-black text-primary">{formatPrice(selectedBooking.total_price)}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-2xl border-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <Navigation className="h-3 w-3" /> Route Information
                  </p>
                  <p className="font-black uppercase text-sm">{selectedBooking.trip?.routeName || "N/A"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0">Departure: {selectedBooking.trip?.departureTime}</Badge>
                    <Badge variant="outline" className="text-[8px] font-black uppercase px-1.5 py-0">Gate: G-01</Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-8 pt-0 gap-2">
                <Button variant="outline" onClick={() => setDetailsOpen(false)} className="rounded-xl font-bold uppercase text-xs h-12 flex-1">Close</Button>
                <Button className="shuttle-gradient rounded-xl font-black uppercase text-xs h-12 flex-1 gap-2">
                  <Printer className="h-4 w-4" /> Print Ticket
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

