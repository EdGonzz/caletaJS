import Button from "./Button";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import { openAddExchangeModal } from "./AddExchangeModal";
import { openAddAssetModal } from "./AddAssetModal";
import sprite from "../assets/sprite.svg";

export let currentFilter = DEFAULT_SOURCE;

const ActionToolbar = () => {
  const sources = getSource();

  const activeSource = sources.find(s => {
    const name = typeof s === 'string' ? s : s.name;
    return name === currentFilter;
  });
  const activeName = typeof activeSource === 'string' ? activeSource : activeSource?.name;
  const activeImage = typeof activeSource === 'object' ? activeSource?.image : null;

  // Tabs para desktop
  const tabsHtml = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const image = typeof source === 'object' ? source.image : null;
    const isActive = name === currentFilter;

    let classes = "hover:border-primary/40 border border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white px-3 py-1";
    if (isActive) {
      classes = "bg-primary text-slate-900 font-bold hover:brightness-110 px-3 py-1 border border-primary";
    }

    const iconHtml = image
      ? `<img src="${image}" alt="${name}" class="w-5 h-5 rounded-md object-contain ${isActive ? '' : 'opacity-70 group-hover:opacity-100'}" width="20" height="20" loading="lazy">`
      : `<svg class="w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}"><use href="${sprite}#layout-dashboard" /></svg>`;

    return `
      <button data-filter="${name}" class="action-filter-btn btn-press group hidden sm:flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ${classes}" aria-pressed="${isActive}">
        ${iconHtml}
        <span>${name}</span>
      </button>
    `;
  }).join('');

  // Dropdown mobile
  const dropdownOptions = sources.map(source => {
    const name = typeof source === 'string' ? source : source.name;
    const isActive = name === currentFilter;
    return `
      <button
        data-filter="${name}"
        class="action-filter-btn btn-press flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all ${isActive ? 'bg-primary/20 text-primary font-bold' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}"
        aria-pressed="${isActive}"
        role="menuitem"
      >${name}</button>
    `;
  }).join('');

  const view = `
    <div id="action-toolbar-wrapper">
      <section class="flex items-center justify-between gap-3">
        <!-- Desktop tabs -->
        <div class="hidden sm:flex items-center gap-3 overflow-x-auto custom-scrollbar scroll-fade-container">
          ${tabsHtml}
          ${Button("add-wallet", "plus", "Add Wallet", "text-slate-400 hover:text-white")}
        </div>

        <!-- Mobile dropdown trigger -->
        <div class="sm:hidden relative" id="filter-dropdown-wrapper">
          <button id="filter-dropdown-btn" class="btn-press flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700 hover:border-primary/40 rounded-lg text-slate-300 text-sm font-medium transition-all" aria-haspopup="true" aria-expanded="false" aria-label="Seleccionar fuente">
            ${activeImage ? `<img src="${activeImage}" alt="${activeName}" class="w-4 h-4 rounded object-contain" width="16" height="16" loading="lazy">` : ''}
            <span>${activeName || 'Caletas'}</span>
            <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" id="filter-dropdown-chevron"><use href="${sprite}#chevron-down" /></svg>
          </button>
          <div id="filter-dropdown-menu" class="absolute top-full left-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 z-40 hidden" role="menu">
            ${dropdownOptions}
          </div>
        </div>

        ${Button("add-funds", "plus", "Add Funds", "btn-hover-glow bg-primary text-slate-900 font-bold hover:brightness-110 px-3 py-1")}
      </section>
    </div>
  `;

  return view;
}

export const initActionToolbar = () => {
  cleanupActionToolbar();

  // Add Wallet
  const addWalletBtn = document.getElementById("add-wallet");
  if (addWalletBtn) {
    addWalletBtn.addEventListener("click", () => {
      openAddExchangeModal({
        onSave: (exchange) => {
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
    addFundsBtn.addEventListener("click", () => {
      openAddAssetModal();
    });
  }

  // Mobile dropdown toggle
  const dropdownBtn = document.getElementById("filter-dropdown-btn");
  const dropdownMenu = document.getElementById("filter-dropdown-menu");
  const dropdownChevron = document.getElementById("filter-dropdown-chevron");
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener("click", () => {
      const isOpen = !dropdownMenu.classList.contains("hidden");
      dropdownMenu.classList.toggle("hidden");
      dropdownBtn.setAttribute("aria-expanded", String(!isOpen));
      dropdownChevron?.classList.toggle("rotate-180", !isOpen);
    });

    // Cerrar al hacer click fuera
    _clickDropdownHandler = (e) => {
      if (dropdownBtn && dropdownMenu && !dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.add("hidden");
        dropdownBtn.setAttribute("aria-expanded", "false");
        dropdownChevron?.classList.remove("rotate-180");
      }
    };
    document.addEventListener("click", _clickDropdownHandler);
  }

  // Filter Buttons (desktop + dropdown)
  document.querySelectorAll('.action-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.currentTarget.dataset.filter;
      if (currentFilter !== filter) {
        currentFilter = filter;
        window.dispatchEvent(new CustomEvent('caleta-filter-changed', { detail: { source: currentFilter } }));
        const wrapper = document.getElementById("action-toolbar-wrapper");
        if (wrapper) {
          wrapper.outerHTML = ActionToolbar();
          initActionToolbar();
        }
      }
      // Cerrar dropdown si está abierto
      dropdownMenu?.classList.add("hidden");
      dropdownBtn?.setAttribute("aria-expanded", "false");
      dropdownChevron?.classList.remove("rotate-180");
    });
  });

  // Scroll fade indicator
  const scrollContainer = document.querySelector('#action-toolbar-wrapper .scroll-fade-container');
  if (scrollContainer && !_scrollFadeHandler) {
    _scrollFadeHandler = () => {
      const isEnd = scrollContainer.scrollWidth - scrollContainer.scrollLeft <= scrollContainer.clientWidth + 5;
      scrollContainer.classList.toggle('scroll-end', isEnd);
    };
    scrollContainer.addEventListener('scroll', _scrollFadeHandler, { passive: true });
    _scrollFadeHandler();
  }
}

/** @type {(() => void) | null} */
let _scrollFadeHandler = null;
/** @type {((e: Event) => void) | null} */
let _clickDropdownHandler = null;

export const cleanupActionToolbar = () => {
  if (_scrollFadeHandler) {
    const scrollContainer = document.querySelector('#action-toolbar-wrapper .scroll-fade-container');
    if (scrollContainer) scrollContainer.removeEventListener('scroll', _scrollFadeHandler);
    _scrollFadeHandler = null;
  }
  if (_clickDropdownHandler) {
    document.removeEventListener("click", _clickDropdownHandler);
    _clickDropdownHandler = null;
  }
};

export default ActionToolbar;
