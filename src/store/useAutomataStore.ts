import { create } from "zustand";
import type { AutomataState } from "../types/automata";
import type { ElementDefinition } from "cytoscape";

const initialNode: ElementDefinition = {
  group: "nodes",
  data: { id: "q0", label: "q0", isInitial: true, isFinal: false },
  position: { x: 150, y: 150 },
  classes: "initial",
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

      return { elements: [...state.elements, newNode] };
    }),

  addEdge: (sourceId, targetId) =>
    set((state) => {
      // Evitar aristas duplicadas temporalmente (se mejorará en la Fase 2)
      const edgeExists = state.elements.some(
        (el) =>
          el.group === "edges" &&
          el.data.source === sourceId &&
          el.data.target === targetId,
      );
      if (edgeExists) return state;

      const newEdge: ElementDefinition = {
        group: "edges",
        data: {
          id: `e-${sourceId}-${targetId}-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: "?",
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
      return { elements: filteredElements };
    }),

  toggleFinalState: (id) =>
    set((state) => {
      const updatedElements = state.elements.map((el) => {
        if (el.group === "nodes" && el.data.id === id) {
          const isFinal = !el.data.isFinal;
          return {
            ...el,
            data: { ...el.data, isFinal },
            classes:
              `${el.data.isInitial ? "initial" : ""} ${isFinal ? "final" : ""}`.trim(),
          };
        }
        return el;
      });
      return { elements: updatedElements };
    }),
}));
