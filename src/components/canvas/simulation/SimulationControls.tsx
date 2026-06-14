import React, { useState } from "react";
import { useAutomataStore } from "../../../store/useAutomataStore";
import IconPlay from "../../../assets/play.svg?react";
import IconNext from "../../../assets/next.svg?react";
import IconPrev from "../../../assets/prev.svg?react";
import IconRestart from "../../../assets/restart.svg?react";
import IconStop from "../../../assets/stop.svg?react";
import IconCheck from "../../../assets/check.svg?react";
import IconCross from "../../../assets/cross.svg?react";
import IconLoading from "../../../assets/loading.svg?react";

export const SimulationControls: React.FC = () => {
  const [inputValue, setInputValue] = useState("");

  const {
    simulation,
    startSimulation,
    nextStep,
    previousStep,
    resetSimulation,
    minimizedElements,
  } = useAutomataStore();
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
    <div className="w-full bg-[#181825] border-t border-[#313244] p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-30 relative">
      {/* FORMULARIO DE ENTRADA */}
      <form
        onSubmit={handleStart}
        className="flex items-center gap-2 w-full md:w-auto"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={status !== "IDLE" || !isMinimizedReady}
          placeholder={
            isMinimizedReady
              ? "Introduce cadena (ej. 1010)"
              : "Primero haz clic en Minimizar"
          }
          className="px-4 py-2 bg-[#1e1e2e] border border-[#cba6f7]/50 rounded-xl text-sm text-[#cdd6f4] placeholder-[#6c7086] focus:outline-none focus:ring-2 focus:ring-[#89dceb] disabled:bg-[#11111b] disabled:text-[#45475a] font-mono w-full md:w-64"
        />
        <button
          type="submit"
          disabled={status !== "IDLE" || !inputValue || !isMinimizedReady}
          className="bg-[#cba6f7] hover:bg-[#b4befe] text-[#11111b] px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:bg-[#313244] disabled:text-[#585b70] active:scale-95"
        >
          <IconPlay className="w-6 h-6" />
        </button>
      </form>

      {/* VISUALIZADOR DE LA CADENA PROCESÁNDOSE */}
      {status !== "IDLE" && (
        <div className="flex items-center gap-1 bg-[#1e1e2e] border border-[#cba6f7]/30 px-4 py-2 rounded-xl text-lg font-mono tracking-widest shadow-inner">
          {inputString.split("").map((char, index) => {
            let charClass = "text-[#585b70]";
            if (index === currentIndex - 1) {
              charClass =
                "text-[#11111b] font-black scale-125 bg-[#89dceb] rounded px-1 transition-all animate-pulse shadow-[0_0_10px_rgba(137,220,235,0.6)]";
            } else if (index < currentIndex) {
              charClass = "text-[#f5c2e7] font-semibold";
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
          className="bg-[#313244] hover:bg-[#45475a] text-[#bac2de] px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 active:scale-95"
        >
          <IconPrev className="w-6 h-6" />
        </button>

        <button
          onClick={nextStep}
          disabled={status !== "RUNNING"}
          className="bg-[#f5c2e7] hover:bg-[#f4b8e4] text-[#11111b] px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:bg-[#313244] disabled:text-[#585b70] active:scale-95 shadow-[0_0_10px_rgba(245,194,231,0.3)]"
        >
          {currentIndex >= inputString.length ? (
            <IconStop className="w-6 h-6" />
          ) : (
            <IconNext className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={() => {
            resetSimulation();
            setInputValue("");
          }}
          disabled={status === "IDLE"}
          className="border border-[#f38ba8]/50 text-[#f38ba8] hover:bg-[#f38ba8]/20 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 active:scale-95"
        >
          <IconRestart className="w-6 h-6" />
        </button>

        {/* REPORTE DE STATUS GLOBAL */}
        <div className="ml-2 font-bold text-xs uppercase tracking-wider">
          {status === "ACCEPTED" && (
            <span className="bg-[#a6e3a1]/20 text-[#a6e3a1] border border-[#a6e3a1]/50 px-3 py-2 rounded-xl animate-bounce inline-block shadow-[0_0_10px_rgba(166,227,161,0.3)]">
              <IconCheck className="w-6 h-6" />
            </span>
          )}
          {status === "REJECTED" && (
            <span className="bg-[#f38ba8]/20 text-[#f38ba8] border border-[#f38ba8]/50 px-3 py-2 rounded-xl animate-shake inline-block shadow-[0_0_10px_rgba(243,139,168,0.3)]">
              <IconCross className="w-6 h-6" />
            </span>
          )}
          {status === "RUNNING" && (
            <span className="bg-[#f9e2af]/20 text-[#f9e2af] border border-[#f9e2af]/50 px-3 py-2 rounded-xl inline-block shadow-[0_0_10px_rgba(249,226,175,0.3)]">
              <IconLoading className="w-6 h-6" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
