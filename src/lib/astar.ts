/**
 * A* pathfinding for indoor navigation graphs.
 *
 * The nav-graph JSON format:
 *   nodes: { id, floor, x, y }[]   — pixel coords in the SVG floor plan
 *   edges: { from, to, weight }[]  — undirected edges (weight = estimated metres)
 */

export interface NavNode {
  id: string;
  floor: number;
  /** SVG/pixel x coordinate */
  x: number;
  /** SVG/pixel y coordinate */
  y: number;
  /** Optional human-readable label (e.g. "Entrance", "Stairs A") */
  label?: string;
}

export interface NavEdge {
  from: string;
  to: string;
  /**
   * Traversal cost in arbitrary units (metres or seconds).
   * If omitted it defaults to the Euclidean distance between node pixel coords.
   */
  weight?: number;
}

export interface NavGraph {
  nodes: NavNode[];
  edges: NavEdge[];
}

export interface PathResult {
  /** Ordered node IDs from source to target */
  path: string[];
  /** Total accumulated cost */
  cost: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function euclidean(a: NavNode, b: NavNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Build an adjacency map from the edge list.
 * Edges are treated as undirected — both directions are added.
 */
function buildAdjacency(
  nodes: NavNode[],
  edges: NavEdge[]
): Map<string, { neighborId: string; cost: number }[]> {
  const nodeById = new Map<string, NavNode>(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, { neighborId: string; cost: number }[]>();

  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    const a = nodeById.get(edge.from);
    const b = nodeById.get(edge.to);
    if (!a || !b) continue;

    const cost = edge.weight ?? euclidean(a, b);

    adj.get(edge.from)!.push({ neighborId: edge.to, cost });
    adj.get(edge.to)!.push({ neighborId: edge.from, cost });
  }

  return adj;
}

// ---------------------------------------------------------------------------
// A* implementation
// ---------------------------------------------------------------------------

/**
 * Find the shortest path between two node IDs using A*.
 *
 * @param graph  The loaded nav-graph data.
 * @param fromId Source node ID.
 * @param toId   Target node ID.
 * @returns      `PathResult` on success, or `null` if no path exists.
 */
export function astar(
  graph: NavGraph,
  fromId: string,
  toId: string
): PathResult | null {
  const nodeById = new Map<string, NavNode>(graph.nodes.map((n) => [n.id, n]));
  const adj = buildAdjacency(graph.nodes, graph.edges);

  const start = nodeById.get(fromId);
  const goal = nodeById.get(toId);

  if (!start || !goal) return null;
  if (fromId === toId) return { path: [fromId], cost: 0 };

  // g: best known cost from start
  const g = new Map<string, number>();
  // f = g + h
  const f = new Map<string, number>();
  // came-from for path reconstruction
  const cameFrom = new Map<string, string>();

  const heuristic = (nodeId: string): number => {
    const n = nodeById.get(nodeId);
    if (!n) return 0;
    // Cross-floor penalty: 50 units per floor difference
    const floorPenalty = Math.abs(n.floor - goal.floor) * 50;
    return euclidean(n, goal) + floorPenalty;
  };

  // Open set implemented as a sorted array (small graphs → fine)
  const openSet = new Set<string>([fromId]);

  g.set(fromId, 0);
  f.set(fromId, heuristic(fromId));

  while (openSet.size > 0) {
    // Pop the node in openSet with lowest f
    let current = "";
    let lowestF = Infinity;
    for (const id of openSet) {
      const fVal = f.get(id) ?? Infinity;
      if (fVal < lowestF) {
        lowestF = fVal;
        current = id;
      }
    }

    if (current === toId) {
      // Reconstruct path
      const path: string[] = [];
      let cur: string | undefined = toId;
      while (cur !== undefined) {
        path.unshift(cur);
        cur = cameFrom.get(cur);
      }
      return { path, cost: g.get(toId) ?? 0 };
    }

    openSet.delete(current);

    for (const { neighborId, cost } of adj.get(current) ?? []) {
      const tentativeG = (g.get(current) ?? Infinity) + cost;
      if (tentativeG < (g.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current);
        g.set(neighborId, tentativeG);
        f.set(neighborId, tentativeG + heuristic(neighborId));
        openSet.add(neighborId);
      }
    }
  }

  return null; // No path found
}

/**
 * Convenience: resolve a path result to the full NavNode objects.
 */
export function pathToNodes(graph: NavGraph, result: PathResult): NavNode[] {
  const nodeById = new Map<string, NavNode>(graph.nodes.map((n) => [n.id, n]));
  return result.path.map((id) => nodeById.get(id)!).filter(Boolean);
}
