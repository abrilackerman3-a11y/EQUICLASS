import { create } from "zustand";
import type { AutomataState } from "../types/automata";
import type { ElementDefinition } from "cytoscape";

const initialNode: ElementDefinition = {
  group: "nodes",
  data: { id: "q0", label: "q0", isInitial: true, isFinal: false },
  position: { x: 150, y: 150 },
  classes: "initial",
};

const initialSimulationState = {
  inputString: '',
  currentIndex: -1,
  activeNodeOriginal: null,
  activeNodeMinimized: null,
  activeEdgeOriginal: null,
  activeEdgeMinimized: null,
  status: 'IDLE' as const,
};

const calculateSinkInjection = (
  elements: ElementDefinition[],
): ElementDefinition[] => {
  const nodes = elements.filter((el) => el.group === "nodes");
  const edges = elements.filter((el) => el.group === "edges");
  const ALPHABET = ["0", "1"];

  const existingSink = nodes.find((n) => n.data.isSink);
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

export const useAutomataStore = create<AutomataState>((set, get) => ({
  elements: [initialNode],
  nodeCount: 1,

  minimizedElements: [],
  equivalenceClasses: [],

  simulation: initialSimulationState,

  prepareForMinimization: () => {
    const { pruneUnreachableNodes, injectSinkState } = get();
    pruneUnreachableNodes();
    injectSinkState();
  },

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
        return {};
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
        return {};
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
      if (id === "q0") return {};
      const filteredElements = state.elements.filter(
        (el) =>
          el.data.id !== id && el.data.source !== id && el.data.target !== id,
      );
      return {
        elements: filteredElements,
        nodeCount: filteredElements.filter((el) => el.group === "nodes").length,
      };
    }),

  clearAutomata: () =>
    set(() => ({
      elements: [initialNode],
      nodeCount: 1,
      minimizedElements: [],
      equivalenceClasses: [],
      simulation: initialSimulationState,
    })),

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

      if (!edgeToUpdate) return {};

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
        return {};
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

  setMinimizedData: (classes: string[][]) =>
    set((state) => {
      const originalNodes = state.elements.filter((el) => el.group === "nodes");
      const originalEdges = state.elements.filter((el) => el.group === "edges");

      const newMinimizedElements: ElementDefinition[] = [];
      const nodeToClassMap: Record<string, string> = {};

      const PALETTE = [
        { bg: "#e0e7ff", border: "#818cf8", text: "#4338ca" },
        { bg: "#fce7f3", border: "#f472b6", text: "#be185d" },
        { bg: "#fef3c7", border: "#fbbf24", text: "#b45309" },
        { bg: "#e0f2fe", border: "#38bdf8", text: "#0369a1" },
        { bg: "#ccfbf1", border: "#2dd4bf", text: "#0f766e" },
        { bg: "#f3e8ff", border: "#c084fc", text: "#7e22ce" },
      ];

      let classIndex = 0;

      classes.forEach((eqClass) => {
        const isOnlySink = eqClass.length === 1 && eqClass[0] === "q_sink";

        if (!isOnlySink) {
          const parentId = `eq-class-${classIndex}`;
          const color = PALETTE[classIndex % PALETTE.length];

          const hasInitial = eqClass.includes("q0");
          const hasFinal = originalNodes.some(
            (n) => eqClass.includes(n.data.id!) && n.data.isFinal,
          );

          let cyClasses = "equivalence-group";
          if (hasInitial) cyClasses += " initial-class";
          if (hasFinal) cyClasses += " final-class";

          newMinimizedElements.push({
            group: "nodes",
            data: {
              id: parentId,
              label: `Clase ${classIndex}`,
              bgColor: color.bg,
              borderColor: color.border,
              textColor: color.text,
            },
            classes: cyClasses,
          });

          eqClass.forEach((nodeId) => {
            nodeToClassMap[nodeId] = parentId;
            const node = originalNodes.find((n) => n.data.id === nodeId);
            if (node) {
              newMinimizedElements.push({
                ...node,
                data: { ...node.data, parent: parentId },
                position: node.position ? { ...node.position } : undefined,
              });
            }
          });

          classIndex++;
        } else {
          const sinkId = eqClass[0];
          nodeToClassMap[sinkId] = sinkId;
          const sinkNode = originalNodes.find((n) => n.data.id === sinkId);
          if (sinkNode) {
            newMinimizedElements.push({
              ...sinkNode,
              data: { ...sinkNode.data },
              position: sinkNode.position
                ? { ...sinkNode.position }
                : undefined,
            });
          }
        }
      });

      const createdEdges = new Set<string>();

      originalEdges.forEach((edge) => {
        const source = edge.data.source;
        const target = edge.data.target;
        const label = edge.data.label;

        if (source && target && label !== undefined) {
          const sourceClass = nodeToClassMap[source];
          const targetClass = nodeToClassMap[target];

          if (sourceClass && targetClass) {
            const edgeKey = `${sourceClass}-${targetClass}-${label}`;

            if (!createdEdges.has(edgeKey)) {
              createdEdges.add(edgeKey);
              newMinimizedElements.push({
                group: "edges",
                data: {
                  id: `e-${sourceClass}-${targetClass}-${label}`,
                  source: sourceClass,
                  target: targetClass,
                  label: label,
                },
              });
            }
          }
        }
      });

      return {
        equivalenceClasses: classes,
        minimizedElements: newMinimizedElements,
      };
    }),

  startSimulation: (input: string) => {
    const { elements, minimizedElements } = get();

    const initNodeOrig = elements.find(el => el.group === "nodes" && el.data.isInitial);
    
    // CORRECCIÓN AQUÍ: Buscar el nodo por clase o por id de grupo equivalente para evitar nulos
    const initNodeMin = minimizedElements.find(el => 
      el.group === "nodes" && 
      (el.classes?.includes("initial-class") || el.data.id === "eq-class-0")
    );

    if (!initNodeOrig) {
      console.error("No se encontró el estado inicial en el autómata original.");
      return;
    }

    set(() => ({
      simulation: {
        inputString: input,
        currentIndex: 0,
        activeNodeOriginal: initNodeOrig.data.id || null,
        activeNodeMinimized: initNodeMin ? (initNodeMin.data.id || null) : null,
        activeEdgeOriginal: null,
        activeEdgeMinimized: null,
        status: 'RUNNING',
      },
    }));
  },

  nextStep: () => {
    const { simulation, elements, minimizedElements } = get();
    const { inputString, currentIndex, activeNodeOriginal, activeNodeMinimized } = simulation;

    if (currentIndex >= inputString.length) {
      const currNodeOrig = elements.find(el => el.group === "nodes" && el.data.id === activeNodeOriginal);
      const isAccepted = currNodeOrig?.data?.isFinal || false;

      set((state) => ({
        simulation: {
          ...state.simulation,
          status: isAccepted ? 'ACCEPTED' : 'REJECTED',
          activeEdgeOriginal: null,
          activeEdgeMinimized: null,
        },
      }));
      return;
    }

    const symbol = inputString[currentIndex];

    const edgeOrig = elements.find(el => 
      el.group === "edges" && el.data.source === activeNodeOriginal && String(el.data.label) === symbol
    );
    
    // CORRECCIÓN AQUÍ: Validar transiciones buscando tanto de nodos hijos como de padres compuestos
    const edgeMin = minimizedElements.find(el => 
      el.group === "edges" && el.data.source === activeNodeMinimized && String(el.data.label) === symbol
    );

    set((state) => ({
      simulation: {
        ...state.simulation,
        currentIndex: currentIndex + 1,
        activeNodeOriginal: edgeOrig ? (edgeOrig.data.target || activeNodeOriginal) : activeNodeOriginal,
        activeNodeMinimized: edgeMin ? (edgeMin.data.target || activeNodeMinimized) : activeNodeMinimized,
        activeEdgeOriginal: edgeOrig ? (edgeOrig.data.id || null) : null,
        activeEdgeMinimized: edgeMin ? (edgeMin.data.id || null) : null,
      },
    }));
  },

  previousStep: () => {
    const { simulation, startSimulation, nextStep } = get();
    const targetIndex = simulation.currentIndex - 1;

    if (targetIndex < 0) {
      get().resetSimulation();
      return;
    }

    const targetString = simulation.inputString;
    
    startSimulation(targetString);
    for (let i = 0; i < targetIndex; i++) {
      nextStep();
    }
  },

  resetSimulation: () => {
    set(() => ({ simulation: initialSimulationState }));
  },
}));