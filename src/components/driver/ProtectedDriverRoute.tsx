import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, XCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedDriverRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();

  const { data: driver, isLoading: isDriverLoading } = useQuery({
    queryKey: ["driver-approval", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("drivers")
        .select("approval_status, rejection_reason, ktp_url, sim_url, photo_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading || isDriverLoading) {
    return (
      <div className="mobile-container min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has driver role
  if (profile?.role !== "driver" && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (driver && driver.approval_status === "pending") {
    // Check if documents are incomplete → redirect to onboarding
    const needsOnboarding = !(driver as any).ktp_url || !(driver as any).sim_url || !(driver as any).photo_url;
    if (needsOnboarding) {
      return <Navigate to="/driver/onboarding" replace />;
    }

    return (
      <div className="mobile-container min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-yellow-500/10 text-yellow-600">
          <Clock size={40} />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Akun Dalam Review</h1>
        <p className="text-sm text-muted-foreground font-medium mb-8">
          Dokumen Anda sudah lengkap. Tim kami sedang meninjau pendaftaran Anda.
        </p>
        <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2" onClick={() => signOut()}>
          <LogOut size={18} /> Keluar Akun
        </Button>
      </div>
    );
  }

  if (driver && driver.approval_status === "rejected") {
    return (
      <div className="mobile-container min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-destructive/10 text-destructive">
          <XCircle size={40} />
        </div>
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Pendaftaran Ditolak</h1>
        <p className="text-sm text-muted-foreground font-medium mb-8">
          {`Alasan: ${driver.rejection_reason || "Tidak memenuhi kriteria."}`}
        </p>
        <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2" onClick={() => signOut()}>
          <LogOut size={18} /> Keluar Akun
        </Button>
      </div>
    );
  }

  if (driver && driver.approval_status !== "approved") {
    return <Navigate to="/driver/onboarding" replace />;
  }

  return <>{children}</>;
}
