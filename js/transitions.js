/**
 * transitions.js
 * Handles state CRUD, accept-state toggling, and transition row management.
 */

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Reads and parses the alphabet input field.
 * @returns {string[]} Array of symbol strings.
 */
function getAlphabet() {
  return document.getElementById('alphabet')
    .value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────
//  STATE CRUD
// ─────────────────────────────────────────────

/**
 * Adds a new state from the #new-state input field.
 */
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

/**
 * Removes a state and all transitions referencing it.
 * @param {string} s - State name to remove.
 */
function removeState(s) {
  states       = states.filter(x => x !== s);
  acceptStates = acceptStates.filter(x => x !== s);
  transitions  = transitions.filter(t => t.from !== s && t.to !== s);
  if (startState === s) startState = states[0] || '';

  renderStateUI();
  renderTransitionRows();
  renderAcceptTags();
}

/**
 * Sets the given state as the start state and refreshes the state UI.
 * @param {string} s - State name.
 */
function setStart(s) {
  startState = s;
  renderStateUI();
}

/**
 * Toggles a state's membership in acceptStates.
 * @param {string} s - State name.
 */
function toggleAccept(s) {
  if (acceptStates.includes(s)) {
    acceptStates = acceptStates.filter(x => x !== s);
  } else {
    acceptStates.push(s);
  }
  renderAcceptTags();
}

// ─────────────────────────────────────────────
//  TRANSITION ROWS
// ─────────────────────────────────────────────

/**
 * Appends a blank transition row (defaults to first state and first symbol).
 */
function addTransition() {
  if (!states.length) { showToast('Add states first'); return; }
  const alph = getAlphabet();
  transitions.push({ from: states[0], symbol: alph[0] || 'a', to: states[0] });
  renderTransitionRows();
}

/**
 * Removes the transition at the given index.
 * @param {number} i - Index into the transitions array.
 */
function removeTransition(i) {
  transitions.splice(i, 1);
  renderTransitionRows();
}

// ─────────────────────────────────────────────
//  RESET
// ─────────────────────────────────────────────

/**
 * Clears all application state and resets every UI panel to its empty placeholder.
 */
function resetAll() {
  states       = [];
  transitions  = [];
  startState   = '';
  acceptStates = [];

  document.getElementById('state-tags').innerHTML   = '';
  document.getElementById('accept-tags').innerHTML  = '';
  document.getElementById('trans-list').innerHTML   = '';
  document.getElementById('start-state').innerHTML  = '';

  document.getElementById('eq-list').innerHTML =
    '<div style="color:var(--text3);font-size:12px;font-family:var(--serif);font-style:italic">Equations will appear here after solving.</div>';

  document.getElementById('tt-wrap').innerHTML =
    '<div style="color:var(--text3);font-size:12px;font-family:var(--serif);font-style:italic">Transition table will appear here.</div>';

  document.getElementById('result-area').innerHTML = '';

  document.getElementById('step-content').innerHTML =
    '<span style="color:var(--text3)">Click Solve to begin derivation...</span>';

  document.getElementById('step-counter').textContent = '—';
  document.getElementById('step-dots').innerHTML      = '';

  document.getElementById('btn-prev').disabled = true;
  document.getElementById('btn-next').disabled = true;

  document.getElementById('graph-empty').style.display  = 'flex';
  document.getElementById('cy').style.display           = 'none';
  document.getElementById('graph-badges').style.display = 'none';
  document.getElementById('graph-legend').style.display = 'none';

  if (cyInstance) { cyInstance.destroy(); cyInstance = null; }

  steps       = [];
  currentStep = 0;
}
