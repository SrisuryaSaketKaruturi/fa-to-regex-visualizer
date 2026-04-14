/**
 * render.js
 * Handles all DOM rendering: state tags, accept tags, transition rows,
 * equation list, transition table, result box, and step navigator.
 */

// ─────────────────────────────────────────────
//  STATE TAGS
// ─────────────────────────────────────────────

/**
 * Re-renders the state tag list and the start-state dropdown.
 */
function renderStateUI() {
  const el = document.getElementById('state-tags');

  el.innerHTML = states.map(s => `
    <div class="state-tag ${s === startState ? 'start' : ''}" title="Click to set as start">
      <span onclick="setStart('${s}')">${s === startState ? '→ ' : ''} ${s}</span>
      <span class="x" onclick="removeState('${s}')">✕</span>
    </div>
  `).join('');

  const sel = document.getElementById('start-state');
  sel.innerHTML = states
    .map(s => `<option value="${s}" ${s === startState ? 'selected' : ''}>${s}</option>`)
    .join('');

  sel.onchange = () => { startState = sel.value; renderStateUI(); };
}

/**
 * Re-renders the accept-state toggle tags.
 */
function renderAcceptTags() {
  const el = document.getElementById('accept-tags');

  el.innerHTML = states.map(s => `
    <div class="state-tag ${acceptStates.includes(s) ? 'accept' : ''}"
         onclick="toggleAccept('${s}')" title="Toggle accept">
      ${acceptStates.includes(s) ? '★ ' : ''} ${s}
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
//  TRANSITION ROWS
// ─────────────────────────────────────────────

/**
 * Re-renders all transition rows in the sidebar.
 */
function renderTransitionRows() {
  const alph = getAlphabet();
  const list = document.getElementById('trans-list');

  list.innerHTML = transitions.map((t, i) => `
    <div class="trans-row">
      <select onchange="transitions[${i}].from = this.value">
        ${states.map(s => `<option ${s === t.from ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select onchange="transitions[${i}].symbol = this.value">
        ${alph.map(a => `<option ${a === t.symbol ? 'selected' : ''}>${a}</option>`).join('')}
      </select>
      <select onchange="transitions[${i}].to = this.value">
        ${states.map(s => `<option ${s === t.to ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button class="btn btn-danger btn-sm" onclick="removeTransition(${i})">✕</button>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
//  EQUATION LIST
// ─────────────────────────────────────────────

/**
 * Renders the equation cards in the bottom Equations panel.
 * @param {Object} eq - Map of state → {terms, hasEps}
 */
function renderEquationList(eq) {
  const el = document.getElementById('eq-list');

  el.innerHTML = states.map(s => {
    const parts = [];
    if (eq[s].hasEps) parts.push('ε');
    eq[s].terms.forEach(([sym, from]) => parts.push(`${sym}·${from}`));

    const pills = [];
    if (s === startState)         pills.push('<span class="pill start">start</span>');
    if (acceptStates.includes(s)) pills.push('<span class="pill">accept</span>');

    return `
      <div class="eq-card">
        <div class="eq-state">${s} ${pills.join('')}</div>
        <div class="eq-expr">${s} = ${parts.join(' + ') || '∅'}</div>
      </div>
    `;
  }).join('');
}

// ─────────────────────────────────────────────
//  TRANSITION TABLE
// ─────────────────────────────────────────────

/**
 * Renders the δ transition table.
 * @param {string[]} alph - Alphabet symbols.
 */
function renderTransitionTable(alph) {
  const el = document.getElementById('tt-wrap');

  let html = `
    <table>
      <thead>
        <tr>
          <th>State</th>
          ${alph.map(a => `<th>${a}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
  `;

  states.forEach(s => {
    const isAccept = acceptStates.includes(s);
    const isStart  = s === startState;

    html += '<tr>';
    html += `<td class="state-cell">${isStart ? '→ ' : ''}${s}${isAccept ? ' ★' : ''}</td>`;

    alph.forEach(a => {
      const targets = transitions
        .filter(t => t.from === s && t.symbol === a)
        .map(t => t.to);
      html += targets.length
        ? `<td>${targets.join(',')}</td>`
        : `<td class="empty-mark">—</td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

// ─────────────────────────────────────────────
//  RESULT BOX
// ─────────────────────────────────────────────

/**
 * Renders the final regex result card.
 * @param {string} regex - The derived regular expression.
 */
function renderResultBox(regex) {
  document.getElementById('result-area').innerHTML = `
    <div class="result-box" style="margin-top:14px">
      <div class="result-label">✦ Final Regular Expression</div>
      <div class="result-regex">${regex}</div>
    </div>
  `;
}

// ─────────────────────────────────────────────
//  STEP NAVIGATOR
// ─────────────────────────────────────────────

/**
 * Initialises the step navigator dots and displays Step 1.
 */
function renderSteps() {
  currentStep = 0;

  const dots = document.getElementById('step-dots');
  dots.innerHTML = steps
    .map((_, i) => `
      <div class="step-dot${i === 0 ? ' active' : ''}" id="dot-${i}"
           onclick="jumpStep(${i})" title="Step ${i + 1}"></div>
    `)
    .join('');

  showStep(0);

  document.getElementById('btn-next').disabled = steps.length <= 1;
  document.getElementById('btn-prev').disabled = true;
}

/**
 * Renders the content of a specific step with a fade-in animation.
 * @param {number} i - Step index.
 */
function showStep(i) {
  const el = document.getElementById('step-content');
  el.style.animation = 'none';
  el.offsetHeight; // force reflow to restart animation
  el.style.animation = '';

  el.innerHTML =
    `<span class="eq-label">${steps[i].label}</span>\n\n` + steps[i].html;

  document.getElementById('step-counter').textContent = `${i + 1} / ${steps.length}`;

  document.querySelectorAll('.step-dot')
    .forEach((d, j) => d.classList.toggle('active', j === i));
}

/**
 * Jumps to a specific step and updates nav button states.
 * @param {number} i - Step index.
 */
function jumpStep(i) {
  currentStep = i;
  showStep(i);
  document.getElementById('btn-prev').disabled = i === 0;
  document.getElementById('btn-next').disabled = i === steps.length - 1;
}

/**
 * Advances to the next step.
 */
function nextStep() {
  if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
    document.getElementById('btn-prev').disabled = false;
    document.getElementById('btn-next').disabled = currentStep === steps.length - 1;
  }
}

/**
 * Goes back to the previous step.
 */
function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
    document.getElementById('btn-next').disabled = false;
    document.getElementById('btn-prev').disabled = currentStep === 0;
  }
}
