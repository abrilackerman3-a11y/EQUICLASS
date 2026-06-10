import { useAutomataStore } from "../../store/useAutomataStore";

interface EdgeContextMenuProps {
  edgeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function EdgeContextMenu({ edgeId, position, onClose }: EdgeContextMenuProps) {
  const elements = useAutomataStore((state) => state.elements);
  const updateEdgeSymbol = useAutomataStore((state) => state.updateEdgeSymbol);

  const edge = elements.find(
    (el) => el.group === "edges" && el.data.id === edgeId
  );

  if (!edge) return null;

  const source = edge.data.source;
  const currentLabel = edge.data.label;

  // Símbolos que YA usa otra arista distinta desde el mismo origen
  const usedByOthers = elements
    .filter(
      (el) =>
        el.group === "edges" &&
        el.data.source === source &&
        el.data.id !== edgeId
    )
    .map((el) => el.data.label);

  const handleSelect = (symbol: "0" | "1") => {
    if (symbol === currentLabel) return;
    updateEdgeSymbol(edgeId, symbol);
    onClose();
  };

  return (
    <>
      {/* Overlay para cerrar al hacer click fuera */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="absolute z-50 flex gap-1 rounded-lg bg-white shadow-lg border border-gray-200 p-1"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -100%)",
        }}
      >
        {(["0", "1"] as const).map((symbol) => {
          const isCurrent = symbol === currentLabel;
          const isDisabled = !isCurrent && usedByOthers.includes(symbol);

          return (
            <button
              key={symbol}
              disabled={isDisabled}
              onClick={() => handleSelect(symbol)}
              className={`
                w-9 h-9 rounded-md font-bold text-sm transition-colors
                ${isCurrent
                  ? "bg-green-500 text-white"
                  : isDisabled
                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
                }
              `}
            >
              {symbol}
            </button>
          );
        })}
      </div>
    </>
  );
}