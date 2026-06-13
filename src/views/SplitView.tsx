import React from "react";
import { GraphCanvas } from "../components/canvas/GraphCanvas";
import { MinimizedCanvas } from "../components/canvas/MinimizedCanvas";
import { useAutomataStore } from "../store/useAutomataStore";

export const SplitView: React.FC = () => {
  const { minimizedElements } = useAutomataStore();
  const isMinimized = minimizedElements.length > 0;

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-slate-50">
      {/* --- ENCABEZADO --- */}
      <div className="w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-30 shrink-0">
        <div>
          <h1 className="text-base font-bold text-slate-800">Minimizador de AFD</h1>
          <p className="text-xs text-slate-500 hidden sm:block">Myhill-Nerode paso a paso</p>
        </div>


      </div>

      <div className="flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        
        <div 
          className={`relative border-b md:border-b-0 md:border-r border-slate-300 transition-all duration-700 ease-in-out shrink-0
            w-full md:h-full 
            ${isMinimized ? "h-[40%] md:w-[40%]" : "h-[70%] md:w-[70%]"}`}
        >
          <GraphCanvas />
        </div>

        <div 
          className={`relative transition-all duration-700 ease-in-out shrink-0
            w-full md:h-full
            ${isMinimized ? "h-[60%] md:w-[60%]" : "h-[30%] md:w-[30%]"}`}
        >
          <MinimizedCanvas />
        </div>
      </div>
    </div>
  );
};
