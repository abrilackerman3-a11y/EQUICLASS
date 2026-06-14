import type { CssStyleDeclaration } from "cytoscape";

export const cytoscapeSimulationStyles: CssStyleDeclaration[] = [
  {
    selector: "node",
    style: {
      "background-color": "#ffffff",
      "label": "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "color": "#1e293b",
      "font-size": "14px",
      "font-weight": "bold",
      "border-width": "2px",
      "border-color": "#64748b",
      "width": "45px",
      "height": "45px",
      "transition-property": "background-color, border-color, line-color",
      "transition-duration": "0.2s"
    }
  },
  // Nodo Inicial (Borde índigo grueso)
  {
    selector: "node.initial",
    style: {
      "border-width": "4px",
      "border-color": "#4f46e5"
    }
  },
  // Nodo Final (Borde esmeralda grueso)
  {
    selector: "node.final",
    style: {
      "border-width": "5px",
      "border-color": "#10b981"
    }
  },
  // Nodo Pozo (Grisáceo)
  {
    selector: "node.sink-node",
    style: {
      "background-color": "#f1f5f9",
      "border-color": "#cbd5e1",
      "color": "#64748b"
    }
  },

  // --- ESTILOS BASE PARA ARISTAS ---
  {
    selector: "edge",
    style: {
      "width": "2px",
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "label": "data(label)",
      "font-size": "13px",
      "text-margin-y": "-10px",
      "color": "#334155",
      "font-weight": "bold",
      "transition-property": "line-color, target-arrow-color, width",
      "transition-duration": "0.2s"
    }
  },

  // --- ESTILOS DE ILUMINACIÓN (SIMULACIÓN AUTOMÁTICA) ---
  {
    selector: "node.active",
    style: {
      "background-color": "#fef08a", // Amarillo radiante
      "border-color": "#eab308",     // Borde dorado
      "border-width": "4px",
      "scale": 1.15                  // Crece ligeramente
    }
  },
  {
    selector: "edge.active",
    style: {
      "width": "4px",
      "line-color": "#eab308",       // Línea dorada de transición
      "target-arrow-color": "#eab308",
      "color": "#ca8a04"
    }
  }
];