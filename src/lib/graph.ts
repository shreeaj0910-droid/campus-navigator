import { rooms, edges, Room } from "./campusData";

interface NodeRecord {
  g: number;     // cost from start
  h: number;     // heuristic (euclidean distance to goal)
  f: number;     // g + h
  parent: string | null;
}

function heuristic(a: Room, b: Room): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function aStar(startId: string, goalId: string): string[] | null {
  const roomMap = new Map<string, Room>(rooms.map((r) => [r.id, r]));

  // Build adjacency list (bidirectional)
  const adj = new Map<string, { neighbor: string; weight: number }[]>();
  for (const room of rooms) {
    adj.set(room.id, []);
  }
  for (const edge of edges) {
    adj.get(edge.from)?.push({ neighbor: edge.to,   weight: edge.weight });
    adj.get(edge.to)?.push({   neighbor: edge.from, weight: edge.weight });
  }

  const startRoom = roomMap.get(startId);
  const goalRoom  = roomMap.get(goalId);
  if (!startRoom || !goalRoom) return null;

  const open = new Set<string>([startId]);
  const closed = new Set<string>();
  const record = new Map<string, NodeRecord>();

  record.set(startId, {
    g: 0,
    h: heuristic(startRoom, goalRoom),
    f: heuristic(startRoom, goalRoom),
    parent: null,
  });

  while (open.size > 0) {
    // Get node with lowest f in open set
    let current: string | null = null;
    let bestF = Infinity;
    for (const id of open) {
      const rec = record.get(id)!;
      if (rec.f < bestF) {
        bestF = rec.f;
        current = id;
      }
    }

    if (!current) break;
    if (current === goalId) {
      // Reconstruct path
      const path: string[] = [];
      let node: string | null = current;
      while (node !== null) {
        path.unshift(node);
        node = record.get(node)?.parent ?? null;
      }
      return path;
    }

    open.delete(current);
    closed.add(current);

    const currentRoom = roomMap.get(current)!;
    const currentG = record.get(current)!.g;

    for (const { neighbor, weight } of adj.get(current) ?? []) {
      if (closed.has(neighbor)) continue;
      const neighborRoom = roomMap.get(neighbor)!;
      const tentativeG = currentG + weight;

      const existing = record.get(neighbor);
      if (!existing || tentativeG < existing.g) {
        const h = heuristic(neighborRoom, goalRoom);
        record.set(neighbor, {
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        });
        open.add(neighbor);
      }
    }
  }

  return null; // No path found
}
