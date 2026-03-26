import { useState } from "react";
import { Pencil, MapPin } from "lucide-react";
import { PICKUP_POINTS, PickupPoint } from "@/data/shuttle-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PickupPointsManagement() {
  const [points, setPoints] = useState<PickupPoint[]>(PICKUP_POINTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PickupPoint | null>(null);
  const [form, setForm] = useState({ name: "", minutesFromStart: "" });

  const openEdit = (p: PickupPoint) => {
    setEditing(p);
    setForm({ name: p.name, minutesFromStart: String(p.minutesFromStart) });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editing || !form.name) return;
    setPoints(prev => prev.map(p => p.id === editing.id ? { ...p, name: form.name, minutesFromStart: Number(form.minutesFromStart) } : p));
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Pickup Points</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {points.length} points
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead className="w-16">Label</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Minutes from Start</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.order}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {p.label}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>+{p.minutesFromStart} min</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.coords[0].toFixed(4)}, {p.coords[1].toFixed(4)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
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
            <DialogTitle>Edit {editing?.label} — {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Minutes from Start</Label>
              <Input type="number" value={form.minutesFromStart} onChange={e => setForm(f => ({ ...f, minutesFromStart: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
