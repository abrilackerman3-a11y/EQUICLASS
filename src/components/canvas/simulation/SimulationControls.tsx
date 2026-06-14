import React, { useState } from "react";
import { useAutomataStore } from "../../../store/useAutomataStore";

export const SimulationControls: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  
  const { simulation, startSimulation, nextStep, previousStep, resetSimulation, minimizedElements } = useAutomataStore();
  const { inputString, currentIndex, status } = simulation;

  const isMinimizedReady = minimizedElements.length > 0;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Validar que solo sean 0s y 1s
    if (!/^[01]+$/.test(inputValue)) {
      alert("Por favor introduce una cadena válida (solo 0 y 1)");
      return;
    }
    startSimulation(inputValue);
  };

  return (
    <div className="w-full bg-white border-t border-slate-200 p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 z-30 relative">
      
      {/* FORMULARIO DE ENTRADA */}
      <form onSubmit={handleStart} className="flex items-center gap-2 w-full md:w-auto">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={status !== "IDLE" || !isMinimizedReady}
          placeholder={isMinimizedReady ? "Introduce cadena (ej. 1010)" : "Primero haz clic en Minimizar"}
          className="px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-mono w-full md:w-64"
        />
        <button
          type="submit"
          disabled={status !== "IDLE" || !inputValue || !isMinimizedReady}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:bg-slate-200 disabled:text-slate-400 active:scale-95"
        >
          Iniciar
        </button>
      </form>

      {/* VISUALIZADOR DE LA CADENA PROCESÁNDOSE */}
      {status !== "IDLE" && (
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-lg font-mono tracking-widest shadow-inner">
          {inputString.split("").map((char, index) => {
            let charClass = "text-slate-400";
            if (index === currentIndex - 1) {
              charClass = "text-amber-500 font-black scale-125 bg-amber-50 rounded px-1 transition-all animate-pulse";
            } else if (index < currentIndex) {
              charClass = "text-indigo-600 font-semibold";
            }
            return (
              <span key={index} className={`inline-block ${charClass}`}>
                {char}
              </span>
            );
          })}
        </div>
      )}

      {/* BOTONES DE CONTROL PASO A PASO */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          onClick={previousStep}
          disabled={status === "IDLE" || currentIndex <= 0}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 active:scale-95"
        >
          Anterior
        </button>

        <button
          onClick={nextStep}
          disabled={status !== "RUNNING"}
          className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:bg-slate-200 disabled:text-slate-400 active:scale-95"
        >
          {currentIndex >= inputString.length ? "Terminar" : "Siguiente"}
        </button>

        <button
          onClick={() => {
            resetSimulation();
            setInputValue("");
          }}
          disabled={status === "IDLE"}
          className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 active:scale-95"
        >
          Reset
        </button>

        {/* REPORTE DE STATUS GLOBAL */}
        <div className="ml-2 font-bold text-xs uppercase tracking-wider">
          {status === "ACCEPTED" && (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl animate-bounce inline-block">
              ✓ Cadena Aceptada
            </span>
          )}
          {status === "REJECTED" && (
            <span className="bg-rose-100 text-rose-800 border border-rose-200 px-3 py-2 rounded-xl animate-shake inline-block">
              ✗ Cadena Rechazada
            </span>
          )}
          {status === "RUNNING" && (
            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-xl inline-block">
              Procesando ({currentIndex}/{inputString.length})
            </span>
          )}
        </div>
      </div>

    </div>
  );
};