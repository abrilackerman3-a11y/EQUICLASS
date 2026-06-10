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
  nodeCount: 1, // Se mantiene por compatibilidad con la interfaz

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
        // Actualiza el contador real de nodos por si acaso
        nodeCount: newElements.filter(el => el.group === "nodes").length 
      };
    }),

  addEdge: (sourceId, targetId) =>
    set((state) => {
      // 1. Obtener solo las aristas salientes del nodo origen
      const outgoingEdges = state.elements.filter(
        (el) => el.group === "edges" && el.data.source === sourceId
      );

      // 2. Ver qué símbolos ya se están usando en este nodo
      const usedSymbols = outgoingEdges.map((el) => el.data.label);

      // 3. Validar determinismo: Alfabeto {0, 1} usando 'as const' para tipado estricto
      const ALPHABET = ["0", "1"] as const;
      const availableSymbols = ALPHABET.filter(
        (sym) => !usedSymbols.includes(sym)
      );

      // 4. Si ya no hay símbolos disponibles, bloqueamos la creación
      if (availableSymbols.length === 0) {
        console.warn("El nodo ya tiene todas las transiciones posibles (0 y 1).");
        return state; 
      }

      // 5. Crear la nueva arista con el primer símbolo disponible
      const newEdge: ElementDefinition = {
        group: "edges",
        data: {
          id: `e-${sourceId}-${targetId}-${Date.now()}`,
          source: sourceId,
          target: targetId,
          label: availableSymbols[0], // TypeScript ahora sabe que es exactamente '0' o '1'
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
        nodeCount: filteredElements.filter(el => el.group === "nodes").length
      };
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

  updateEdgeSymbol: (edgeId, newSymbol) =>
    set((state) => {
      const edgeToUpdate = state.elements.find(
        (el) => el.group === "edges" && el.data.id === edgeId
      );
      
      if (!edgeToUpdate) return state;

      const source = edgeToUpdate.data.source;

      // Verificar que el nuevo símbolo no choque con otra arista del MISMO nodo
      const conflict = state.elements.some(
        (el) =>
          el.group === "edges" &&
          el.data.source === source &&
          el.data.label === newSymbol &&
          el.data.id !== edgeId
      );

      if (conflict) {
        console.warn("Símbolo ya utilizado en otra transición de este nodo.");
        return state;
      }

      // Aplicar el cambio si no hay conflictos
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
}));