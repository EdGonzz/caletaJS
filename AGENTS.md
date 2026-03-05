# Caleta - AI Assistant Reference Guide (Agents.md)

This file serves as the system prompt and technical guide for any AI (Gemini, Claude, GPT, etc.) interacting with this codebase. **Before making any code modifications, firmly grasp the architectural context and strict rules outlined below.**

## 🎯 1. Project Overview
- **Name:** CaletaJS (caleta)
- **Type:** Single Page Application (SPA)
- **Description:** A high-performance, simulated tracking system for cryptocurrency investments.
- **Tech Stack:** Vanilla JavaScript (ES6+), Webpack 5, Tailwind CSS v4, Babel, PostCSS.
- **Package Manager:** `pnpm` (version 10.x). **Do not use `npm` or `yarn`.**

## 🏗️ 2. Architecture & Patterns (CRITICAL)
This project is built from scratch without modern UI frameworks. **Do NOT write or suggest React, Vue, Svelte, or Angular code.**

- **Components:** UI components (in `src/components/` and `src/pages/`) are pure functions that return HTML strings using template literals.
  ```javascript
  // Example Component structure
  const MyComponent = (data) => `
    <div class="p-4 bg-white rounded-lg">
      <h2 class="text-xl">${data.title}</h2>
    </div>
  `;
  export default MyComponent;
  ```
- **Routing:** Implements a custom hash-based router (`src/router/routes.js`). It listens to `hashchange` and `load` events, resolves the current path, and injects the corresponding page string into the `<div id="app"></div>` root node.
- **Interactivity & DOM Manipulation:** Because components return strings, you cannot attach event listeners inline (e.g., no `onClick=...`). You must rely on initialization functions exported from components (e.g., `initHoldingsTable()`) that use `document.getElementById/querySelector` and `addEventListener` **after** the router has injected the HTML into the DOM.

## 🛡️ 3. Coding Guidelines & Philosophy
Follow the User's explicitly defined constraints:
- **Type Safety Mindset:** Even though this is currently a JavaScript project (processed by Babel), approach it with Strict Type principles. Avoid `any`-like behavior; explicitly check types, use optional chaining (`?.`), nullish coalescing (`??`), and fail gracefully.
- **Style:** Concise, functional, declarative. Write pure functions. Avoid verbose explanations—return direct code solutions.
- **Accessibility (WCAG 2.1 AA):** All interactive elements must be keyboard accessible and include readable `aria-label`s. Ensure proper semantic HTML usage (`<main>`, `<nav>`, `<article>`, `<header>`, `<footer>`).
- **Performance:** "Measure first, optimize second. Zero-JS by default." Use native browser features whenever possible instead of bloated libraries (e.g., no Lodash, use native array methods).

## 📁 4. Directory Structure
```text
caleta/
├── public/                 # Static assets, entry index.html
├── src/
│   ├── assets/             # Images, SVGs, etc.
│   ├── components/         # Reusable structural UI pieces (Header, HoldingsTable, etc.)
│   ├── pages/              # View-level components mapped directly to routes
│   ├── router/             # Hash-based SPA routing logic
│   ├── styles/             # Global CSS and Tailwind directives
│   ├── utils/              # Helper pure functions (getHash, string formatting, API calls)
│   └── index.js            # Main entry file linking styles and the router
├── package.json            # Scripts & dependencies
├── webpack.config.js       # Webpack bundler configuration
└── tailwind.config.js      # Tailwind v4 path and content config
```

## 🛠️ 5. Common Workflows
- **Development Server:** `pnpm start` (Runs Webpack server with hot reloading)
- **Production Build:** `pnpm build` (Compiles optimized bundle to `/dist`)
- **Adding new routes:** Update the `routes` object in `src/router/routes.js` and ensure any DOM wiring logic is executed in the `router()` async function after rendering.

## 📝 6. Notion / Project Management 
- Tasks and planning are maintained in an external database/Notion. Ensure that when creating components, logic maps to established project outlines (like "HoldingsTable" or "Charts Section").

---
**AI Instruction:** Acknowledge this context before attempting any codebase restructuring, and always remain within the bounds of Vanilla JS + Tailwind.
