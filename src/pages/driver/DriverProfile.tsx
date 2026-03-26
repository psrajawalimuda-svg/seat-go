import { motion } from "framer-motion";
import { Star, Route, DollarSign, Bell, Globe, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useDrivers } from "@/hooks/use-supabase-data";
import { formatPrice } from "@/data/shuttle-data";
import { Skeleton } from "@/components/ui/skeleton";

export default function DriverProfile() {
  const { data: drivers, isLoading } = useDrivers();
  const DRIVER = drivers?.[0];

  if (isLoading) {
    return (
      <div className="mobile-container bg-background pb-24">
        <ScreenHeader title="Profil Saya" />
        <div className="px-4 py-4 space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div>
        <DriverBottomNav />
      </div>
    );
  }

  if (!DRIVER) return null;

  return (
    <div className="mobile-container bg-background pb-24">
      <ScreenHeader title="Profil Saya" />

      <div className="px-4 py-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="shuttle-card-elevated flex items-center gap-4">
          <div className="w-16 h-16 rounded-full shuttle-gradient flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">{DRIVER.name.split(" ")[1]?.[0] || "D"}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{DRIVER.name}</h2>
            <p className="text-sm text-muted-foreground">{DRIVER.phone}</p>
            <p className="text-xs text-muted-foreground">{DRIVER.plate}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rating", value: DRIVER.rating.toString(), icon: Star, color: "text-[hsl(var(--shuttle-warning))]" },
            { label: "Total Trip", value: DRIVER.total_trips.toString(), icon: Route, color: "text-primary" },
            { label: "Bulan Ini", value: formatPrice(2450000), icon: DollarSign, color: "text-secondary" },
          ].map((s) => (
            <div key={s.label} className="shuttle-card text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="shuttle-card space-y-4">
          <h3 className="text-sm font-bold text-foreground">Pengaturan</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Bell className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Notifikasi</span></div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Bahasa</span></div>
            <span className="text-sm text-muted-foreground">Indonesia</span>
          </div>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-2xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="w-4 h-4 mr-2" /> Keluar
        </Button>
      </div>

      <DriverBottomNav />
    </div>
  );
}
