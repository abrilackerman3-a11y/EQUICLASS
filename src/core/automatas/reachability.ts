import type{ GraphElement, NodeData, EdgeData } from '../../types/automata';

export const getReachableNodes = (
  nodes: GraphElement<NodeData>[],
  edges: GraphElement<EdgeData>[],
  initialNodeId: string
): Set<string> => {
  const reachable = new Set<string>();
  const queue: string[] = [initialNodeId];
  reachable.add(initialNodeId);

  const adjacencyList: Record<string, string[]> = {};
  
  nodes.forEach(node => {
    adjacencyList[node.data.id] = [];
  });

  edges.forEach(edge => {
    if (adjacencyList[edge.data.source]) {
      adjacencyList[edge.data.source].push(edge.data.target);
    }
  });

  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode === undefined) continue;
    const neighbors = adjacencyList[currentNode] || [];

    neighbors.forEach(neighbor => {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  return reachable;
};
