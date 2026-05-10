import Button from "./Button";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import { openAddExchangeModal } from "./AddExchangeModal";
import { openAddAssetModal } from "./AddAssetModal";
import sprite from "../assets/sprite.svg";

export let currentFilter = DEFAULT_SOURCE;

const ActionToolbar = () => {
  const sources = getSource();

  const tabsHtml = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const isActive = name === currentFilter;
    
    let classes = "hover:border-primary/50 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1";
    if (isActive) {
      classes = "bg-primary text-background-dark text-md font-bold hover:brightness-110 px-3 py-1";
    }
    
    // We reuse the Button structure or just create a button directly
    return `
      <button data-filter="${name}" class="action-filter-btn flex items-center justify-center gap-2 rounded-lg transition-all duration-200 focus:outline-none ${classes}">
        ${name}
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

  // Add Funds
  const addFundsBtn = document.getElementById("add-funds");
  if (addFundsBtn) {
    // Remove old listeners by cloning the node if needed, but since it's freshly rendered, we just add it
    addFundsBtn.addEventListener("click", () => {
      openAddAssetModal();
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