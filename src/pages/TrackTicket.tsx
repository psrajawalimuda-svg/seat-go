import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  QrCode, 
  Ticket, 
  ArrowRight, 
  AlertCircle,
  ChevronLeft,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useBookings, useTrips, DbBooking } from "@/hooks/use-supabase-data";
import { useBooking } from "@/context/BookingContext";
import { toast } from "sonner";

export default function TrackTicket() {
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { data: allBookings = [] } = useBookings();
  const { data: allTrips = [] } = useTrips();
  const { setBooking } = useBooking();

  const handleSearch = () => {
    if (!ticketId.trim()) {
      toast.error("Masukkan nomor tiket");
      return;
    }

    // Logic PoC: Mencari booking berdasarkan partial ID atau reference
    // Dalam aplikasi nyata, ini akan memanggil API validasi tiket
    const booking = allBookings.find(b => 
      b.id.toLowerCase().includes(ticketId.toLowerCase()) || 
      ticketId.toUpperCase().includes("SG-") // Simulation for SG-XXXX
    );

    if (booking) {
      const trip = allTrips.find(t => t.id === booking.trip_id);
      if (trip) {
        setBooking({
          id: booking.id,
          tripId: booking.trip_id,
          passengerName: booking.passenger_name,
          passengerPhone: booking.passenger_phone,
          pickupPoint: { id: booking.pickup_point_id, label: "", name: "", order: 0, coords: [0,0], minutesFromStart: 0 },
          seatNumber: booking.seat_number,
          date: booking.date,
          totalPrice: booking.total_price,
          status: booking.status as any,
          bookedAt: booking.booked_at
        });
        toast.success("Tiket ditemukan! Menghubungkan ke GPS Driver...");
        navigate("/tracking");
      } else {
        toast.error("Data perjalanan tidak ditemukan");
      }
    } else {
      toast.error("Nomor tiket tidak valid atau sudah kadaluarsa");
    }
  };

  const toggleScan = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      toast.info("Membuka Kamera...", { description: "Simulasi: Arahkan ke QR Code Tiket" });
      // Simulasi scan berhasil setelah 2 detik
      setTimeout(() => {
        setTicketId("SG-DEMO-2026");
        setIsScanning(false);
        toast.success("Barcode Terdeteksi!");
      }, 2000);
    }
  };

  return (
    <div className="mobile-container min-h-screen bg-background">
      <ScreenHeader title="Lacak Tiket" onBack={() => navigate("/")} />

      <div className="px-6 py-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-foreground tracking-tight">Lacak Perjalanan</h2>
          <p className="text-sm text-muted-foreground">
            Masukkan nomor tiket atau scan QR Code untuk melihat posisi driver secara real-time.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Contoh: SG-XXXX" 
              className="h-14 pl-12 pr-4 rounded-2xl border-2 border-muted bg-muted/20 focus:border-primary focus:bg-background transition-all text-lg font-bold tracking-widest uppercase"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <Button 
            onClick={handleSearch}
            className="w-full h-14 rounded-2xl shuttle-gradient text-white font-bold text-lg shadow-lg active:scale-95 transition-all"
          >
            Lacak Sekarang
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Atau</span></div>
          </div>

          <Button 
            variant="outline"
            onClick={toggleScan}
            disabled={isScanning}
            className="w-full h-14 rounded-2xl border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold text-lg transition-all"
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Memindai...
              </span>
            ) : (
              <>
                <Scan className="w-5 h-5 mr-2" />
                Scan Barcode Tiket
              </>
            )}
          </Button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-secondary-foreground leading-relaxed font-medium">
            <strong>Tips:</strong> Anda juga bisa melihat tiket aktif secara otomatis di 
            <button onClick={() => navigate("/dashboard")} className="mx-1 text-primary font-black underline underline-offset-2">Dashboard</button> 
            jika Anda memesan tiket menggunakan perangkat ini.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
