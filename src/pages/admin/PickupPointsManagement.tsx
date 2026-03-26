import { useState } from "react";
import { Pencil, MapPin } from "lucide-react";
import { usePickupPoints } from "@/hooks/use-supabase-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PickupPointsManagement() {
  const { data: points = [], isLoading } = usePickupPoints();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", minutesFromStart: "" });

  const openEdit = (p: typeof points[0]) => {
    setEditingId(p.id);
    setForm({ name: p.name, minutesFromStart: String(p.minutesFromStart) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingId || !form.name) return;
    const { error } = await supabase.from("pickup_points").update({
      name: form.name,
      minutes_from_start: Number(form.minutesFromStart),
    } as any).eq("id", editingId);
    if (error) { toast.error("Failed to save"); return; }
    qc.invalidateQueries({ queryKey: ["pickup_points"] });
    setDialogOpen(false);
    toast.success("Pickup point updated");
  };

  if (isLoading) return <Skeleton className="h-64" />;

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
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">{p.label}</span>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>+{p.minutesFromStart} min</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.coords[0].toFixed(4)}, {p.coords[1].toFixed(4)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
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
            <DialogTitle>Edit Pickup Point</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Minutes from Start</Label><Input type="number" value={form.minutesFromStart} onChange={e => setForm(f => ({ ...f, minutesFromStart: e.target.value }))} /></div>
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
