/**
 * graph.js
 * Renders the finite automaton using Cytoscape.js.
 */

/**
 * Builds and renders the FA graph from current state/transitions data.
 * Destroys any existing Cytoscape instance before creating a new one.
 */
function renderGraph() {
  document.getElementById('graph-empty').style.display  = 'none';
  document.getElementById('cy').style.display           = 'block';
  document.getElementById('graph-badges').style.display = 'flex';
  document.getElementById('graph-legend').style.display = 'flex';

  if (cyInstance) { cyInstance.destroy(); cyInstance = null; }

  // ── Build node list ──
  const nodes = states.map(s => ({
    data: {
      id:       s,
      label:    s,
      isStart:  s === startState,
      isAccept: acceptStates.includes(s)
    }
  }));

  // ── Group transitions by (from → to) so multi-symbol edges share one label ──
  const edgeMap = {};
  transitions.forEach(t => {
    const key = `${t.from}->${t.to}`;
    if (!edgeMap[key]) edgeMap[key] = { from: t.from, to: t.to, symbols: [] };
    edgeMap[key].symbols.push(t.symbol);
  });

  const edges = Object.values(edgeMap).map((e, i) => ({
    data: {
      id:     `e${i}`,
      source: e.from,
      target: e.to,
      label:  e.symbols.join(',')
    }
  }));

  // ── Initialise Cytoscape ──
  cyInstance = cytoscape({
    container: document.getElementById('cy'),
    elements:  { nodes, edges },

    style: [
      // Default node style
      {
        selector: 'node',
        style: {
          'label':           'data(label)',
          'background-color':'#1a1c26',
          'border-color':    '#7c9cf5',
          'border-width':    2,
          'color':           '#e8e2d4',
          'font-family':     'JetBrains Mono',
          'font-size':       12,
          'font-weight':     600,
          'text-valign':     'center',
          'text-halign':     'center',
          'width':           48,
          'height':          48,
        }
      },
      // Accept state style
      {
        selector: 'node[?isAccept]',
        style: {
          'border-width':    3,
          'border-color':    '#4ecb8e',
          'background-color':'rgba(78,203,142,0.1)',
          'color':           '#4ecb8e'
        }
      },
      // Start state style
      {
        selector: 'node[?isStart]',
        style: {
          'border-color':    '#c8a96e',
          'background-color':'rgba(200,169,110,0.1)',
          'color':           '#c8a96e'
        }
      },
      // Default edge style
      {
        selector: 'edge',
        style: {
          'label':                  'data(label)',
          'curve-style':            'bezier',
          'target-arrow-shape':     'triangle',
          'target-arrow-color':     '#5577e0',
          'line-color':             '#5577e0',
          'font-family':            'JetBrains Mono',
          'font-size':              10,
          'color':                  '#9a9580',
          'edge-text-rotation':     'autorotate',
          'text-background-color':  '#0e0f14',
          'text-background-opacity': 1,
          'text-background-padding': 3,
          'width':                  1.5,
          'arrow-scale':            0.8
        }
      },
      // Self-loop style
      {
        selector: 'edge[source = target]',
        style: {
          'curve-style':     'loop',
          'loop-direction':  '0deg',
          'loop-sweep':      '90deg'
        }
      }
    ],

    layout: {
      name:          states.length <= 3 ? 'circle' : 'breadthfirst',
      directed:      true,
      padding:       50,
      spacingFactor: 1.7
    },

    userZoomingEnabled: true,
    userPanningEnabled: true,
    minZoom: 0.4,
    maxZoom: 3
  });
}
