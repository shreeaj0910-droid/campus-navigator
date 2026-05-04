export interface Room {
  id: string;
  label: string;
  x: number; // 0–1000 coordinate
  y: number; // 0–1000 coordinate
  type: "classroom" | "lab" | "facility";
}

export interface Edge {
  from: string;
  to: string;
  weight: number; // approximate walking distance
}

export const rooms: Room[] = [
  // --- North Wing (top area) ---
  { id: "entrance", label: "Main Entrance", x: 500, y: 60, type: "facility" },
  { id: "lobby",    label: "Lobby",          x: 500, y: 130, type: "facility" },

  // --- West Wing ---
  { id: "r101", label: "Room 101", x: 150, y: 220, type: "classroom" },
  { id: "r102", label: "Room 102", x: 150, y: 370, type: "classroom" },
  { id: "r201", label: "Room 201", x: 150, y: 520, type: "classroom" },
  { id: "r202", label: "Room 202", x: 150, y: 670, type: "classroom" },

  // --- Center-West Corridor ---
  { id: "hw1", label: "Hall W1",  x: 310, y: 300, type: "facility" },
  { id: "hw2", label: "Hall W2",  x: 310, y: 520, type: "facility" },
  { id: "hw3", label: "Hall W3",  x: 310, y: 700, type: "facility" },

  // --- Central Hub ---
  { id: "junction", label: "Central Junction", x: 500, y: 500, type: "facility" },
  { id: "stairA",   label: "Stairwell A",      x: 420, y: 300, type: "facility" },
  { id: "stairB",   label: "Stairwell B",      x: 580, y: 700, type: "facility" },

  // --- Lab Block ---
  { id: "labA", label: "Lab A",      x: 500, y: 350, type: "lab" },
  { id: "labB", label: "Lab B",      x: 500, y: 650, type: "lab" },
  { id: "labC", label: "Computer Lab", x: 350, y: 500, type: "lab" },

  // --- East Wing ---
  { id: "r301", label: "Room 301", x: 840, y: 220, type: "classroom" },
  { id: "r302", label: "Room 302", x: 840, y: 370, type: "classroom" },
  { id: "r401", label: "Room 401", x: 840, y: 520, type: "classroom" },
  { id: "r402", label: "Room 402", x: 840, y: 670, type: "classroom" },

  // --- Center-East Corridor ---
  { id: "he1", label: "Hall E1",  x: 680, y: 300, type: "facility" },
  { id: "he2", label: "Hall E2",  x: 680, y: 500, type: "facility" },
  { id: "he3", label: "Hall E3",  x: 680, y: 700, type: "facility" },

  // --- Facilities ---
  { id: "library",  label: "Library",   x: 200, y: 850, type: "facility" },
  { id: "cafeteria",label: "Cafeteria", x: 500, y: 870, type: "facility" },
  { id: "office",   label: "Admin Office", x: 800, y: 870, type: "facility" },
  { id: "gym",      label: "Gymnasium",   x: 500, y: 950, type: "facility" },
];

export const edges: Edge[] = [
  // Entrance → Lobby
  { from: "entrance", to: "lobby", weight: 70 },

  // Lobby → Hub areas
  { from: "lobby", to: "stairA", weight: 170 },
  { from: "lobby", to: "he1",    weight: 220 },

  // West Wing connections
  { from: "stairA", to: "r101", weight: 270 },
  { from: "stairA", to: "hw1",  weight: 110 },
  { from: "hw1",    to: "r101", weight: 160 },
  { from: "hw1",    to: "r102", weight: 70 },
  { from: "hw1",    to: "labA", weight: 110 },
  { from: "r102",   to: "hw2",  weight: 150 },
  { from: "hw2",    to: "r201", weight: 160 },
  { from: "hw2",    to: "labC", weight: 190 },
  { from: "hw2",    to: "junction", weight: 190 },
  { from: "r201",   to: "hw3",  weight: 150 },
  { from: "hw3",    to: "r202", weight: 160 },
  { from: "hw3",    to: "junction", weight: 190 },

  // East Wing connections
  { from: "he1",    to: "r301", weight: 160 },
  { from: "he1",    to: "r302", weight: 70 },
  { from: "he1",    to: "labA", weight: 180 },
  { from: "he1",    to: "he2",  weight: 200 },
  { from: "r302",   to: "he2",  weight: 150 },
  { from: "he2",    to: "r401", weight: 160 },
  { from: "he2",    to: "junction", weight: 180 },
  { from: "r401",   to: "he3",  weight: 150 },
  { from: "he3",    to: "r402", weight: 160 },
  { from: "he3",    to: "stairB", weight: 100 },
  { from: "he3",    to: "junction", weight: 180 },

  // Center
  { from: "labA",      to: "junction", weight: 150 },
  { from: "junction",  to: "labB",     weight: 150 },
  { from: "junction",  to: "labC",     weight: 150 },
  { from: "labB",      to: "stairB",   weight: 80 },
  { from: "stairB",    to: "cafeteria",weight: 200 },

  // South facilities
  { from: "hw3",     to: "library",   weight: 200 },
  { from: "junction",to: "cafeteria", weight: 280 },
  { from: "he3",     to: "office",    weight: 200 },
  { from: "cafeteria",to: "gym",       weight: 80 },
  { from: "library", to: "cafeteria", weight: 300 },
  { from: "cafeteria",to: "office",   weight: 300 },
];
