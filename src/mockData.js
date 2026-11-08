// fallback when the backend is down, same shapes as the API

const pad = (n) => String(n).padStart(2, "0");
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const rooms = [
  { id: 1, name: "H102", building: "Main Building", floor: 1, capacity: 80, equipment: ["Projector", "Whiteboard"], description: "Standard classroom." },
  { id: 2, name: "F303", building: "Main Building", floor: 3, capacity: 30, equipment: ["Projector", "Whiteboard"], description: "Small classroom." },
  { id: 3, name: "F204", building: "Main Building", floor: 2, capacity: 30, equipment: ["Projector", "Whiteboard"], description: "Small classroom." },
  { id: 4, name: "G304", building: "Main Building", floor: 3, capacity: 100, equipment: ["Projector", "Whiteboard"], description: "Large classroom." },
  { id: 5, name: "G108", building: "Main Building", floor: 1, capacity: 24, equipment: ["Computers", "Projector", "Whiteboard"], description: "Computer classroom." },
];

const TIMES = [
  ["09:30", "10:20"],
  ["10:30", "11:20"],
  ["11:30", "12:20"],
  ["12:30", "13:20"],
];

export const slots = (roomId) =>
  TIMES.map(([s, e], i) => ({
    id: `${roomId}-${i + 1}`,
    start: `${today()}T${s}`,
    end: `${today()}T${e}`,
    available: true,
  }));

export const bookings = () => [
  { id: 1, roomId: 2, roomName: "F303", start: `${today()}T09:30`, end: `${today()}T10:20`, status: "confirmed" },
  { id: 2, roomId: 3, roomName: "F204", start: `${today()}T10:30`, end: `${today()}T11:20`, status: "pending" },
];
