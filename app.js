// ─────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────
let states       = [];   // Array of state name strings
let transitions  = [];   // Array of {from, symbol, to}
let startState   = '';   // Start state name
let acceptStates = [];   // Accept state names
let steps        = [];   // Derivation steps [{label, html}]
let currentStep  = 0;    // Currently displayed step index
let cyInstance   = null; // Cytoscape instance

// ─────────────────────────────────────────────
//  PRESETS
// ─────────────────────────────────────────────
const PRESETS = {
  ab: {
    states: ['q0','q1','q2'], alphabet: 'a,b', start: 'q0', accept: ['q2'],
    transitions: [
      { from:'q0', symbol:'a', to:'q1' }, { from:'q0', symbol:'b', to:'q0' },
      { from:'q1', symbol:'a', to:'q1' }, { from:'q1', symbol:'b', to:'q2' },
      { from:'q2', symbol:'a', to:'q1' }, { from:'q2', symbol:'b', to:'q0' }
    ]
  },
  astar: {
    states: ['q0'], alphabet: 'a', start: 'q0', accept: ['q0'],
    transitions: [{ from:'q0', symbol:'a', to:'q0' }]
  },
  even: {
    states: ['q0','q1'], alphabet: 'a', start: 'q0', accept: ['q0'],
    transitions: [
      { from:'q0', symbol:'a', to:'q1' },
      { from:'q1', symbol:'a', to:'q0' }
    ]
  },
  ab_or_b: {
    states: ['q0','q1','q2'], alphabet: 'a,b', start: 'q0', accept: ['q2'],
    transitions: [
      { from:'q0', symbol:'a', to:'q1' }, { from:'q0', symbol:'b', to:'q2' },
      { from:'q1', symbol:'b', to:'q0' }, { from:'q2', symbol:'a', to:'q1' },
      { from:'q2', symbol:'b', to:'q2' }
    ]
  }
};

