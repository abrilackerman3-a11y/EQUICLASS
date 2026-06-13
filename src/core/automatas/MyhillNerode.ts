import type { ElementDefinition } from "cytoscape";

export const minimizeDFA = (elements: ElementDefinition[]): string[][] => {
  // 1. Extracción de entidades del grafo
  const nodes = elements.filter((el) => el.group === "nodes");
  const edges = elements.filter((el) => el.group === "edges");

  const states = nodes.map((n) => n.data.id as string);
  const finalStates = new Set(
    nodes.filter((n) => n.data.isFinal).map((n) => n.data.id as string)
  );
  
  const alphabet = ["0", "1"];

  // 2. Construcción de la matriz de transiciones (Función Delta)
  // delta[estado][simbolo] = estado_destino
  const delta: Record<string, Record<string, string>> = {};
  states.forEach((s) => (delta[s] = {}));
  
  edges.forEach((e) => {
    if (e.data.source && e.data.target && e.data.label !== undefined) {
      delta[e.data.source][String(e.data.label)] = e.data.target;
    }
  });

  const getPairKey = (p: string, q: string) => {
    return p < q ? `${p},${q}` : `${q},${p}`;
  };

  const marked = new Set<string>();

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const p = states[i];
      const q = states[j];
      
      const pIsFinal = finalStates.has(p);
      const qIsFinal = finalStates.has(q);

      if (pIsFinal !== qIsFinal) {
        marked.add(getPairKey(p, q));
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const p = states[i];
        const q = states[j];
        const pairKey = getPairKey(p, q);

        if (!marked.has(pairKey)) {
          for (const sym of alphabet) {
            const pNext = delta[p]?.[sym];
            const qNext = delta[q]?.[sym];

            if (pNext && qNext && pNext !== qNext) {
              const nextPairKey = getPairKey(pNext, qNext);
              if (marked.has(nextPairKey)) {
                marked.add(pairKey);
                changed = true;
                break; 
              }
            }
          }
        }
      }
    }
  }

  const parent: Record<string, string> = {};
  states.forEach((s) => (parent[s] = s));

  const find = (i: string): string => {
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i])); // 
  };

  const union = (i: string, j: string) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  };

  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const p = states[i];
      const q = states[j];
      if (!marked.has(getPairKey(p, q))) {
        union(p, q);
      }
    }
  }

  const classesMap: Record<string, string[]> = {};
  states.forEach((s) => {
    const root = find(s);
    if (!classesMap[root]) classesMap[root] = [];
    classesMap[root].push(s);
  });

  return Object.values(classesMap);
};
