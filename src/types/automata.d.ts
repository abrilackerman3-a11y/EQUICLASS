import { ElementDefinition } from 'cytoscape';

export interface AutomataState {
  elements: ElementDefinition[];
  nodeCount: number;
  
  // actions
  addNode: (position: { x: number; y: number }) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeElement: (id: string) => void;
  toggleFinalState: (id: string) => void;
  updateEdgeSymbol: (edgeId: string, newSymbol: "0" | "1") => void;
}
