import { useState } from "react";
import { Plus, Pencil, Phone, Star } from "lucide-react";
import { MOCK_DRIVERS, Driver } from "@/data/admin-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DriversManagement() {
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", plate: "", status: "active" as Driver["status"] });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", plate: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({ name: d.name, phone: d.phone, plate: d.plate, status: d.status });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.plate) return;
    if (editing) {
      setDrivers(prev => prev.map(d => d.id === editing.id ? { ...d, ...form } : d));
    } else {
      const newDriver: Driver = {
        id: `d${Date.now()}`,
        name: form.name,
        phone: form.phone,
        plate: form.plate,
        status: form.status,
        rating: 0,
        totalTrips: 0,
      };
      setDrivers(prev => [...prev, newDriver]);
    }
    setDialogOpen(false);
  };

  const statusColor: Record<string, string> = {
    active: "bg-secondary/10 text-secondary border-secondary/20",
    inactive: "bg-muted text-muted-foreground border-border",
    "on-trip": "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Drivers</h2>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Driver</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" />{d.phone}</span></TableCell>
                  <TableCell className="font-mono text-xs">{d.plate}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[d.status]}>{d.status}</Badge></TableCell>
                  <TableCell><span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{d.rating}</span></TableCell>
                  <TableCell>{d.totalTrips}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Driver name" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+62..." />
            </div>
            <div>
              <Label>Vehicle Plate</Label>
              <Input value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value }))} placeholder="B 1234 XX" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as Driver["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-trip">On Trip</SelectItem>
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
