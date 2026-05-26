import Button from "./Button";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import { openAddExchangeModal } from "./AddExchangeModal";
import sprite from "../assets/sprite.svg";

export let currentFilter = DEFAULT_SOURCE;

const ActionToolbar = () => {
  const sources = getSource();

  const tabsHtml = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const image = typeof source === 'object' ? source.image : null;
    const isActive = name === currentFilter;
    
    let classes = "hover:border-primary/50 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1";
    if (isActive) {
      classes = "bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1";
    }
    
    const iconHtml = image 
      ? `<img src="${image}" alt="${name}" class="w-5 h-5 rounded-md object-contain ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}">`
      : `<svg class="w-4 h-4 ${isActive ? 'text-background-dark' : 'text-slate-400'}"><use href="${sprite}#layout-dashboard" /></svg>`;

    return `
      <button data-filter="${name}" class="action-filter-btn group flex items-center justify-center gap-2 rounded-lg transition-all duration-200 focus:outline-none ${classes}">
        ${iconHtml}
        <span>${name}</span>
      </button>
    `;
  }).join('');

  const view = `
    <div id="action-toolbar-wrapper">
      <section class="flex items-center justify-between overflow-x-auto">
          <div class="flex items-center gap-3">
            ${tabsHtml}
            ${Button("add-wallet", "plus", "Add Wallet", "text-slate-400 hover:text-white")}
          </div>

          ${Button("add-funds", "plus", "Add Funds", "bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1")}
      </section>
    </div>
  `;

  return view;
}

export const initActionToolbar = () => {
  // Add Wallet
  const addWalletBtn = document.getElementById("add-wallet");
  if (addWalletBtn) {
    addWalletBtn.addEventListener("click", () => {
      openAddExchangeModal({
        onSave: (exchange) => {
          // Re-render toolbar to include new source
          const wrapper = document.getElementById("action-toolbar-wrapper");
          if (wrapper) {
            wrapper.outerHTML = ActionToolbar();
            initActionToolbar();
          }
        }
      });
    });
  }

  // Filter Buttons
  document.querySelectorAll('.action-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.currentTarget.dataset.filter;
      if (currentFilter !== filter) {
        currentFilter = filter;
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('caleta-filter-changed', { detail: { source: currentFilter } }));
        
        // Re-render toolbar to update active tab
        const wrapper = document.getElementById("action-toolbar-wrapper");
        if (wrapper) {
          wrapper.outerHTML = ActionToolbar();
          initActionToolbar();
        }
      }
    });
  });
}

export default ActionToolbar;