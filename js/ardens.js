/**
 * ardens.js
 * Core Arden's Theorem solving engine.
 * Builds state equations, identifies self-loops, applies the lemma,
 * and produces a final regular expression.
 */

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────

/**
 * Joins an array of symbols with '|' (union).
 * A single symbol is returned as-is.
 * @param {string[]} syms
 * @returns {string}
 */
function union(syms) {
  return syms.length === 1 ? syms[0] : syms.join('+');
}

/**
 * Applies simple algebraic simplifications to a regex string.
 * Removes redundant ε and ∅ patterns.
 * @param {string} expr
 * @returns {string}
 */
function simplify(expr) {
  if (!expr) return 'ε';
  expr = expr.replace(/\(ε\)\*/g, '');
  expr = expr.replace(/·ε/g, '');
  expr = expr.replace(/ε·/g, '');
  expr = expr.replace(/\(∅\)/g, '∅');
  if (!expr || expr === '()') return 'ε';
  return expr;
}

// ─────────────────────────────────────────────
//  HTML BUILDERS  (for step-by-step display)
// ─────────────────────────────────────────────

/**
 * Builds the syntax-highlighted HTML for Step 1 (initial equations).
 * @param {Object} eq - Map of state → {terms, hasEps}
 * @returns {string} HTML string
 */
function buildInitialEqHtml(eq) {
  let html = '<span class="comment">// Each state gets an equation from incoming transitions\n\n</span>';

  states.forEach(s => {
    const parts = [];
    if (eq[s].hasEps) parts.push('<span class="hl-green">ε</span>');
    eq[s].terms.forEach(([sym, from]) => {
      parts.push(`<span class="highlight">${sym}</span>·<span class="eq-label">${from}</span>`);
    });
    html += `<span class="eq-label">${s}</span>  =  ${
      parts.length ? parts.join('  +  ') : '<span class="comment">∅</span>'
    }\n`;
  });

  return html;
}

/**
 * Builds the HTML for Step 2 (self-loop identification).
 * @param {Object} exprs - Map of state → {rhs, self}
 * @returns {string} HTML string
 */
function buildSelfLoopHtml(exprs) {
  let html = '<span class="comment">// Self-loops become Kleene star via Arden\'s key step\n\n</span>';

  states.forEach(s => {
    if (exprs[s].self.length) {
      html += `<span class="eq-label">${s}</span> has self-loop on: <span class="hl-green">${exprs[s].self.join(', ')}</span>\n`;
      html += `  <span class="comment">→ Apply Arden:</span> <span class="eq-label">${s}</span> = <span class="highlight">(${union(exprs[s].self)})*</span> · (rest)\n\n`;
    } else {
      html += `<span class="eq-label">${s}</span>  <span class="comment">— no self-loop</span>\n`;
    }
  });

  return html;
}

/**
 * Builds the HTML for Step 3 (applying Arden's lemma).
 * @param {Object} resolvedMap - Map of state → resolved regex string
 * @param {Object} workExprs   - Map of state → {rhs, selfSyms}
 * @returns {string} HTML string
 */
function buildArdenHtml(resolvedMap, workExprs) {
  let html = '<span class="comment">// Substitute resolved states · apply R = P*·Q\n\n</span>';

  states.forEach(s => {
    const self    = workExprs[s].selfSyms;
    const selfStr = self.length ? `(${union(self)})*` : '';

    html += `<span class="eq-label">${s}</span>  =  `;
    if (selfStr) html += `<span class="hl-green">${selfStr}</span>·`;
    html += `(${workExprs[s].rhs || 'ε'})\n`;
    html += `     <span class="comment">→</span>  <span class="highlight">${resolvedMap[s]}</span>\n\n`;
  });

  return html;
}

/**
 * Builds the HTML for Step 4 (final regex).
 * @param {string} finalRegex  - The derived regular expression
 * @param {string[]} accepts   - Accept state names
 * @param {Object} resolvedMap - Map of state → resolved regex
 * @returns {string} HTML string
 */
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

// ─────────────────────────────────────────────
//  MAIN SOLVER
// ─────────────────────────────────────────────

/**
 * Runs Arden's Theorem on the current automaton.
 * Validates input, builds equations, resolves them, and populates the UI.
 */
