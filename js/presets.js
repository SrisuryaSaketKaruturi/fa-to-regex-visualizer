/**
 * presets.js
 * Predefined finite automata for quick loading.
 */

const PRESETS = {
  ab: {
    states: ['q0', 'q1', 'q2'],
    alphabet: 'a,b',
    start: 'q0',
    accept: ['q2'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q0', symbol: 'b', to: 'q0' },
      { from: 'q1', symbol: 'a', to: 'q1' },
      { from: 'q1', symbol: 'b', to: 'q2' },
      { from: 'q2', symbol: 'a', to: 'q1' },
      { from: 'q2', symbol: 'b', to: 'q0' }
    ]
  },

  astar: {
    states: ['q0'],
    alphabet: 'a',
    start: 'q0',
    accept: ['q0'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q0' }
    ]
  },

  even: {
    states: ['q0', 'q1'],
    alphabet: 'a',
    start: 'q0',
    accept: ['q0'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q1', symbol: 'a', to: 'q0' }
    ]
  },

  ab_or_b: {
    states: ['q0', 'q1', 'q2'],
    alphabet: 'a,b',
    start: 'q0',
    accept: ['q2'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q0', symbol: 'b', to: 'q2' },
      { from: 'q1', symbol: 'b', to: 'q0' },
      { from: 'q2', symbol: 'a', to: 'q1' },
      { from: 'q2', symbol: 'b', to: 'q2' }
    ]
  }
};

/**
 * Loads a preset automaton by key and refreshes all UI panels.
 * @param {string} key - Key from the PRESETS object.
 */
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
