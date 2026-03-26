import { DollarSign, Users, Bus, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { formatPrice } from "@/data/shuttle-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDrivers, useTrips, useBookings, usePickupPoints, toTrip } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: drivers = [] } = useDrivers();
  const { data: dbTrips = [], isLoading } = useTrips();
  const { data: bookings = [] } = useBookings();
  const { data: pickupPoints = [] } = usePickupPoints();

  const trips = dbTrips.map(toTrip);

  const totalBookings = bookings.length;
  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + b.total_price, 0);
  const activeDrivers = drivers.filter(d => d.status !== "inactive").length;
  const tripsToday = trips.length;

  const statusColor: Record<string, string> = {
    paid: "bg-primary/10 text-primary border-primary/20",
    completed: "bg-secondary/10 text-secondary border-secondary/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Bookings" value={String(totalBookings)} trend="12% vs last week" trendUp />
        <StatCard icon={DollarSign} label="Revenue" value={formatPrice(totalRevenue)} trend="8% vs last week" trendUp />
        <StatCard icon={Users} label="Active Drivers" value={String(activeDrivers)} />
        <StatCard icon={Bus} label="Trips Today" value={String(tripsToday)} trend="2 more than yesterday" trendUp />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Bookings</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 5).map((b) => {
                  const pickup = pickupPoints.find(p => p.id === b.pickup_point_id);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.passenger_name}</TableCell>
                      <TableCell>{pickup?.label} - {pickup?.name}</TableCell>
                      <TableCell>{formatPrice(b.total_price)}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColor[b.status]}>{b.status}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Today's Trips</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Seats</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.routeName}</TableCell>
                    <TableCell>{t.departureTime}</TableCell>
                    <TableCell>{t.driverName}</TableCell>
                    <TableCell>{t.bookedSeats.length}/{t.totalSeats}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
