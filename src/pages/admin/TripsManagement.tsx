import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { formatPrice, VEHICLE_LAYOUTS } from "@/data/shuttle-data";
import { useTrips, useDrivers, toTrip, DbTrip } from "@/hooks/use-supabase-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function TripsManagement() {
  const { data: dbTrips = [], isLoading, upsert } = useTrips();
  const { data: drivers = [] } = useDrivers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbTrip | null>(null);
  const [form, setForm] = useState({ route_name: "", departure_time: "", base_price: "", total_seats: "16", driver_id: "" });

  const trips = dbTrips.map(toTrip);

  const openAdd = () => {
    setEditing(null);
    setForm({ route_name: "", departure_time: "", base_price: "", total_seats: "16", driver_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: DbTrip) => {
    setEditing(t);
    setForm({
      route_name: t.route_name,
      departure_time: t.departure_time,
      base_price: String(t.base_price),
      total_seats: String(t.total_seats),
      driver_id: t.driver_id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.route_name || !form.departure_time) return;
    try {
      const payload: any = {
        route_name: form.route_name,
        departure_time: form.departure_time,
        base_price: Number(form.base_price),
        total_seats: Number(form.total_seats),
        driver_id: form.driver_id || null,
      };
      if (editing) payload.id = editing.id;
      await upsert.mutateAsync(payload);
      setDialogOpen(false);
      toast.success(editing ? "Trip updated" : "Trip added");
    } catch {
      toast.error("Failed to save");
    }
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Trips</h2>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Trip</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dbTrips.map((t) => {
                const trip = toTrip(t);
                const available = trip.totalSeats - trip.bookedSeats.length;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{trip.routeName}</TableCell>
                    <TableCell>{trip.departureTime}</TableCell>
                    <TableCell>{formatPrice(trip.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={available <= 2 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-secondary/10 text-secondary border-secondary/20"}>
                        {available}/{trip.totalSeats}
                      </Badge>
                    </TableCell>
                    <TableCell>{trip.driverName}</TableCell>
                    <TableCell className="font-mono text-xs">{trip.vehiclePlate}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Trip" : "Add Trip"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Route Name</Label><Input value={form.route_name} onChange={e => setForm(f => ({ ...f, route_name: e.target.value }))} placeholder="Rayon A - Express" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Departure Time</Label><Input type="time" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} /></div>
              <div><Label>Base Price (IDR)</Label><Input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} /></div>
            </div>
            <div><Label>Total Seats</Label><Input type="number" value={form.total_seats} onChange={e => setForm(f => ({ ...f, total_seats: e.target.value }))} /></div>
            <div>
              <Label>Assign Driver</Label>
              <Select value={form.driver_id} onValueChange={(v) => setForm(f => ({ ...f, driver_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {drivers.filter(d => d.status !== "inactive").map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
