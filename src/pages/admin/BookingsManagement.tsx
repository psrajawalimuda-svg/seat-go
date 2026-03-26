import { useState } from "react";
import { useBookings, useTrips, usePickupPoints, toTrip } from "@/hooks/use-supabase-data";
import { formatPrice } from "@/data/shuttle-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function BookingsManagement() {
  const { data: bookings = [], isLoading, updateStatus } = useBookings();
  const { data: dbTrips = [] } = useTrips();
  const { data: pickupPoints = [] } = usePickupPoints();
  const [filter, setFilter] = useState<"all" | "paid" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const trips = dbTrips.map(toTrip);

  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => b.passenger_name.toLowerCase().includes(search.toLowerCase()));

  const statusColor: Record<string, string> = {
    paid: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "paid" ? "completed" : current === "completed" ? "cancelled" : "paid";
    try {
      await updateStatus.mutateAsync({ id, status: next });
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Bookings</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 w-64" placeholder="Search passenger..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "paid", "completed", "cancelled"] as const).map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">{s}</Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Passenger</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const trip = trips.find(t => t.id === b.trip_id);
                const pickup = pickupPoints.find(p => p.id === b.pickup_point_id);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{b.passenger_name}</p>
                        <p className="text-xs text-muted-foreground">{b.passenger_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{trip?.routeName}</TableCell>
                    <TableCell className="text-sm">{pickup?.label}</TableCell>
                    <TableCell>#{b.seat_number}</TableCell>
                    <TableCell>{formatPrice(b.total_price)}</TableCell>
                    <TableCell className="text-sm">{b.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`cursor-pointer ${statusColor[b.status]}`} onClick={() => toggleStatus(b.id, b.status)}>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
