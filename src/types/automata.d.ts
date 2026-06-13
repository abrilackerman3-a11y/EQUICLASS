import { ElementDefinition } from "cytoscape";
declare module "cytoscape-fcose";

export interface NodeData {
  id: string;
  label: string;
  isInitial?: boolean;
  isFinal?: boolean;
  isSink?: boolean;
  parent?: string;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  label: "0" | "1";
}

export interface GraphElement<T> {
  data: T;
  group?: "nodes" | "edges";
}

export interface AutomataState {
  elements: ElementDefinition[];
  nodeCount: number;

  minimizedElements: ElementDefinition[];
  equivalenceClasses: string[][];

  addNode: (position: { x: number; y: number }) => void;
  addEdge: (sourceId: string, targetId: string) => void;
  removeElement: (id: string) => void;
  toggleFinalState: (id: string) => void;
  updateEdgeSymbol: (edgeId: string, newSymbol: "0" | "1") => void;
  clearAutomata: () => void;

  pruneUnreachableNodes: () => void;
  injectSinkState: () => void;
  prepareForMinimization: () => void;
  setMinimizedData: (classes: string[][]) => void;
}
