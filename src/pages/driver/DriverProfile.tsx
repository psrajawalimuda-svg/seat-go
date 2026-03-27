import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Route, DollarSign, Bell, Globe, LogOut, Pencil, Save, X, Upload, FileText, Camera, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DriverBottomNav } from "@/components/driver/DriverBottomNav";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useDrivers } from "@/hooks/use-supabase-data";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function DriverProfile() {
  const { data: drivers, isLoading } = useDrivers();
  const { user, profile, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const ktpRef = useRef<HTMLInputElement>(null);
  const simRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  
  const DRIVER = useMemo(() => {
    if (!drivers || !user) return null;
    return drivers.find(d => d.user_id === user.id) || drivers[0];
  }, [drivers, user]);

  const [formData, setForm] = useState({
    name: DRIVER?.name || "",
    phone: DRIVER?.phone || "",
    plate: DRIVER?.plate || ""
  });

  // Sync form when DRIVER loads
  useMemo(() => {
    if (DRIVER) {
      setForm({ name: DRIVER.name, phone: DRIVER.phone, plate: DRIVER.plate });
    }
  }, [DRIVER?.id]);

  const handleUpdate = async () => {
    if (!user || !DRIVER) return;
    setIsSaving(true);
    try {
      const { error: driverError } = await supabase
        .from("drivers")
        .update({ 
          name: formData.name, 
          phone: formData.phone, 
          plate: formData.plate 
        } as any)
        .eq("id", DRIVER.id);

      if (driverError) throw driverError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          full_name: formData.name, 
          phone: formData.phone 
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("Profil berhasil diperbarui!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Gagal memperbarui profil: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: "ktp" | "sim" | "photo") => {
    if (!user || !DRIVER) return;
    setUploading(type);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${type}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("driver-documents")
        .getPublicUrl(path);

      const columnMap = { ktp: "ktp_url", sim: "sim_url", photo: "photo_url" };
      const { error: updateError } = await supabase
        .from("drivers")
        .update({ [columnMap[type]]: urlData.publicUrl } as any)
        .eq("id", DRIVER.id);

      if (updateError) throw updateError;

      toast.success(`${type.toUpperCase()} berhasil diupload!`);
    } catch (err: any) {
      toast.error(`Gagal upload ${type}: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

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

  const docItems = [
    { key: "ktp" as const, label: "KTP", url: (DRIVER as any).ktp_url, ref: ktpRef, icon: FileText },
    { key: "sim" as const, label: "SIM", url: (DRIVER as any).sim_url, ref: simRef, icon: FileText },
    { key: "photo" as const, label: "Foto Profil", url: (DRIVER as any).photo_url, ref: photoRef, icon: Camera },
  ];

  return (
    <div className="mobile-container bg-background pb-24">
      <ScreenHeader title="Profil Saya" />

      <div className="px-4 py-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="shuttle-card-elevated">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full shuttle-gradient flex items-center justify-center border-4 border-white shadow-lg overflow-hidden text-2xl font-black text-white">
              {(DRIVER as any).photo_url ? (
                <img src={(DRIVER as any).photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                formData.name[0] || "D"
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black uppercase italic tracking-tight text-foreground leading-none mb-1">
                {formData.name}
              </h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{user?.email}</p>
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-secondary" onClick={handleUpdate} disabled={isSaving}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 pt-4 border-t border-dashed">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Nama Lengkap</Label>
                <Input value={formData.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-11 rounded-xl font-bold border-2 focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">No. Telepon</Label>
                  <Input value={formData.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-11 rounded-xl font-bold border-2 focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Plat Nomor</Label>
                  <Input value={formData.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} className="h-11 rounded-xl font-black border-2 focus:border-primary" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Status Kendaraan</p>
                <Badge variant="outline" className="bg-zinc-900 text-white border-0 font-black px-3 py-1">{formData.plate}</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Telepon</p>
                <p className="font-bold text-sm">{formData.phone}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Document Upload Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="shuttle-card space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dokumen & Foto</h3>
          
          {docItems.map((doc) => (
            <div key={doc.key} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {doc.url ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <doc.icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">{doc.label}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {doc.url ? "Terupload" : "Belum diupload"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="rounded-lg text-[10px] font-bold uppercase h-8">
                      Lihat
                    </Button>
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[10px] font-bold uppercase h-8"
                  disabled={uploading === doc.key}
                  onClick={() => doc.ref.current?.click()}
                >
                  {uploading === doc.key ? "⏳" : <Upload className="w-3 h-3 mr-1" />}
                  {doc.url ? "Ganti" : "Upload"}
                </Button>
                <input
                  ref={doc.ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, doc.key);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rating", value: DRIVER.rating.toFixed(1), icon: Star, color: "text-yellow-500" },
            { label: "Total Trip", value: DRIVER.total_trips.toString(), icon: Route, color: "text-primary" },
            { label: "Bulan Ini", value: "2.4jt", icon: DollarSign, color: "text-secondary" },
          ].map((s) => (
            <div key={s.label} className="shuttle-card text-center py-4">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color} fill-current opacity-20`} />
              <p className="text-lg font-black text-foreground">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="shuttle-card space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Driver Control</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">Push Notifications</span>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">Region & Language</span>
            </div>
            <span className="text-xs font-black uppercase opacity-50">ID / Bahasa</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl border-destructive/20 text-destructive font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all shadow-sm"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" /> End Session
        </Button>
      </div>

      <DriverBottomNav />
    </div>
  );
}
