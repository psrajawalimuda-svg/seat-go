import { MOCK_TRIPS, PICKUP_POINTS, formatPrice } from "./shuttle-data";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  plate: string;
  status: "active" | "inactive" | "on-trip";
  rating: number;
  totalTrips: number;
}

export interface BookingRecord {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  pickupPointId: string;
  seatNumber: number;
  date: string;
  totalPrice: number;
  status: "paid" | "completed" | "cancelled";
  bookedAt: string;
}

export const MOCK_DRIVERS: Driver[] = [
  { id: "d1", name: "Pak Ahmad", phone: "+62812345678", plate: "B 1234 XY", status: "on-trip", rating: 4.8, totalTrips: 342 },
  { id: "d2", name: "Pak Budi", phone: "+62898765432", plate: "D 5678 AB", status: "active", rating: 4.6, totalTrips: 287 },
  { id: "d3", name: "Pak Chandra", phone: "+62856789012", plate: "B 9012 CD", status: "active", rating: 4.9, totalTrips: 415 },
  { id: "d4", name: "Pak Deni", phone: "+62821234567", plate: "D 3456 EF", status: "on-trip", rating: 4.5, totalTrips: 198 },
  { id: "d5", name: "Pak Eko", phone: "+62834567890", plate: "B 7890 GH", status: "active", rating: 4.7, totalTrips: 523 },
  { id: "d6", name: "Pak Fajar", phone: "+62845678901", plate: "D 2345 IJ", status: "inactive", rating: 4.3, totalTrips: 156 },
  { id: "d7", name: "Pak Gunawan", phone: "+62867890123", plate: "B 6789 KL", status: "active", rating: 4.4, totalTrips: 231 },
];

export const MOCK_BOOKINGS: BookingRecord[] = [
  { id: "b1", tripId: "t1", passengerName: "Andi Pratama", passengerPhone: "+62811111111", pickupPointId: "j1", seatNumber: 1, date: "2026-03-26", totalPrice: 35000, status: "paid", bookedAt: "2026-03-25 14:30" },
  { id: "b2", tripId: "t1", passengerName: "Bima Setiawan", passengerPhone: "+62822222222", pickupPointId: "j3", seatNumber: 4, date: "2026-03-26", totalPrice: 35000, status: "paid", bookedAt: "2026-03-25 15:10" },
  { id: "b3", tripId: "t2", passengerName: "Citra Dewi", passengerPhone: "+62833333333", pickupPointId: "j5", seatNumber: 2, date: "2026-03-26", totalPrice: 28000, status: "completed", bookedAt: "2026-03-24 09:00" },
  { id: "b4", tripId: "t2", passengerName: "Dina Maharani", passengerPhone: "+62844444444", pickupPointId: "j7", seatNumber: 3, date: "2026-03-26", totalPrice: 28000, status: "cancelled", bookedAt: "2026-03-24 10:20" },
  { id: "b5", tripId: "t3", passengerName: "Erik Susanto", passengerPhone: "+62855555555", pickupPointId: "j2", seatNumber: 1, date: "2026-03-26", totalPrice: 35000, status: "paid", bookedAt: "2026-03-25 20:00" },
  { id: "b6", tripId: "t4", passengerName: "Fani Lestari", passengerPhone: "+62866666666", pickupPointId: "j10", seatNumber: 1, date: "2026-03-26", totalPrice: 50000, status: "paid", bookedAt: "2026-03-25 22:15" },
  { id: "b7", tripId: "t4", passengerName: "Gilang Ramadhan", passengerPhone: "+62877777777", pickupPointId: "j12", seatNumber: 2, date: "2026-03-26", totalPrice: 50000, status: "completed", bookedAt: "2026-03-23 08:00" },
  { id: "b8", tripId: "t5", passengerName: "Hana Putri", passengerPhone: "+62888888888", pickupPointId: "j4", seatNumber: 5, date: "2026-03-26", totalPrice: 22000, status: "paid", bookedAt: "2026-03-26 06:00" },
  { id: "b9", tripId: "t1", passengerName: "Irfan Hidayat", passengerPhone: "+62899999999", pickupPointId: "j8", seatNumber: 7, date: "2026-03-25", totalPrice: 35000, status: "completed", bookedAt: "2026-03-24 17:30" },
  { id: "b10", tripId: "t5", passengerName: "Joko Widodo", passengerPhone: "+62810101010", pickupPointId: "j15", seatNumber: 10, date: "2026-03-25", totalPrice: 22000, status: "completed", bookedAt: "2026-03-24 12:00" },
];

export function getAdminStats() {
  const totalBookings = MOCK_BOOKINGS.length;
  const totalRevenue = MOCK_BOOKINGS.filter(b => b.status !== "cancelled").reduce((sum, b) => sum + b.totalPrice, 0);
  const activeDrivers = MOCK_DRIVERS.filter(d => d.status !== "inactive").length;
  const tripsToday = MOCK_TRIPS.length;
  return { totalBookings, totalRevenue, activeDrivers, tripsToday };
}
