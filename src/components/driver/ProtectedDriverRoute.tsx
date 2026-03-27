import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProtectedDriverRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();

  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ["driver-approval", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("drivers")
        .select("approval_status, rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (isLoading || driverLoading) {
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

  if (profile?.role !== "driver" && profile?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Check approval status
  if (driver && driver.approval_status !== "approved") {
    const isPending = driver.approval_status === "pending";
    const reason = (driver as any).rejection_reason || "Tidak memenuhi persyaratan";

    return (
      <div className="mobile-container min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-[2rem] shadow-2xl p-8 border max-w-sm w-full text-center space-y-4">
          {isPending ? (
            <>
              <Clock className="w-16 h-16 mx-auto text-yellow-500" />
              <h2 className="text-xl font-black uppercase tracking-tight">Menunggu Persetujuan</h2>
              <p className="text-sm text-muted-foreground font-bold">
                Akun Anda sedang dalam proses review oleh admin. Kami akan memberitahu Anda setelah disetujui.
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 mx-auto text-destructive" />
              <h2 className="text-xl font-black uppercase tracking-tight">Pendaftaran Ditolak</h2>
              <p className="text-sm text-muted-foreground font-bold">Alasan: {reason}</p>
            </>
          )}
          <Button
            variant="outline"
            className="w-full rounded-xl font-bold"
            onClick={() => signOut()}
          >
            Keluar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
