import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, XCircle, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedDriverRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();

  const { data: driver, isLoading: isDriverLoading } = useQuery({
    queryKey: ["driver-approval", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("drivers")
        .select("approval_status, rejection_reason")
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

  // Check approval status
  if (driver && driver.approval_status !== "approved") {
    return (
      <div className="mobile-container min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          driver.approval_status === "pending" ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive"
        )}>
          {driver.approval_status === "pending" ? <Clock size={40} /> : <XCircle size={40} />}
        </div>
        
        <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
          {driver.approval_status === "pending" ? "Akun Dalam Review" : "Pendaftaran Ditolak"}
        </h1>
        
        <p className="text-sm text-muted-foreground font-medium mb-8">
          {driver.approval_status === "pending" 
            ? "Tim kami sedang meninjau dokumen pendaftaran Anda. Mohon tunggu proses verifikasi selesai."
            : `Mohon maaf, pendaftaran Anda belum dapat kami setujui. Alasan: ${driver.rejection_reason || "Tidak memenuhi kriteria."}`
          }
        </p>

        <div className="w-full space-y-3">
          {driver.approval_status === "pending" && (
            <Button 
              className="w-full h-12 rounded-xl font-bold shuttle-gradient text-white"
              onClick={() => window.location.href = "/driver/profile"}
            >
              Lengkapi Dokumen Profil
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl font-bold gap-2"
            onClick={() => signOut()}
          >
            <LogOut size={18} /> Keluar Akun
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Add missing cn helper for the component
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
