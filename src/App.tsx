import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookingProvider } from "@/context/BookingContext";
import { DriverProvider } from "@/context/DriverContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedDriverRoute } from "@/components/driver/ProtectedDriverRoute";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import ETicket from "./pages/ETicket";
import DriverTracking from "./pages/DriverTracking";
import TrackTicket from "./pages/TrackTicket";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import DriverHome from "./pages/driver/DriverHome";
import DriverLogin from "./pages/driver/DriverLogin";
import DriverTripActive from "./pages/driver/DriverTripActive";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverTripDetail from "./pages/driver/DriverTripDetail";
import DriverPassengers from "./pages/driver/DriverPassengers";
import DriverProfile from "./pages/driver/DriverProfile";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import DriversManagement from "./pages/admin/DriversManagement";
import TripsManagement from "./pages/admin/TripsManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import PickupPointsManagement from "./pages/admin/PickupPointsManagement";
import ReviewsManagement from "./pages/admin/ReviewsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BookingProvider>
          <DriverProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/seats" element={<SeatSelection />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/ticket" element={<ETicket />} />
                <Route path="/tracking" element={<DriverTracking />} />
                <Route path="/track-ticket" element={<TrackTicket />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                
                {/* Driver auth */}
                <Route path="/driver/login" element={<DriverLogin />} />
                
                {/* Protected driver routes */}
                <Route path="/driver" element={<ProtectedDriverRoute><DriverHome /></ProtectedDriverRoute>} />
                <Route path="/driver/trip/active" element={<ProtectedDriverRoute><DriverTripActive /></ProtectedDriverRoute>} />
                <Route path="/driver/trips" element={<ProtectedDriverRoute><DriverTrips /></ProtectedDriverRoute>} />
                <Route path="/driver/trip/:id" element={<ProtectedDriverRoute><DriverTripDetail /></ProtectedDriverRoute>} />
                <Route path="/driver/passengers" element={<ProtectedDriverRoute><DriverPassengers /></ProtectedDriverRoute>} />
                <Route path="/driver/profile" element={<ProtectedDriverRoute><DriverProfile /></ProtectedDriverRoute>} />
                
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="drivers" element={<DriversManagement />} />
                  <Route path="trips" element={<TripsManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="pickup-points" element={<PickupPointsManagement />} />
                  <Route path="reviews" element={<ReviewsManagement />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DriverProvider>
        </BookingProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
