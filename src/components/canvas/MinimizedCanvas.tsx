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
      "background-color": "#f5c2e7",
      label: "data(label)",
      color: "#11111b",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": "14px",
      "font-weight": "bold",
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
    selector: "node.sink-node",
    style: {
      "background-color": "#313244",
      "border-width": 2,
      "border-color": "#7f849c",
      "border-style": "dashed",
      color: "#cdd6f4",
    },
  },
  {
    selector: "node.equivalence-group",
    style: {
      "background-color": "data(bgColor)",
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
      "border-color": "#89dceb",
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
      "border-color": "#89dceb",
      "border-style": "double",
      "border-width": 6,
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
      color: "#cdd6f4",
      "text-background-opacity": 1,
      "text-background-color": "#181825",
      "text-background-padding": "2px",
      "text-background-shape": "roundrectangle",
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
      color: "#cdd6f4",
      "text-background-opacity": 1,
      "text-background-color": "#181825",
      "text-background-padding": "2px",
      "text-background-shape": "roundrectangle",
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
    selector: "node.active",
    style: {
      "background-color": "#f9e2af", // Yellow
      "border-color": "#fab387", // Peach
      "border-width": "4px",
    },
  },
  {
    selector: "edge.active",
    style: {
      width: "4px",
      "line-color": "#f9e2af", // Yellow
      "target-arrow-color": "#f9e2af",
      color: "#f9e2af",
    },
  },
];

export const MinimizedCanvas: React.FC = () => {
  const { minimizedElements } = useAutomataStore();
  const cyRef = useRef<Core | null>(null);

  const activeNodeMinimized = useAutomataStore(
    (state) => state.simulation.activeNodeMinimized,
  );
  const activeEdgeMinimized = useAutomataStore(
    (state) => state.simulation.activeEdgeMinimized,
  );

  const handleCyInit = (cy: Core) => {
    if (cyRef.current === cy) return;
    cyRef.current = cy;
    cy.boxSelectionEnabled(false);
  };

  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.elements().removeClass("active");

    if (activeNodeMinimized)
      cyRef.current.$(`#${activeNodeMinimized}`).addClass("active");
    if (activeEdgeMinimized)
      cyRef.current.$(`#${activeEdgeMinimized}`).addClass("active");
  }, [activeNodeMinimized, activeEdgeMinimized]);

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
    <div className="w-full h-full bg-[#181825] overflow-hidden relative">
      {minimizedElements.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#181825]/80 backdrop-blur-sm">
          <p className="text-sm font-medium text-[#bac2de] max-w-xs">
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
