# Finite Automata to Regular Expression Visualizer (Arden’s Theorem)

This project is a simple web tool that lets you **build a DFA (Finite Automaton)** and convert it into a **Regular Expression** using **Arden’s Theorem**.

Instead of just showing the final answer, it walks through the **entire process step-by-step**, so it’s easier to understand what’s actually happening.

live demo: https://fa-to-regexpressionardentheoem.vercel.app/
---

## What this project does

* Lets you create your own DFA (states, transitions, etc.)
* Converts the DFA into **state equations**
* Applies **Arden’s Theorem** step by step
* Shows how the final **regular expression** is derived
* Displays the automaton visually using a graph

---

## Features

* Interactive DFA builder
* Step-by-step Arden’s Theorem solving
* Graph visualization of automaton
* Transition table and equation display
* Some preset examples to try quickly

---

## Tech used

* HTML, CSS, JavaScript
* Cytoscape.js (for graph visualization)

---

## How to run

Just open the project:

```id="run1"
index.html
```

Or use Live Server in VS Code.

---

## Example cases included

* Strings ending with `ab`
* Even number of `a`
* `a*` (zero or more a’s)
* `(ab)*b`

---

## How it works (basic idea)

1. You define a DFA
2. The program converts it into equations
3. Self-loops are handled using Arden’s Theorem
4. Equations are simplified step by step
5. Final regular expression is produced

---

## Future improvements

* DFA minimization visualization
* Support for NFA with ε transitions
* More complex examples
* Better animations

---

## Author

Made by Srisurya Saket Karuturi

---

## Note

This project is mainly for **learning and demonstration purposes**.