function loadPreset(key) {
  const p = PRESETS[key];
  states       = [...p.states];
  transitions  = p.transitions.map(t => ({ ...t }));
  startState   = p.start;
  acceptStates = [...p.accept];
  document.getElementById('alphabet').value = p.alphabet;
  renderStateUI();
  renderTransitionRows();
  renderAcceptTags();
  showToast('Preset loaded — click ▶ Solve');
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────

function getAlphabet() {
  return document.getElementById('alphabet').value
    .split(',').map(s => s.trim()).filter(Boolean);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ─────────────────────────────────────────────
//  STATE CRUD
// ─────────────────────────────────────────────

function addState() {
  const inp  = document.getElementById('new-state');
  const name = inp.value.trim();
  if (!name) return;
  if (states.includes(name)) { showToast('State already exists'); return; }
  states.push(name);
  if (!startState) startState = name;
  inp.value = '';
  renderStateUI();
  renderTransitionRows();
}

function removeState(s) {
  states       = states.filter(x => x !== s);
  acceptStates = acceptStates.filter(x => x !== s);
  transitions  = transitions.filter(t => t.from !== s && t.to !== s);
  if (startState === s) startState = states[0] || '';
  renderStateUI();
  renderTransitionRows();
  renderAcceptTags();
}

function setStart(s) {
  startState = s;
  renderStateUI();
}

function toggleAccept(s) {
  if (acceptStates.includes(s)) acceptStates = acceptStates.filter(x => x !== s);
  else acceptStates.push(s);
  renderAcceptTags();
}

function addTransition() {
  if (!states.length) { showToast('Add states first'); return; }
  const alph = getAlphabet();
  transitions.push({ from: states[0], symbol: alph[0] || 'a', to: states[0] });
  renderTransitionRows();
}

function removeTransition(i) {
  transitions.splice(i, 1);
  renderTransitionRows();
}

function resetAll() {
  states = []; transitions = []; startState = ''; acceptStates = [];

  ['state-tags','accept-tags','trans-list','start-state']
    .forEach(id => document.getElementById(id).innerHTML = '');

  document.getElementById('eq-list').innerHTML =
    '<div style="color:var(--text3);font-size:11px;font-family:var(--serif);font-style:italic">Equations will appear here after solving.</div>';
  document.getElementById('tt-wrap').innerHTML =
    '<div style="color:var(--text3);font-size:11px;font-family:var(--serif);font-style:italic">Transition table will appear here.</div>';
  document.getElementById('result-area').innerHTML = '';
  document.getElementById('step-content').innerHTML =
    '<span style="color:var(--text3)">Click Solve to begin derivation...</span>';
  document.getElementById('step-counter').textContent = '—';
  document.getElementById('step-dots').innerHTML = '';
  document.getElementById('btn-prev').disabled = true;
  document.getElementById('btn-next').disabled = true;
  document.getElementById('graph-empty').style.display = 'flex';
  document.getElementById('cy').style.display = 'none';
  document.getElementById('graph-badges').style.display = 'none';
  document.getElementById('graph-legend').style.display = 'none';

  if (cyInstance) { cyInstance.destroy(); cyInstance = null; }
  steps = []; currentStep = 0;
}

// ─────────────────────────────────────────────
//  RENDER: STATE UI
// ─────────────────────────────────────────────

function renderStateUI() {
  document.getElementById('state-tags').innerHTML = states.map(s => `
    <div class="state-tag ${s === startState ? 'start' : ''}" title="Click to set as start">
      <span onclick="setStart('${s}')">${s === startState ? '→ ' : ''} ${s}</span>
      <span class="x" onclick="removeState('${s}')">✕</span>
    </div>`).join('');

  const sel = document.getElementById('start-state');
  sel.innerHTML = states.map(s =>
    `<option value="${s}" ${s === startState ? 'selected' : ''}>${s}</option>`).join('');
  sel.onchange = () => { startState = sel.value; renderStateUI(); };
}

function renderAcceptTags() {
  document.getElementById('accept-tags').innerHTML = states.map(s => `
    <div class="state-tag ${acceptStates.includes(s) ? 'accept' : ''}"
         onclick="toggleAccept('${s}')" title="Toggle accept">
      ${acceptStates.includes(s) ? '★ ' : ''} ${s}
    </div>`).join('');
}

// ─────────────────────────────────────────────
//  RENDER: TRANSITION ROWS
// ─────────────────────────────────────────────

function renderTransitionRows() {
  const alph = getAlphabet();
  document.getElementById('trans-list').innerHTML = transitions.map((t, i) => `
    <div class="trans-row">
      <select onchange="transitions[${i}].from = this.value">
        ${states.map(s => `<option ${s === t.from ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <div class="trans-arrow">─${t.symbol}→</div>
      <select onchange="transitions[${i}].to = this.value">
        ${states.map(s => `<option ${s === t.to ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button class="btn btn-danger btn-sm" onclick="removeTransition(${i})">✕</button>
    </div>`).join('');
}

// ─────────────────────────────────────────────
//  RENDER: EQUATION LIST
// ─────────────────────────────────────────────

function renderEquationList(eq) {
  document.getElementById('eq-list').innerHTML = states.map(s => {
    const parts = [];
    if (eq[s].hasEps) parts.push('ε');
    eq[s].terms.forEach(([sym, from]) => parts.push(`${sym}·${from}`));

    const pills = [];
    if (s === startState)         pills.push('<span class="eq-pill eq-pill-start">start</span>');
    if (acceptStates.includes(s)) pills.push('<span class="eq-pill eq-pill-accept">accept</span>');

    return `<div class="eq-card">
      <div class="eq-state">${s} ${pills.join('')}</div>
      <div class="eq-expr">${s} = ${parts.join(' + ') || '∅'}</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
//  RENDER: TRANSITION TABLE
// ─────────────────────────────────────────────

function renderTransitionTable(alph) {
  let html = `<table><thead><tr><th>State</th>
    ${alph.map(a => `<th>${a}</th>`).join('')}</tr></thead><tbody>`;

  states.forEach(s => {
    const isAccept = acceptStates.includes(s);
    const isStart  = s === startState;
    html += `<tr><td class="state-cell">${isStart ? '→ ' : ''}${s}${isAccept ? ' ★' : ''}</td>`;
    alph.forEach(a => {
      const targets = transitions.filter(t => t.from === s && t.symbol === a).map(t => t.to);
      html += targets.length ? `<td>${targets.join(',')}</td>` : `<td class="empty-mark">—</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('tt-wrap').innerHTML = html;
}

// ─────────────────────────────────────────────
//  RENDER: RESULT BOX
// ─────────────────────────────────────────────

function renderResultBox(regex) {
  document.getElementById('result-area').innerHTML = `
    <div class="result-box" style="margin-top:12px">
      <div class="result-label">Final Regular Expression</div>
      <div class="result-regex">${regex}</div>
    </div>`;
}

// ─────────────────────────────────────────────
//  RENDER: STEP NAVIGATOR
// ─────────────────────────────────────────────

function renderSteps() {
  currentStep = 0;
  document.getElementById('step-dots').innerHTML = steps.map((_, i) =>
    `<div class="step-dot${i === 0 ? ' active' : ''}" id="dot-${i}"
          onclick="jumpStep(${i})" title="Step ${i + 1}"></div>`).join('');
  showStep(0);
  document.getElementById('btn-next').disabled = steps.length <= 1;
  document.getElementById('btn-prev').disabled = true;
}

function showStep(i) {
  const el = document.getElementById('step-content');
  el.style.animation = 'none';
  el.offsetHeight; // force reflow
  el.style.animation = '';
  el.innerHTML = `<span class="eq-label">${steps[i].label}</span>\n\n` + steps[i].html;
  document.getElementById('step-counter').textContent = `${i + 1} / ${steps.length}`;
  document.querySelectorAll('.step-dot').forEach((d, j) => d.classList.toggle('active', j === i));
}

function jumpStep(i) {
  currentStep = i;
  showStep(i);
  document.getElementById('btn-prev').disabled = i === 0;
  document.getElementById('btn-next').disabled = i === steps.length - 1;
}

function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-next').disabled = currentStep === steps.length - 1;
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
    document.getElementById('btn-next').disabled = false;
    document.getElementById('btn-prev').disabled = currentStep === 0;
  }
}

// ─────────────────────────────────────────────
//  ARDEN'S THEOREM SOLVER
// ─────────────────────────────────────────────

// Wrap a regex string in parens only if it contains a top-level '+'
function needsParens(r) { return r.includes('+'); }
function wrap(r) { return needsParens(r) ? `(${r})` : r; }

// Union array of regex strings, filtering out ∅
function unionArr(parts) {
  const u = parts.filter(p => p && p !== '∅');
  if (!u.length) return '∅';
  if (u.length === 1) return u[0];
  return u.join('+');
}

// Clean up trivial ε / ∅ patterns
function simplify(r) {
  if (!r || r === '∅') return '∅';
  r = r.replace(/\(ε\)\*/g, 'ε');
  r = r.replace(/·ε([^*]|$)/g, '$1');
  r = r.replace(/ε·/g, '');
  r = r.replace(/\(∅\)/g, '∅');
  if (!r || r === '()') return 'ε';
  return r;
}

// Apply Arden's lemma: X = P*·Q
function applyArden(selfSyms, Q) {
  if (!selfSyms.length) return Q;
  const P    = selfSyms.length === 1 ? selfSyms[0] : selfSyms.join('+');
  const star = `(${P})*`;
  if (Q === 'ε' || Q === '') return star;
  return `${star}${wrap(Q)}`;
}

// ── HTML builders for step display ──

function buildInitialEqHtml(eqMap) {
  let html = '<span class="comment">// Each state gets an equation from incoming transitions\n\n</span>';
  states.forEach(s => {
    const e = eqMap[s];
    const parts = [];
    if (e.hasEps) parts.push('<span class="hl-green">ε</span>');
    e.terms.forEach(({ sym, from }) =>
      parts.push(`<span class="highlight">${sym}</span>·<span class="eq-label">${from}</span>`));
    e.selfSyms.forEach(sym =>
      parts.push(`<span class="highlight">${sym}</span>·<span class="eq-label">${s}</span>`));
    html += `<span class="eq-label">${s}</span>  =  ${
      parts.length ? parts.join('  +  ') : '<span class="comment">∅</span>'}\n`;
  });
  return html;
}

function buildSelfLoopHtml(eqMap) {
  let html = '<span class="comment">// Self-loops become Kleene star via Arden\'s key step\n\n</span>';
  states.forEach(s => {
    const e = eqMap[s];
    if (e.selfSyms.length) {
      const P = e.selfSyms.length === 1 ? e.selfSyms[0] : e.selfSyms.join('+');
      html += `<span class="eq-label">${s}</span> has self-loop on: <span class="hl-green">${e.selfSyms.join(', ')}</span>\n`;
      html += `  <span class="comment">→ Apply Arden's lemma:</span> <span class="eq-label">${s}</span> = <span class="highlight">(${P})*</span> · Q\n\n`;
    } else {
      html += `<span class="eq-label">${s}</span>  <span class="comment">— no self-loop</span>\n`;
    }
  });
  return html;
}

function buildArdenHtml(resolvedMap, eqMap) {
  let html = '<span class="comment">// Substitute resolved states · apply R = P*·Q\n\n</span>';
  states.forEach(s => {
    const e       = eqMap[s];
    const selfStr = e.selfSyms.length ? `(${e.selfSyms.join('+')})*` : '';
    const qParts  = [];
    if (e.hasEps) qParts.push('ε');
    e.terms.forEach(({ sym, from }) => qParts.push(`${sym}·${from}`));
    const qRaw = qParts.join(' + ') || '∅';
    html += `<span class="eq-label">${s}</span>  =  `;
    if (selfStr) html += `<span class="hl-green">${selfStr}</span>·`;
    html += `(${qRaw})\n`;
    html += `     <span class="comment">→</span>  <span class="highlight">${resolvedMap[s] || '∅'}</span>\n\n`;
  });
  return html;
}

function buildFinalHtml(finalRegex, accepts, resolvedMap) {
  let html = '<span class="comment">// Union of regexes for all accept states\n\n</span>';
  accepts.forEach(s => {
    html += `Accept state <span class="eq-label">${s}</span>  →  <span class="hl-green">${resolvedMap[s] || '∅'}</span>\n`;
  });
  html += `\n<span class="comment">// ─────────────────────────────────\n</span>`;
  html += `<span class="comment">// Final Regular Expression:\n</span>`;
  html += `<span class="highlight" style="font-size:13px;letter-spacing:.02em">${finalRegex}</span>`;
  return html;
}

// ── Main solver ──

function runArdens() {
  if (!states.length)       { showToast('Add some states first'); return; }
  if (!startState)          { showToast('Set a start state'); return; }
  if (!acceptStates.length) { showToast('Set at least one accept state'); return; }

  const alph = getAlphabet();
  steps = [];

  // Step 1: Build structured equation map
  // eqMap[s] = { selfSyms: [], terms: [{sym, from}], hasEps: bool }
  const eqMap = {};
  states.forEach(s => { eqMap[s] = { selfSyms: [], terms: [], hasEps: s === startState }; });
  transitions.forEach(t => {
    if (t.to === t.from) eqMap[t.to].selfSyms.push(t.symbol);
    else                 eqMap[t.to].terms.push({ sym: t.symbol, from: t.from });
  });

  steps.push({ label: 'Step 1 — Initial State Equations', html: buildInitialEqHtml(eqMap) });
  steps.push({ label: 'Step 2 — Identify Self-loops',     html: buildSelfLoopHtml(eqMap) });

  // Step 3: Iteratively resolve using Arden's lemma
  const resolvedMap = {};
  const maxPasses   = states.length * states.length + 5;
  let   pass        = 0;

  while (Object.keys(resolvedMap).length < states.length && pass < maxPasses) {
    pass++;
    states.forEach(s => {
      if (resolvedMap[s] !== undefined) return;

      // Wait until all non-self dependencies are resolved
      const unresolved = eqMap[s].terms.filter(({ from }) => resolvedMap[from] === undefined);
      if (unresolved.length > 0) return;

      // Build Q by substituting resolved states
      const qParts = [];
      if (eqMap[s].hasEps) qParts.push('ε');
      eqMap[s].terms.forEach(({ sym, from }) => {
        const r = resolvedMap[from];
        if (r === '∅') return;
        qParts.push(r === 'ε' ? sym : `${sym}·${wrap(r)}`);
      });

      const Q      = unionArr(qParts);
      const Qfinal = (Q === '∅' && eqMap[s].hasEps) ? 'ε' : Q;
      resolvedMap[s] = simplify(applyArden(eqMap[s].selfSyms, Qfinal === '∅' ? 'ε' : Qfinal));
    });
  }

  // Fallback for any circular-dependency states
  states.forEach(s => {
    if (resolvedMap[s] !== undefined) return;
    const qParts = [];
    if (eqMap[s].hasEps) qParts.push('ε');
    eqMap[s].terms.forEach(({ sym, from }) => {
      const r = resolvedMap[from] || '∅';
      if (r === '∅') return;
      qParts.push(r === 'ε' ? sym : `${sym}·${wrap(r)}`);
    });
    const Q = unionArr(qParts) || 'ε';
    resolvedMap[s] = simplify(applyArden(eqMap[s].selfSyms, Q));
  });

  steps.push({ label: "Step 3 — Apply Arden's Lemma (R = P*·Q)", html: buildArdenHtml(resolvedMap, eqMap) });

  // Step 4: Union accept-state expressions
  const finalParts = acceptStates.map(s => resolvedMap[s] || '∅').filter(r => r !== '∅');
  const finalRegex = finalParts.length === 0 ? '∅'
    : finalParts.length === 1 ? finalParts[0]
    : finalParts.map(wrap).join('+');

  steps.push({ label: 'Step 4 — Final Regular Expression', html: buildFinalHtml(finalRegex, acceptStates, resolvedMap) });

  // Build legacy eq format for renderEquationList
  const eq = {};
  states.forEach(s => {
    eq[s] = { hasEps: eqMap[s].hasEps, terms: [] };
    eqMap[s].selfSyms.forEach(sym => eq[s].terms.push([sym, s]));
    eqMap[s].terms.forEach(({ sym, from }) => eq[s].terms.push([sym, from]));
  });

  renderEquationList(eq);
  renderTransitionTable(alph);
  renderResultBox(finalRegex);
  renderGraph();
  renderSteps();
}

// ─────────────────────────────────────────────
//  GRAPH RENDERER (Cytoscape.js)
// ─────────────────────────────────────────────

function renderGraph() {
  document.getElementById('graph-empty').style.display  = 'none';
  document.getElementById('cy').style.display           = 'block';
  document.getElementById('graph-badges').style.display = 'flex';
  document.getElementById('graph-legend').style.display = 'flex';

  if (cyInstance) { cyInstance.destroy(); cyInstance = null; }

  const nodes = states.map(s => ({
    data: { id: s, label: s, isStart: s === startState, isAccept: acceptStates.includes(s) }
  }));

  const edgeMap = {};
  transitions.forEach(t => {
    const key = `${t.from}->${t.to}`;
    if (!edgeMap[key]) edgeMap[key] = { from: t.from, to: t.to, symbols: [] };
    edgeMap[key].symbols.push(t.symbol);
  });

  const edges = Object.values(edgeMap).map((e, i) => ({
    data: { id: `e${i}`, source: e.from, target: e.to, label: e.symbols.join(',') }
  }));

  cyInstance = cytoscape({
    container: document.getElementById('cy'),
    elements:  { nodes, edges },

    style: [
      {
        selector: 'node',
        style: {
          'label':            'data(label)',
          'background-color': '#111520',
          'border-color':     '#5eb6ff',
          'border-width':     2,
          'color':            '#d6e0f0',
          'font-family':      'Syne Mono',
          'font-size':        12,
          'font-weight':      700,
          'text-valign':      'center',
          'text-halign':      'center',
          'width':            48,
          'height':           48
        }
      },
      {
        selector: 'node[?isAccept]',
        style: {
          'border-width':     3,
          'border-color':     '#00ffe0',
          'background-color': 'rgba(0,255,224,0.08)',
          'color':            '#00ffe0'
        }
      },
      {
        selector: 'node[?isStart]',
        style: {
          'border-color':     '#ffb830',
          'background-color': 'rgba(255,184,48,0.08)',
          'color':            '#ffb830'
        }
      },
      {
        selector: 'edge',
        style: {
          'label':                   'data(label)',
          'curve-style':             'bezier',
          'target-arrow-shape':      'triangle',
          'target-arrow-color':      '#5eb6ff',
          'line-color':              '#2a3248',
          'font-family':             'Syne Mono',
          'font-size':               10,
          'color':                   '#6e7f9e',
          'edge-text-rotation':      'autorotate',
          'text-background-color':   '#080a10',
          'text-background-opacity': 1,
          'text-background-padding': 3,
          'width':                   1.5,
          'arrow-scale':             0.8
        }
      },
      {
        selector: 'edge[source = target]',
        style: { 'curve-style': 'loop', 'loop-direction': '0deg', 'loop-sweep': '90deg' }
      }
    ],

    layout: {
      name:          states.length <= 3 ? 'circle' : 'breadthfirst',
      directed:      true,
      padding:       50,
      spacingFactor: 1.8
    },

    userZoomingEnabled: true,
    userPanningEnabled: true,
    minZoom: 0.4,
    maxZoom: 3
  });
}

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
window.onload = () => loadPreset('ab');
