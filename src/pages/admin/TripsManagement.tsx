import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { MOCK_TRIPS, Trip, formatPrice } from "@/data/shuttle-data";
import { MOCK_DRIVERS } from "@/data/admin-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TripsManagement() {
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState({ routeName: "", departureTime: "", basePrice: "", totalSeats: "", driverName: "", vehiclePlate: "", driverPhone: "" });

  const openAdd = () => {
    setEditing(null);
    setForm({ routeName: "", departureTime: "", basePrice: "", totalSeats: "16", driverName: "", vehiclePlate: "", driverPhone: "" });
    setDialogOpen(true);
  };

  const openEdit = (t: Trip) => {
    setEditing(t);
    setForm({ routeName: t.routeName, departureTime: t.departureTime, basePrice: String(t.basePrice), totalSeats: String(t.totalSeats), driverName: t.driverName, vehiclePlate: t.vehiclePlate, driverPhone: t.driverPhone });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.routeName || !form.departureTime) return;
    if (editing) {
      setTrips(prev => prev.map(t => t.id === editing.id ? { ...t, routeName: form.routeName, departureTime: form.departureTime, basePrice: Number(form.basePrice), totalSeats: Number(form.totalSeats), driverName: form.driverName, vehiclePlate: form.vehiclePlate, driverPhone: form.driverPhone } : t));
    } else {
      const newTrip: Trip = {
        id: `t${Date.now()}`,
        routeName: form.routeName,
        departureTime: form.departureTime,
        basePrice: Number(form.basePrice),
        totalSeats: Number(form.totalSeats),
        bookedSeats: [],
        driverName: form.driverName,
        driverPhone: form.driverPhone,
        vehiclePlate: form.vehiclePlate,
      };
      setTrips(prev => [...prev, newTrip]);
    }
    setDialogOpen(false);
  };

  const selectDriver = (driverId: string) => {
    const driver = MOCK_DRIVERS.find(d => d.id === driverId);
    if (driver) {
      setForm(f => ({ ...f, driverName: driver.name, driverPhone: driver.phone, vehiclePlate: driver.plate }));
    }
  };

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
              {trips.map((t) => {
                const available = t.totalSeats - t.bookedSeats.length;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.routeName}</TableCell>
                    <TableCell>{t.departureTime}</TableCell>
                    <TableCell>{formatPrice(t.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={available <= 2 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-secondary/10 text-secondary border-secondary/20"}>
                        {available}/{t.totalSeats}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.driverName}</TableCell>
                    <TableCell className="font-mono text-xs">{t.vehiclePlate}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Trip" : "Add Trip"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Route Name</Label>
              <Input value={form.routeName} onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))} placeholder="Rayon A - Express" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Departure Time</Label>
                <Input type="time" value={form.departureTime} onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))} />
              </div>
              <div>
                <Label>Base Price (IDR)</Label>
                <Input type="number" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Total Seats</Label>
              <Input type="number" value={form.totalSeats} onChange={e => setForm(f => ({ ...f, totalSeats: e.target.value }))} />
            </div>
            <div>
              <Label>Assign Driver</Label>
              <Select onValueChange={selectDriver}>
                <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>
                  {MOCK_DRIVERS.filter(d => d.status !== "inactive").map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.plate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
