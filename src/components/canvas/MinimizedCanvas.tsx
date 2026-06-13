import React, { useRef, useEffect } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core, StylesheetStyle } from "cytoscape";
import { useAutomataStore } from "../../store/useAutomataStore";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

const minimizedStylesheet: StylesheetStyle[] = [
  {
    selector: "node[label]",
    style: {
      "overlay-opacity": 0,
      "background-color": "#4f46e5",
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
    selector: "node.sink-node",
    style: {
      "background-color": "#f3f4f6",
      "border-width": 2,
      "border-color": "#9ca3af",
      "border-style": "dashed",
      color: "#4b5563",
    },
  },
  {
    selector: "node.equivalence-group",
    style: {
      "background-color": "data(bgColor)", // Lee el color desde el store
      "background-opacity": 0.4,
      "border-width": 2,
      "border-color": "data(borderColor)",
      "border-style": "dashed",
      label: "data(label)",
      "text-valign": "top",
      "text-halign": "center",
      "font-size": "14px",
      "font-weight": "bold",
      color: "data(textColor)",
      padding: "14px",
    },
  },
  {
    selector: "node.initial-class",
    style: {
      "border-width": 4,
      "border-color": "#10b981",
      "border-style": "dashed",
    },
  },
  {
    selector: "node.final-class",
    style: {
      "border-style": "double",
      "border-width": 6,
    },
  },
  {
    selector: "node.initial-class.final-class",
    style: {
      "border-color": "#10b981",
      "border-style": "double",
      "border-width": 6,
    },
  },
  {
    selector: "edge[label]",
    style: {
      width: 2,
      "line-color": "#818cf8",
      "target-arrow-color": "#818cf8",
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
];

export const MinimizedCanvas: React.FC = () => {
  const { minimizedElements } = useAutomataStore();
  const cyRef = useRef<Core | null>(null);

  const handleCyInit = (cy: Core) => {
    if (cyRef.current === cy) return;
    cyRef.current = cy;
    cy.boxSelectionEnabled(false);
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
    if (cyRef.current && minimizedElements.length > 0) {
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.resize();

          const fcoseOptions = {
            name: "fcose",
            animate: true,
            animationDuration: 700,
            animationEasing: "ease-out",
            fit: true,
            padding: 50,
            randomize: true,
            packComponents: true,
            nodeSeparation: 60,
            nestingFactor: 0.5,
          } as unknown as cytoscape.LayoutOptions;

          const layout = cyRef.current.layout(fcoseOptions);

          layout.run();
        }
      }, 700);
    }
  }, [minimizedElements]);

  return (
    <div className="w-full h-full bg-slate-100 overflow-hidden relative">
      {minimizedElements.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-100/80 backdrop-blur-sm">
          <p className="text-sm font-medium text-slate-500 max-w-xs">
            Presiona el botón "Minimizar" para generar el autómata equivalente
            paso a paso.
          </p>
        </div>
      ) : (
        <CytoscapeComponent
          elements={minimizedElements}
          stylesheet={minimizedStylesheet}
          style={{ width: "100%", height: "100%" }}
          cy={handleCyInit}
          userZoomingEnabled={true}
          userPanningEnabled={true}
          boxSelectionEnabled={false}
          autoungrabify={true}
          minZoom={0.3}
          maxZoom={1.2}
        />
      )}
    </div>
  );
};
