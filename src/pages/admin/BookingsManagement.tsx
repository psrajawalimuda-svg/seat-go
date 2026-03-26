import { useState } from "react";
import { MOCK_BOOKINGS, BookingRecord } from "@/data/admin-data";
import { MOCK_TRIPS, PICKUP_POINTS, formatPrice } from "@/data/shuttle-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingRecord[]>(MOCK_BOOKINGS);
  const [filter, setFilter] = useState<"all" | "paid" | "completed" | "cancelled">("all");
  const [search, setSearch] = useState("");

  const filtered = bookings
    .filter(b => filter === "all" || b.status === filter)
    .filter(b => b.passengerName.toLowerCase().includes(search.toLowerCase()));

  const statusColor: Record<string, string> = {
    paid: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const toggleStatus = (id: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      const next = b.status === "paid" ? "completed" : b.status === "completed" ? "cancelled" : "paid";
      return { ...b, status: next as BookingRecord["status"] };
    }));
  };

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
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className="capitalize">
            {s}
          </Button>
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
                const trip = MOCK_TRIPS.find(t => t.id === b.tripId);
                const pickup = PICKUP_POINTS.find(p => p.id === b.pickupPointId);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{b.passengerName}</p>
                        <p className="text-xs text-muted-foreground">{b.passengerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{trip?.routeName}</TableCell>
                    <TableCell className="text-sm">{pickup?.label}</TableCell>
                    <TableCell>#{b.seatNumber}</TableCell>
                    <TableCell>{formatPrice(b.totalPrice)}</TableCell>
                    <TableCell className="text-sm">{b.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`cursor-pointer ${statusColor[b.status]}`}
                        onClick={() => toggleStatus(b.id)}
                      >
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
