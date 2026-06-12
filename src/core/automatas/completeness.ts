import type { GraphElement, NodeData, EdgeData } from '../../types/automata';

export const enforceCompleteness = (
  nodes: GraphElement<NodeData>[],
  edges: GraphElement<EdgeData>[]
): { newNodes: GraphElement<NodeData>[]; newEdges: GraphElement<EdgeData>[] } => {
  const alphabet: Array<'0' | '1'> = ['0', '1'];
  const newEdges = [...edges];
  const newNodes = [...nodes];
  
  let sinkNodeId = newNodes.find(n => n.data.isSink)?.data.id;
  let needsSink = false;

  const outgoingTransitions: Record<string, Set<'0' | '1'>> = {};
  
  newNodes.forEach(node => {
    outgoingTransitions[node.data.id] = new Set();
  });

  newEdges.forEach(edge => {
    outgoingTransitions[edge.data.source]?.add(edge.data.label);
  });

  newNodes.forEach(node => {
    const transitions = outgoingTransitions[node.data.id];
    
    alphabet.forEach(symbol => {
      if (!transitions.has(symbol)) {
        needsSink = true;
        
        if (!sinkNodeId) sinkNodeId = 'q_sink';

        newEdges.push({
          group: 'edges',
          data: {
            id: `e_${node.data.id}_${sinkNodeId}_${symbol}`,
            source: node.data.id,
            target: sinkNodeId,
            label: symbol,
          },
        });
      }
    });
  });

  if (needsSink && !nodes.some(n => n.data.id === sinkNodeId)) {
    newNodes.push({
      group: 'nodes',
      data: {
        id: sinkNodeId!,
        label: 'Pozo',
        isSink: true, 
      },
    });

    alphabet.forEach(symbol => {
      newEdges.push({
        group: 'edges',
        data: {
          id: `e_${sinkNodeId}_${sinkNodeId}_${symbol}`,
          source: sinkNodeId!,
          target: sinkNodeId!,
          label: symbol,
        },
      });
    });
  }

  return { newNodes, newEdges };
};
