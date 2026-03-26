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
import NotFound from "./pages/NotFound";
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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/seats" element={<SeatSelection />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/ticket" element={<ETicket />} />
            <Route path="/tracking" element={<DriverTracking />} />
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
