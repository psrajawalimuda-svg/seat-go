import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookingProvider } from "@/context/BookingContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import ETicket from "./pages/ETicket";
import DriverTracking from "./pages/DriverTracking";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import DriverHome from "./pages/driver/DriverHome";
import DriverTripDetail from "./pages/driver/DriverTripDetail";
import DriverTrips from "./pages/driver/DriverTrips";
import DriverPassengers from "./pages/driver/DriverPassengers";
import DriverProfile from "./pages/driver/DriverProfile";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import DriversManagement from "./pages/admin/DriversManagement";
import TripsManagement from "./pages/admin/TripsManagement";
import BookingsManagement from "./pages/admin/BookingsManagement";
import PickupPointsManagement from "./pages/admin/PickupPointsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BookingProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/seats" element={<SeatSelection />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/ticket" element={<ETicket />} />
            <Route path="/tracking" element={<DriverTracking />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/driver" element={<DriverHome />} />
            <Route path="/driver/trip/:id" element={<DriverTripDetail />} />
            <Route path="/driver/trips" element={<DriverTrips />} />
            <Route path="/driver/passengers" element={<DriverPassengers />} />
            <Route path="/driver/profile" element={<DriverProfile />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="drivers" element={<DriversManagement />} />
              <Route path="trips" element={<TripsManagement />} />
              <Route path="bookings" element={<BookingsManagement />} />
              <Route path="pickup-points" element={<PickupPointsManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
