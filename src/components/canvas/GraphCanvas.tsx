import React, { useRef, useState, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import type { Core, EventObject, StylesheetStyle } from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import { useAutomataStore } from "../../store/useAutomataStore";
import { EdgeContextMenu } from "./EdgeMenu";

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
      "border-width": 4,
      "border-color": "#4552ff",
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
    selector: "edge[source = target]",
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
];

export const GraphCanvas: React.FC = () => {
  const { elements, addNode, addEdge, removeElement, toggleFinalState } =
    useAutomataStore();

  const cyRef = useRef<Core | null>(null);
  const ehRef = useRef<EdgeHandlesInstance | null>(null);
  const lastNodeTap = useRef<number>(0);

  const [isDrawMode, setIsDrawMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isDrawModeRef = useRef(false);

  const [menuState, setMenuState] = useState<{
    edgeId: string;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    isDrawModeRef.current = isDrawMode;
    if (cyRef.current) {
      cyRef.current.autoungrabify(isDrawMode);
    }
  }, [isDrawMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key.toLowerCase() === "m" || e.key === "Escape")
        setIsDrawMode(false);
      else if (e.key.toLowerCase() === "t") setIsDrawMode(true);
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      if (isDrawModeRef.current) return;

      const edge = evt.target;
      const renderedPos = edge.renderedMidpoint();
      const containerRect = cy.container()?.getBoundingClientRect();
      if (!containerRect) return;

      setMenuState({
        edgeId: edge.id(),
        position: {
          x: containerRect.left + renderedPos.x,
          y: containerRect.top + renderedPos.y - 10,
        },
      });
    });

    cy.on("cxttap taphold", "node, edge", (evt: EventObject) => {
      removeElement(evt.target.id());
    });
  };

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
      />

      <div className="absolute top-4 left-4 z-20">
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
            </ul>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-slate-200 flex gap-1 z-20">
        <button
          onClick={() => setIsDrawMode(false)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            !isDrawMode
              ? "bg-blue-500 text-white shadow-md scale-105"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Estados
        </button>
        <button
          onClick={() => setIsDrawMode(true)}
          className={`px-6 py-3 text-sm font-bold rounded-full transition-all flex items-center gap-2 ${
            isDrawMode
              ? "bg-green-500 text-white shadow-md scale-105"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          Transiciones
        </button>
      </div>

      {menuState && (
        <EdgeContextMenu
          edgeId={menuState.edgeId}
          position={menuState.position}
          onClose={() => setMenuState(null)}
        />
      )}
    </div>
  );
};