import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, LogIn, UserPlus, AlertCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPendingMessage("");

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check roles
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: authData.user.id, _role: "admin" });
    if (isAdmin) {
      toast.success("Login admin berhasil!");
      navigate("/admin");
      return;
    }

    const { data: isDriver } = await supabase.rpc("has_role", { _user_id: authData.user.id, _role: "driver" });
    if (isDriver) {
      // Check driver approval status
      const { data: driver } = await supabase
        .from("drivers")
        .select("approval_status, rejection_reason")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (driver) {
        if (driver.approval_status === "pending") {
          await supabase.auth.signOut();
          setPendingMessage("Akun Anda sedang dalam proses review oleh admin. Silakan lengkapi profil dan tunggu persetujuan.");
          setLoading(false);
          return;
        }
        if (driver.approval_status === "rejected") {
          const reason = driver.rejection_reason || "Tidak memenuhi persyaratan";
          await supabase.auth.signOut();
          setPendingMessage(`Pendaftaran ditolak: ${reason}`);
          setLoading(false);
          return;
        }
      }

      toast.success("Login driver berhasil!");
      navigate("/driver");
      return;
    }

    // Default to passenger
    toast.success("Login berhasil!");
    navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPendingMessage("");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Gagal membuat akun.");
      setLoading(false);
      return;
    }

    // Create a pending driver record
    const { error: driverError } = await supabase.from("drivers").insert({
      name: fullName,
      phone,
      email,
      plate: "-",
      status: "offline",
      user_id: authData.user.id,
      approval_status: "pending",
    } as any);

    if (driverError) {
      console.error("Driver record creation error:", driverError);
    }

    // Assign driver role via security definer function
    const { error: roleError } = await supabase.rpc("assign_driver_role", {
      _user_id: authData.user.id,
    });

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    toast.success("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
    setPendingMessage("Pendaftaran berhasil! Setelah verifikasi email, akun Anda akan direview oleh admin.");
    setIsSignup(false);
    setLoading(false);
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="shuttle-gradient text-primary-foreground px-6 pt-16 pb-12 rounded-b-[3rem]">
        <div className="flex items-center gap-3 mb-4">
          <Bus size={32} strokeWidth={3} />
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">SEAT-GO</h1>
        </div>
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">
          {isSignup ? "Daftar Akun Driver" : "Login"}
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 -mt-6">
        <div className="bg-card rounded-[2rem] shadow-2xl p-6 space-y-5 border">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {pendingMessage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 text-yellow-700 text-sm font-bold border border-yellow-500/20">
              {pendingMessage.includes("ditolak") ? <XCircle size={20} className="text-destructive mt-0.5 shrink-0" /> : <Clock size={20} className="mt-0.5 shrink-0" />}
              <span>{pendingMessage}</span>
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">No. Telepon</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-12 rounded-xl font-bold"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-14 text-lg font-black rounded-2xl gap-3 shadow-xl",
                "shuttle-gradient text-primary-foreground"
              )}
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : isSignup ? (
                <><UserPlus size={20} /> DAFTAR DRIVER</>
              ) : (
                <><LogIn size={20} /> MASUK</>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(""); setPendingMessage(""); }}
              className="text-sm font-bold text-primary hover:underline"
            >
              {isSignup ? "Sudah punya akun? Login" : "Belum punya akun? Daftar sebagai Driver"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
