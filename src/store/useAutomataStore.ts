import { create } from "zustand";
import type { AutomataState } from "../types/automata";
import type { ElementDefinition } from "cytoscape";

const initialNode: ElementDefinition = {
  group: "nodes",
  data: { id: "q0", label: "q0", isInitial: true, isFinal: false },
  position: { x: 150, y: 150 },
  classes: "initial",
};

const calculateSinkInjection = (
  elements: ElementDefinition[],
): ElementDefinition[] => {
  const nodes = elements.filter((el) => el.group === "nodes");
  const edges = elements.filter((el) => el.group === "edges");
  const ALPHABET = ["0", "1"];

  const existingSink = nodes.find((n) => n.data.isSink);
  // Eliminamos el `as string` y el `!`, dejamos que TS infiera
  let sinkId = existingSink ? existingSink.data.id : undefined;
  let needsSink = false;
  const newElements = [...elements];

  const outgoingTransitions: Record<string, Set<string>> = {};

  for (const n of nodes) {
    if (n.data.id) outgoingTransitions[n.data.id] = new Set();
  }

  for (const e of edges) {
    if (e.data.source && e.data.label !== undefined) {
      outgoingTransitions[e.data.source].add(String(e.data.label));
    }
  }

  for (const node of nodes) {
    const nodeId = node.data.id;
    if (!nodeId) continue;

    const transitions = outgoingTransitions[nodeId];

    for (const symbol of ALPHABET) {
      if (!transitions?.has(symbol)) {
        needsSink = true;
        if (!sinkId) sinkId = "q_sink";

        newElements.push({
          group: "edges",
          data: {
            id: `e-${nodeId}-${sinkId}-${symbol}-${Date.now()}`,
            source: nodeId,
            target: sinkId,
            label: symbol,
          },
        });
      }
    }
  }

  if (needsSink && sinkId && !nodes.some((n) => n.data.id === sinkId)) {
    let targetX = 150;
    let targetY = 300;

    if (nodes.length > 0) {
      let sumX = 0;
      let maxY = 0;
      let count = 0;

      for (const n of nodes) {
        if (n.position) {
          sumX += n.position.x;
          if (n.position.y > maxY) maxY = n.position.y;
          count++;
        }
      }

      if (count > 0) {
        targetX = sumX / count;
        targetY = maxY + 120;
      }
    }

    newElements.push({
      group: "nodes",
      data: {
        id: sinkId,
        label: "Pozo",
        isInitial: false,
        isFinal: false,
        isSink: true,
      },
      position: { x: targetX, y: targetY },
      classes: "sink-node",
    });

    for (const symbol of ALPHABET) {
      newElements.push({
        group: "edges",
        data: {
          id: `e-${sinkId}-${sinkId}-${symbol}-${Date.now()}`,
          source: sinkId,
          target: sinkId,
          label: symbol,
        },
      });
    }
  }
  return newElements;
};
export const useAutomataStore = create<AutomataState>((set) => ({
  elements: [initialNode],
  nodeCount: 1,

  addNode: (position) =>
    set((state) => {
      const usedNumbers = new Set(
        state.elements
          .filter((el) => el.group === "nodes" && el.data.id?.startsWith("q"))
          .map((el) => Number.parseInt((el.data.id || "").substring(1), 10))
          .filter((n) => !Number.isNaN(n)),
      );
      let nextNum = 1;
      while (usedNumbers.has(nextNum)) {
        nextNum++;
      }
      const newId = `q${nextNum}`;
      const newNode: ElementDefinition = {
        group: "nodes",
        data: { id: newId, label: newId, isInitial: false, isFinal: false },
        position,
      };

      const newElements = [...state.elements, newNode];

      return {
        elements: newElements,
        nodeCount: newElements.filter((el) => el.group === "nodes").length,
      };
    }),

  addEdge: (sourceId, targetId) =>
    set((state) => {
      const sourceExists = state.elements.some(
        (el) => el.group === "nodes" && el.data.id === sourceId,
      );
      const targetExists = state.elements.some(
        (el) => el.group === "nodes" && el.data.id === targetId,
      );

      if (!sourceExists || !targetExists) {
        return state;
      }

      const outgoingEdges = state.elements.filter(
        (el) => el.group === "edges" && el.data.source === sourceId,
      );

      const usedSymbols = new Set(
        outgoingEdges.map((el) => String(el.data.label)),
      );

      const ALPHABET = ["0", "1"] as const;
      const availableSymbols = ALPHABET.filter((sym) => !usedSymbols.has(sym));

      if (availableSymbols.length === 0) {
        console.warn(
          "El nodo ya tiene todas las transiciones posibles (0 y 1).",
        );
        return state;
      }

      const newEdge: ElementDefinition = {
        group: "edges",
        data: {
          id: `e-${sourceId}-${targetId}-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: availableSymbols[0],
        },
      };

      return { elements: [...state.elements, newEdge] };
    }),

  removeElement: (id) =>
    set((state) => {
      if (id === "q0") return state;
      const filteredElements = state.elements.filter(
        (el) =>
          el.data.id !== id && el.data.source !== id && el.data.target !== id,
      );
      return {
        elements: filteredElements,
        nodeCount: filteredElements.filter((el) => el.group === "nodes").length,
      };
    }),

  toggleFinalState: (id) =>
    set((state) => {
      const updatedElements = state.elements.map((el) => {
        if (el.group === "nodes" && el.data.id === id) {
          if (el.data.isSink) {
            console.warn(
              "El estado de pozo no puede ser un estado de aceptación.",
            );
            return el;
          }

          const isFinal = !el.data.isFinal;
          return {
            ...el,
            data: { ...el.data, isFinal },
            classes: `${el.data.isInitial ? "initial" : ""} ${
              isFinal ? "final" : ""
            }`.trim(),
          };
        }
        return el;
      });
      return { elements: updatedElements };
    }),

  updateEdgeSymbol: (edgeId, newSymbol) =>
    set((state) => {
      const edgeToUpdate = state.elements.find(
        (el) => el.group === "edges" && el.data.id === edgeId,
      );

      if (!edgeToUpdate) return state;

      const source = edgeToUpdate.data.source;

      const conflict = state.elements.some(
        (el) =>
          el.group === "edges" &&
          el.data.source === source &&
          el.data.label === newSymbol &&
          el.data.id !== edgeId,
      );

      if (conflict) {
        console.warn("Símbolo ya utilizado en otra transición de este nodo.");
        return state;
      }

      const updatedElements = state.elements.map((el) => {
        if (el.group === "edges" && el.data.id === edgeId) {
          return {
            ...el,
            data: { ...el.data, label: newSymbol },
          };
        }
        return el;
      });

      return { elements: updatedElements };
    }),

  pruneUnreachableNodes: () =>
    set((state) => {
      const edges = state.elements.filter((el) => el.group === "edges");

      const adjacencyList: Record<string, string[]> = {};
      for (const edge of edges) {
        const source = edge.data.source;
        const target = edge.data.target;
        if (source && target) {
          if (!adjacencyList[source]) adjacencyList[source] = [];
          adjacencyList[source].push(target);
        }
      }

      const reachable = new Set<string>();
      const queue = ["q0"];
      reachable.add("q0");

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const neighbors = adjacencyList[current] || [];
        for (const neighbor of neighbors) {
          if (!reachable.has(neighbor)) {
            reachable.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      const filteredElements = state.elements.filter((el) => {
        if (el.group === "nodes" && el.data.id)
          return reachable.has(el.data.id);
        if (el.group === "edges" && el.data.source && el.data.target) {
          return reachable.has(el.data.source) && reachable.has(el.data.target);
        }
        return false;
      });

      return {
        elements: filteredElements,
        nodeCount: filteredElements.filter((el) => el.group === "nodes").length,
      };
    }),

  injectSinkState: () =>
    set((state) => {
      const newElements = calculateSinkInjection(state.elements);
      return {
        elements: newElements,
        nodeCount: newElements.filter((el) => el.group === "nodes").length,
      };
    }),
}));