function runArdens() {
  if (!states.length)       { showToast('Add some states first');         return; }
  if (!startState)          { showToast('Set a start state');             return; }
  if (!acceptStates.length) { showToast('Set at least one accept state'); return; }

  const alph = getAlphabet();
  steps = [];

  // ── Step 1: Build initial equations ──────────
  // eq[s] = { terms: [[symbol, fromState], ...], hasEps: bool }
  // A state has ε if it is the start state (base case).
  const eq = {};
  states.forEach(s => { eq[s] = { terms: [], hasEps: s === startState }; });
  transitions.forEach(t => { eq[t.to].terms.push([t.symbol, t.from]); });

  steps.push({
    label: 'Step 1 — Initial State Equations',
    html:  buildInitialEqHtml(eq)
  });

  // ── Step 2: Separate self-loops from other terms ──
  // exprs[s] = { rhs: "non-self terms joined", self: [self-loop symbols] }
  // workExprs keeps selfSyms as an array for later Arden application.
  const workExprs = {};
  const exprs     = {};

  states.forEach(s => {
    const rhsParts  = [];
    const selfSyms  = [];
    const plainSelf = [];

    if (eq[s].hasEps) rhsParts.push('ε');

    eq[s].terms.forEach(([sym, from]) => {
      if (from === s) {
        selfSyms.push(sym);
        plainSelf.push(sym);
      } else {
        rhsParts.push(`(${sym}·${from})`);
      }
    });

    workExprs[s] = { rhs: rhsParts.join(' + ') || '∅', selfSyms };
    exprs[s]     = {
      rhs:  rhsParts.join(' + ') || '∅',
      self: plainSelf
    };
  });

  steps.push({
    label: 'Step 2 — Identify Self-loops',
    html:  buildSelfLoopHtml(exprs)
  });

  // ── Step 3: Apply Arden's lemma iteratively ──
  // For each state whose dependencies are all resolved, compute:
  //   X = (selfLoopSymbols)* · (rhs with substitutions)
  const resolvedMap = {};
  const maxIter     = states.length * 3;
  let   iter        = 0;
  let   changed     = true;

  while (changed && iter < maxIter) {
    changed = false;
    iter++;

    states.forEach(s => {
      if (resolvedMap[s]) return;

      let expr       = workExprs[s].rhs;
      const selfStr  = workExprs[s].selfSyms.length ? union(workExprs[s].selfSyms) : null;
      let canResolve = true;

      // Try substituting all already-resolved states
      states.forEach(other => {
        if (other === s) return;
        if (expr.includes(other)) {
          if (resolvedMap[other]) {
            expr = expr.replaceAll(other, `(${resolvedMap[other]})`);
          } else {
            canResolve = false;
          }
        }
      });

      if (canResolve) {
        let result = expr === '∅' ? 'ε' : expr;
        if (selfStr) result = `(${selfStr})*(${result === 'ε' || result === '' ? 'ε' : result})`;
        result = simplify(result);
        resolvedMap[s] = result;
        changed = true;
      }
    });
  }

  // Fallback: force-resolve any remaining states
  states.forEach(s => {
    if (!resolvedMap[s]) {
      const selfStr = workExprs[s].selfSyms.length ? union(workExprs[s].selfSyms) : null;
      let expr      = workExprs[s].rhs || 'ε';

      states.forEach(other => {
        if (other === s) return;
        if (expr.includes(other)) {
          expr = expr.replaceAll(other, resolvedMap[other] || '∅');
        }
      });

      resolvedMap[s] = selfStr
        ? `(${selfStr})*(${expr})`
        : simplify(expr);
    }
  });

  steps.push({
    label: "Step 3 — Apply Arden's Lemma (R = P*·Q)",
    html:  buildArdenHtml(resolvedMap, workExprs)
  });

  // ── Step 4: Union accept-state expressions ──
  const finalParts = acceptStates.map(s => resolvedMap[s] || '∅');
  const finalRegex = finalParts.length === 1
    ? finalParts[0]
    : finalParts.map(p => `(${p})`).join(' + ');

  steps.push({
    label: 'Step 4 — Final Regular Expression',
    html:  buildFinalHtml(finalRegex, acceptStates, resolvedMap)
  });

  // ── Render all panels ──
  renderEquationList(eq);
  renderTransitionTable(alph);
  renderResultBox(finalRegex);
  renderGraph();
  renderSteps();
}
