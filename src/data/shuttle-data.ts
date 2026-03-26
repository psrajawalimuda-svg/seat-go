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

export const DESTINATIONS = [
  "Bandung",
  "Jakarta",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
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
