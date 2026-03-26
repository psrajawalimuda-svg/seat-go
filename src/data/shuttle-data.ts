export interface PickupPoint {
  id: string;
  label: string;
  name: string;
  order: number;
  minutesFromStart: number;
  coords: [number, number];
}

export interface Trip {
  id: string;
  routeName: string;
  departureTime: string;
  basePrice: number;
  totalSeats: number;
  bookedSeats: number[];
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
}

export interface Booking {
  tripId: string;
  pickupPoint: PickupPoint;
  seatNumber: number;
  date: string;
  destination: string;
  totalPrice: number;
}

export const PICKUP_POINTS: PickupPoint[] = [
  { id: "j1", label: "J1", name: "Terminal Utama", order: 1, minutesFromStart: 0, coords: [-6.9140, 107.6020] },
  { id: "j2", label: "J2", name: "Perumahan Griya", order: 2, minutesFromStart: 3, coords: [-6.9148, 107.6045] },
  { id: "j3", label: "J3", name: "Simpang Tiga", order: 3, minutesFromStart: 6, coords: [-6.9155, 107.6070] },
  { id: "j4", label: "J4", name: "Pasar Lama", order: 4, minutesFromStart: 9, coords: [-6.9162, 107.6095] },
  { id: "j5", label: "J5", name: "Masjid Al-Ikhlas", order: 5, minutesFromStart: 12, coords: [-6.9168, 107.6120] },
  { id: "j6", label: "J6", name: "Taman Kota", order: 6, minutesFromStart: 15, coords: [-6.9173, 107.6148] },
  { id: "j7", label: "J7", name: "RS Harapan", order: 7, minutesFromStart: 18, coords: [-6.9178, 107.6175] },
  { id: "j8", label: "J8", name: "Kampus UNRI", order: 8, minutesFromStart: 22, coords: [-6.9183, 107.6200] },
  { id: "j9", label: "J9", name: "Mall SKA", order: 9, minutesFromStart: 26, coords: [-6.9187, 107.6228] },
  { id: "j10", label: "J10", name: "Bundaran Pesona", order: 10, minutesFromStart: 30, coords: [-6.9190, 107.6255] },
  { id: "j11", label: "J11", name: "Jl. Sudirman", order: 11, minutesFromStart: 34, coords: [-6.9193, 107.6282] },
  { id: "j12", label: "J12", name: "Gedung Sate", order: 12, minutesFromStart: 38, coords: [-6.9196, 107.6310] },
  { id: "j13", label: "J13", name: "Halte BRT", order: 13, minutesFromStart: 42, coords: [-6.9198, 107.6338] },
  { id: "j14", label: "J14", name: "Stasiun KA", order: 14, minutesFromStart: 46, coords: [-6.9200, 107.6365] },
  { id: "j15", label: "J15", name: "Bandara Husein", order: 15, minutesFromStart: 50, coords: [-6.9202, 107.6392] },
  { id: "j16", label: "J16", name: "Terminal Akhir", order: 16, minutesFromStart: 55, coords: [-6.9204, 107.6420] },
  { id: "j17", label: "J17", name: "Pelabuhan", order: 17, minutesFromStart: 60, coords: [-6.9206, 107.6450] },
];

export const DESTINATIONS = [
  "Bandung",
  "Jakarta",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
];

export const MOCK_TRIPS: Trip[] = [
  { id: "t1", routeName: "Rayon A - Express", departureTime: "06:00", basePrice: 35000, totalSeats: 16, bookedSeats: [1, 4, 7, 12, 15], driverName: "Pak Ahmad", driverPhone: "+62812345678", vehiclePlate: "B 1234 XY" },
  { id: "t2", routeName: "Rayon B - Regular", departureTime: "07:30", basePrice: 28000, totalSeats: 16, bookedSeats: [2, 3, 5, 8, 9, 10, 11, 13], driverName: "Pak Budi", driverPhone: "+62898765432", vehiclePlate: "D 5678 AB" },
  { id: "t3", routeName: "Rayon A - Express", departureTime: "09:00", basePrice: 35000, totalSeats: 16, bookedSeats: [1, 6], driverName: "Pak Chandra", driverPhone: "+62856789012", vehiclePlate: "B 9012 CD" },
  { id: "t4", routeName: "Rayon C - Premium", departureTime: "10:30", basePrice: 50000, totalSeats: 12, bookedSeats: [1, 2, 3], driverName: "Pak Deni", driverPhone: "+62821234567", vehiclePlate: "D 3456 EF" },
  { id: "t5", routeName: "Rayon D - Economy", departureTime: "12:00", basePrice: 22000, totalSeats: 20, bookedSeats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], driverName: "Pak Eko", driverPhone: "+62834567890", vehiclePlate: "B 7890 GH" },
];

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(price);
}

export function getPickupTime(departureTime: string, pickup: PickupPoint): string {
  const [h, m] = departureTime.split(":").map(Number);
  const totalMin = h * 60 + m + pickup.minutesFromStart;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
