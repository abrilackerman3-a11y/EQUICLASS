import React, { useRef, useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import type { Core, EventObject, StylesheetStyle } from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import { useAutomataStore } from "../../store/useAutomataStore";
import { minimizeDFA } from "../../core/automatas/MyhillNerode";

import IconState from "../../assets/state.svg?react";
import IconConnect from "../../assets/connect.svg?react";
import IconClear from "../../assets/clear.svg?react";
import IconHelp from "../../assets/help.svg?react";

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
      "background-color": "#f5c2e7",
      label: "data(label)",
      color: "#11111b",
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
      "background-color": "#89dceb",
      "border-width": 3,
      "border-color": "#74c7ec",
    },
  },
  {
    selector: "node.final",
    style: {
      "border-style": "double",
      "border-width": 4,
      "border-color": "#cba6f7",
    },
  },
  {
    selector: "edge[label]",
    style: {
      width: 2,
      "line-color": "#b4befe",
      "target-arrow-color": "#b4befe",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)",
      "font-size": "14px",
      "text-background-opacity": 1,
      "text-background-color": "#1e1e2e",
      color: "#cdd6f4 ",
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
      "background-color": "#f5c2e7",
      width: 24,
      height: 24,
      shape: "ellipse",
    },
  },
  {
    selector: ".eh-preview, .eh-ghost-edge",
    style: {
      "line-color": "#f5c2e7",
      "target-arrow-color": "#f5c2e7",
      "source-arrow-color": "#f5c2e7",
    },
  },
  {
    selector: "node.sink-node",
    style: {
      "background-color": "#181825",
      "border-width": 2,
      "border-color": "#6c7086",
      "border-style": "dashed",
      color: "#bac2de",
    },
  },

  {
    selector: "node.active",
    style: {
      "background-color": "#f9e2af",
      "border-color": "#fab387",
      "border-width": "4px",
    },
  },
  {
    selector: "edge.active",
    style: {
      width: "4px",
      "line-color": "#f9e2af",
      "target-arrow-color": "#fab387",
      color: "#fab387",
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

  // Traer los estados de simulación del store para la reactividad
  const activeNodeOriginal = useAutomataStore(
    (state) => state.simulation.activeNodeOriginal,
  );
  const activeEdgeOriginal = useAutomataStore(
    (state) => state.simulation.activeEdgeOriginal,
  );

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
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.elements().removeClass("active");
    if (activeNodeOriginal)
      cyRef.current.$(`#${activeNodeOriginal}`).addClass("active");
    if (activeEdgeOriginal)
      cyRef.current.$(`#${activeEdgeOriginal}`).addClass("active");
  }, [activeNodeOriginal, activeEdgeOriginal]);

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
    <div className="w-full h-full touch-none relative bg-[#1e1e2e] overflow-hidden">
      <CytoscapeComponent
        elements={elements}
        stylesheet={cytoscapeStylesheet}
        style={{ width: "100%", height: "100%" }}
        cy={handleCyInit}
        layout={{ name: "preset", fit: true, padding: 30 }}
        userZoomingEnabled={true}
        userPanningEnabled={true}
        boxSelectionEnabled={false}
        minZoom={0.3}
        maxZoom={1.2}
      />

      <div
        className={`absolute top-4 right-4 z-20 flex flex-col items-end gap-3 transition-all duration-700 ease-in-out origin-top-right 
          ${
            isMinimized
              ? "scale-75 opacity-80 hover:opacity-100"
              : "scale-100 opacity-100"
          }`}
      >
        <button
          onClick={handleMinimizationTrigger}
          className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#11111b] px-5 py-2.5 rounded-xl shadow-[0_0_5px_rgba(203,166,247,0.4)] font-bold transition-all transform hover:scale-105 active:scale-95 text-sm"
        >
          Minimizar
        </button>

        <button
          onClick={clearAutomata}
          title="Limpiar grafo"
          className="w-11 h-11 bg-[#181825] hover:bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/30 rounded-full shadow-md flex items-center justify-center font-bold text-lg transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <IconClear className="w-6 h-6" />
        </button>
      </div>

      <div
        className={`absolute top-4 left-4 z-40 transition-all duration-700 ease-in-out origin-top-left ${
          isMinimized
            ? "scale-75 opacity-80 hover:opacity-100"
            : "scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-10 h-10 bg-[#181825] hover:bg-[#313244] rounded-full shadow-md border border-[#b4befe]/30 flex items-center justify-center text-[#b4befe] font-bold text-lg transition-all focus:outline-none active:scale-95"
        >
          <IconHelp className="w-6 h-6" />
        </button>

        {showHelp && (
          <div className="mt-2 bg-[#181825]/95 backdrop-blur p-4 rounded-xl shadow-lg border border-[#cba6f7]/30 w-64 animate-fade-in">
            <h1 className="text-sm font-bold text-[#cba6f7] border-b border-[#313244] pb-2 mb-2">
              Controles Táctiles
            </h1>
            <ul className="text-sm text-[#bac2de] space-y-2">
              <li>
                <span className="text-[#89dceb] font-bold">•</span>{" "}
                <b>Toque:</b> Nuevo Estado
              </li>
              <li>
                <span className="text-[#89dceb] font-bold">•</span>{" "}
                <b>Modo Estados:</b> <br /> Arrastra para mover <br />
                Doble toque para alternar Final
              </li>
              <li>
                <span className="text-[#89dceb] font-bold">•</span>{" "}
                <b>Modo Conectar:</b> Arrastra entre nodos
              </li>
              <li>
                <span className="text-[#89dceb] font-bold">•</span>{" "}
                <b>Toque largo:</b> Eliminar elemento
              </li>
              <li>
                <span className="text-[#89dceb] font-bold">•</span>{" "}
                <b>Toque en Arista:</b> Cambiar símbolo (0/1)
              </li>
            </ul>
          </div>
        )}
      </div>

      <div
        className={`absolute left-1/2 -translate-x-1/2 bg-[#181825]/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-[#cba6f7]/30 flex gap-1 z-20 transition-all duration-700 ease-in-out origin-bottom ${
          isMinimized
            ? "bottom-2 scale-75 opacity-60 hover:opacity-100"
            : "bottom-8 scale-100 opacity-100"
        }`}
      >
        <button
          onClick={() => setIsDrawMode(false)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            isDrawMode
              ? "text-[#bac2de] hover:bg-[#313244]"
              : "bg-[#f5c2e7] text-[#11111b] shadow-[0_0_10px_rgba(245,194,231,0.5)] scale-105"
          }`}
        >
          <IconState className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsDrawMode(true)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            isDrawMode
              ? "bg-[#f5c2e7] text-[#11111b] shadow-[0_0_10px_rgba(245,194,231,0.5)] scale-105"
              : "text-[#bac2de] hover:bg-[#313244]"
          }`}
        >
          <IconConnect className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
