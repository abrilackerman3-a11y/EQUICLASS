import React from "react";
import { GraphCanvas } from "../components/canvas/GraphCanvas.tsx";

export const EditorView: React.FC = () => {
  return (
    <main className="w-screen h-screen overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        <GraphCanvas />
      </div>
    </main>
  );
};
