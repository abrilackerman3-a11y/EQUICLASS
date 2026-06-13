import React, { useRef, useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import type { Core, EventObject, StylesheetStyle } from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import { useAutomataStore } from "../../store/useAutomataStore";
import { minimizeDFA } from "../../core/automatas/myhillNerode";

cytoscape.use(edgehandles);

interface EdgeHandlesInstance {
  destroy: () => void;
  start: (node: unknown) => void;
}

interface EHOptions {
  snap: boolean;
  loopAllowed: () => boolean;
}

type CyCustom = Core & {
  edgehandles: (options: EHOptions) => EdgeHandlesInstance;
};

const cytoscapeStylesheet: StylesheetStyle[] = [
  {
    selector: "node[label]",
    style: {
      "overlay-opacity": 0,
      "overlay-padding": 0,
      "active-bg-opacity": 0,
      "active-bg-size": 0,
      "background-color": "#3b82f6",
      label: "data(label)",
      color: "#ffffff",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": "14px",
      width: "45px",
      height: "45px",
    },
  },
  {
    selector: "node.initial",
    style: {
      "background-color": "#10b981",
      "border-width": 3,
      "border-color": "#047857",
    },
  },
  {
    selector: "node.final",
    style: {
      "border-style": "double",
      "border-width": 4,
      "border-color": "#303030",
    },
  },
  {
    selector: "edge[label]",
    style: {
      width: 2,
      "line-color": "#9ca3af",
      "target-arrow-color": "#9ca3af",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": "14px",
      "text-background-opacity": 1,
      "text-background-color": "#ffffff",
      "text-background-padding": "2px",
    },
  },
  {
    selector: "edge:loop",
    style: {
      "curve-style": "bezier",
      "control-point-step-size": 32,
      "loop-direction": "90deg",
      "loop-sweep": "45deg",
    },
  },
  {
    selector: ".eh-handle",
    style: {
      "background-color": "#ef4444",
      width: 24,
      height: 24,
      shape: "ellipse",
    },
  },
  {
    selector: ".eh-preview, .eh-ghost-edge",
    style: {
      "line-color": "#ef4444",
      "target-arrow-color": "#ef4444",
      "source-arrow-color": "#ef4444",
    },
  },
  {
    selector: "node.sink-node",
    style: {
      "background-color": "#f3f4f6",
      "border-width": 2,
      "border-color": "#9ca3af",
      "border-style": "dashed",
      color: "#4b5563",
    },
  },
];

export const GraphCanvas: React.FC = () => {
  const {
    elements,
    addNode,
    addEdge,
    removeElement,
    toggleFinalState,
    updateEdgeSymbol,
    clearAutomata,
    prepareForMinimization,
    setMinimizedData,
    minimizedElements,
  } = useAutomataStore();

  const isMinimized = minimizedElements.length > 0;

  const handleMinimizationTrigger = () => {
    prepareForMinimization();

    const latestElements = useAutomataStore.getState().elements;

    const equivalenceClasses = minimizeDFA(latestElements);

    setMinimizedData(equivalenceClasses);
  };

  const cyRef = useRef<Core | null>(null);
  const ehRef = useRef<EdgeHandlesInstance | null>(null);
  const lastNodeTap = useRef<number>(0);

  const [isDrawMode, setIsDrawMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isDrawModeRef = useRef(false);

  useEffect(() => {
    isDrawModeRef.current = isDrawMode;
    if (cyRef.current) {
      cyRef.current.autoungrabify(isDrawMode);
    }
  }, [isDrawMode]);

  const handleCyInit = (cy: Core) => {
    if (cyRef.current === cy) return;
    cyRef.current = cy;
    cy.removeAllListeners();

    if (ehRef.current) ehRef.current.destroy();

    const cyCustom = cy as CyCustom;
    const eh = cyCustom.edgehandles({
      snap: true,
      loopAllowed: () => true,
    });

    ehRef.current = eh;
    cy.autoungrabify(isDrawModeRef.current);

    cy.on("tapstart", "node", (evt: EventObject) => {
      if (isDrawModeRef.current && ehRef.current) {
        ehRef.current.start(evt.target);
      }
    });

    cy.on("tap", "node", (evt: EventObject) => {
      if (isDrawModeRef.current) {
        addEdge(evt.target.id(), evt.target.id());
        return;
      }
      const now = Date.now();
      if (now - lastNodeTap.current < 300) {
        toggleFinalState(evt.target.id());
      }
      lastNodeTap.current = now;
    });

    cy.on("ehcomplete", (_event, sourceNode, targetNode, addedEdge) => {
      if (addedEdge) addedEdge.remove();
      setTimeout(() => {
        addEdge(sourceNode.id(), targetNode.id());
      }, 0);
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        addNode(evt.position);
      }
    });

    cy.on("tap", "edge", (evt: EventObject) => {
      const edge = evt.target;
      const edgeId = edge.id();
      const currentSymbol = edge.data("label");

      const newSymbol = currentSymbol === "0" ? "1" : "0";
      updateEdgeSymbol(edgeId, newSymbol);
    });

    cy.on("cxttap taphold", "node, edge", (evt: EventObject) => {
      removeElement(evt.target.id());
    });
  };

  useEffect(() => {
    const container = cyRef.current?.container();
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Solo ajusta el WebGL al contenedor, NO mueve la cámara
      cyRef.current?.resize();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (cyRef.current && isMinimized) {
      setTimeout(() => {
        if (cyRef.current && cyRef.current.elements().length > 0) {
          cyRef.current.animate(
            {
              fit: { eles: cyRef.current.elements(), padding: 60 },
            },
            { duration: 400, easing: "ease-out" },
          );
        }
      }, 700);
    }
  }, [isMinimized]);

  return (
    <div className="w-full h-full touch-none relative bg-slate-50 overflow-hidden">
      <CytoscapeComponent
        elements={elements}
        stylesheet={cytoscapeStylesheet}
        style={{ width: "100%", height: "100%" }}
        cy={handleCyInit}
        userZoomingEnabled={true}
        userPanningEnabled={true}
        boxSelectionEnabled={false}
        minZoom={0.3}
        maxZoom={1.2}
      />

      <div
        className={`absolute top-4 right-4 z-20 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out origin-top-right ${
          isMinimized
            ? "scale-75 opacity-80 hover:opacity-100"
            : "scale-100 opacity-100"
        }`}
      >
        <button
          onClick={handleMinimizationTrigger}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg font-bold transition-all transform hover:scale-105 active:scale-95 text-sm"
        >
          Minimizar
        </button>

        <button
          onClick={clearAutomata}
          title="Limpiar grafo"
          className="w-11 h-11 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full shadow-md flex items-center justify-center font-bold text-lg transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          L
        </button>
      </div>

      <div
        className={`absolute top-4 left-4 z-20 transition-all duration-700 ease-in-out origin-top-left ${
          isMinimized
            ? "scale-75 opacity-80 hover:opacity-100"
            : "scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-10 h-10 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          ?
        </button>

        {showHelp && (
          <div className="mt-2 bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 w-64 animate-fade-in">
            <h1 className="text-sm font-bold text-slate-800 border-b pb-2 mb-2">
              Controles Táctiles
            </h1>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>
                <span className="text-blue-500 font-bold">•</span>{" "}
                <b>Toque vacío:</b> Nuevo estado
              </li>
              <li>
                <span className="text-blue-500 font-bold">•</span>{" "}
                <b>Modo Conectar:</b> Arrastra entre nodos
              </li>
              <li>
                <span className="text-blue-500 font-bold">•</span>{" "}
                <b>Doble toque:</b> Alternar Final
              </li>
              <li>
                <span className="text-blue-500 font-bold">•</span>{" "}
                <b>Toque largo:</b> Eliminar elemento
              </li>
              <li>
                <span className="text-blue-500 font-bold">•</span>{" "}
                <b>Toque en arista:</b> Cambiar símbolo (0/1)
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className={`absolute left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-slate-200 flex gap-1 z-20 transition-all duration-700 ease-in-out origin-bottom ${
          isMinimized
            ? "bottom-2 scale-75 opacity-60 hover:opacity-100"
            : "bottom-8 scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setIsDrawMode(false)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            isDrawMode
              ? "text-slate-500 hover:bg-slate-100"
              : "bg-blue-500 text-white shadow-md scale-105"
          }`}
        >
          E
        </button>
        <button
          onClick={() => setIsDrawMode(true)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            isDrawMode
              ? "bg-green-500 text-white shadow-md scale-105"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          T
        </button>
      </div>
    </div>
  );
};
