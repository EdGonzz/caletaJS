import getCoin, { getTopCoins } from "../utils/getCoin";
import { SelectExchange, SelectLoading } from "./SelectExchange";
import { CoinPicker, initCoinPicker } from "./CoinPicker";
import { getSource, DEFAULT_SOURCE } from "../utils/sources";
import { now, formatUsd } from "../utils/formatters";
import AddExchangeModal, { openAddExchangeModal, initAddExchangeModal } from "./AddExchangeModal";
import sprite from "../assets/sprite.svg";

let coins = await getTopCoins();

// ─── State ─────────────────────────────────────────────────────────
/** @type {'buy'|'sell'|'transfer'} */
let activeTab = "buy";
/** @type {import('../utils/getCoin').Coin} */
let selectedCoin = coins[0];
/** @type {import('./SelectExchange').Exchange | null} */
const _sources = getSource().filter((s) => s !== DEFAULT_SOURCE);
let selectedExchange = _sources[0] ?? null;
/** @type {'form'|'exchange'|'coin'} */
let currentView = "form";

// Persisted Form State
let quantity = "";
let price = selectedCoin?.current_price?.toString() || "0";
let date = now();
let fees = "";
let notes = "";
let showNotes = false;

// ─── Tab Button ────────────────────────────────────────────────────
const TabBtn = (value, label) => {
  const active = value === activeTab;
  return `
    <button
      data-tab="${value}"
      class="modal-tab flex-1 py-2 text-sm font-medium rounded-lg transition-all
        ${active
      ? "bg-slate-700 text-white shadow-sm ring-1 ring-white/10"
      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30"}"
      aria-label="Tipo de transacción: ${label}"
    >
      ${label}
    </button>
  `;
};

// ─── Main Form View ────────────────────────────────────────────────
const FormView = () => `
  <div id="add-asset-form-view">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-5 border-b border-slate-700/50 bg-[#151e32]/80 backdrop-blur-md">
      <h1 class="text-xl font-bold tracking-tight text-white">Add Transaction</h1>
      <button id="modal-close-btn" class="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-700/50 focus:outline-none" aria-label="Cerrar modal">
        <svg class="w-6 h-6">
          <use href="${sprite}#close"></use>
        </svg>
      </button>
    </header>

    <!-- Tabs -->
    <div class="px-6 pt-5">
      <div class="grid grid-cols-3 gap-1 p-1 bg-slate-800/50 rounded-xl">
        ${TabBtn("buy", "Buy")}
        ${TabBtn("sell", "Sell")}
        ${TabBtn("transfer", "Transfer")}
      </div>
    </div>

    <!-- Form fields -->
    <div class="p-6 space-y-5">
      <!-- Coin Selector -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Select Coin</label>
        <button id="coin-selector-btn" class="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-primary/50 transition-colors group focus:outline-none" aria-label="Seleccionar moneda">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <img src="${selectedCoin.image || selectedCoin.thumb}" alt="${selectedCoin.name}" class="w-5 h-5 rounded-full" />
            </div>
            <div class="flex flex-col items-start">
              <span class="font-bold text-white">${selectedCoin.name}</span>
              <span class="text-xs text-slate-400 font-medium">${selectedCoin.symbol.toUpperCase()}</span>
            </div>
          </div>
          <svg class="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors">
            <use href="${sprite}#chevron-down"></use>
          </svg>
        </button>
      </div>

      <!-- Quantity + Price -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Quantity</label>
          <div class="relative">
            <input id="quantity-input" type="number" min="0" placeholder="0.00" step="any" value="${quantity}" class="w-full pl-4 pr-14 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-display font-medium placeholder-slate-500 transition-all outline-none" aria-label="Cantidad" />
            <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span class="text-xs font-bold text-slate-400">${selectedCoin.symbol.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Price Per Coin</label>
            <button id="use-market-btn" class="text-[10px] text-primary hover:brightness-110 font-semibold transition-colors focus:outline-none" aria-label="Usar precio de mercado">Use Market</button>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span class="text-slate-400 font-medium">$</span>
            </div>
            <input id="price-input" type="number" min="0" value="${price}" step="any" class="w-full pl-8 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-display font-medium placeholder-slate-500 transition-all outline-none" aria-label="Precio por moneda" />
          </div>
        </div>
      </div>

      <!-- Date & Time -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Date & Time</label>
        <div class="relative">
          <input id="date-input" type="datetime-local" value="${date}" class="w-full pl-4 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none appearance-none [&::-webkit-calendar-picker-indicator]:invert" aria-label="Fecha y hora" />
        </div>
      </div>

      <!-- Exchange + Fees -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Exchange</label>
          <button id="exchange-selector-btn" class="w-full flex items-center px-3 py-3 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-primary/50 transition-colors group focus:outline-none" aria-label="Seleccionar exchange">
            ${selectedExchange
    ? selectedExchange.image
      ? `<img alt="${selectedExchange.name}" class="w-5 h-5 mr-3 rounded-full opacity-90" src="${selectedExchange.image}" />`
      : `<div class="w-5 h-5 mr-3 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-700">${(typeof selectedExchange === 'string' ? selectedExchange : selectedExchange.name).charAt(0).toUpperCase()}</div>`
    : `<div class="w-5 h-5 mr-3 rounded-full bg-slate-600 flex items-center justify-center"><svg class="w-3 h-3 text-slate-400"><use href="${sprite}#wallet"></use></svg></div>`
  }
            <span class="text-sm font-medium ${selectedExchange ? 'text-slate-200' : 'text-slate-500'}">${(typeof selectedExchange === 'string' ? selectedExchange : selectedExchange?.name) ?? 'Seleccionar caleta'}</span>
            <svg class="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors ml-auto">
              <use href="${sprite}#chevron-down"></use>
            </svg>
          </button>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Fees (Optional)</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span class="text-slate-400 font-medium text-sm">$</span>
            </div>
            <input id="fees-input" type="number" min="0" value="${fees}" placeholder="0.00" step="any" class="w-full pl-7 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none text-sm" aria-label="Comisiones" />
          </div>
        </div>
      </div>

      <!-- Notes toggle -->
      <div class="pt-1">
        <button id="add-notes-btn" class="flex items-center text-xs font-semibold text-slate-400 hover:text-primary transition-colors focus:outline-none" aria-label="Agregar notas">
          <svg class="w-4 h-4 mr-1">
            <use href="${sprite}#pencil"></use>
          </svg>
          Add Notes
        </button>
        <textarea id="notes-textarea" class="${showNotes ? '' : 'hidden'} mt-2 w-full p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none" rows="3" placeholder="Notes about this transaction..." aria-label="Notas">${notes}</textarea>
      </div>

      <!-- Total -->
      <div class="p-4 bg-slate-800/60 rounded-xl flex justify-between items-center border border-slate-700/50">
        <div class="flex flex-col">
          <span class="text-xs text-slate-400 font-medium">Total Spent</span>
          <span id="total-display" class="text-2xl font-bold font-display text-white tracking-tight">${formatUsd((parseFloat(quantity) || 0) * (parseFloat(price) || 0) + (parseFloat(fees) || 0))}</span>
        </div>
      </div>

      <!-- Submit -->
      <button
        id="submit-transaction-btn"
        class="w-full py-4 bg-primary-glow hover:brightness-110 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary-glow/20 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-base focus:outline-none"
        aria-label="Agregar transacción"
      >
        Add Transaction
      </button>
    </div>
  </div>
`;

// ─── Modal Container ───────────────────────────────────────────────

/**
 * Renders the full-screen modal overlay + content shell.
 * @returns {string}
 */
const AddAssetModal = () => `
  <!-- Backdrop -->
  <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-100 transition-opacity opacity-0 pointer-events-none" aria-hidden="true"></div>

  <!-- Modal -->
  <div
    id="add-asset-modal"
    class="fixed inset-0 z-101 flex items-center justify-center p-4 pointer-events-none opacity-0 transition-all duration-300"
    role="dialog"
    aria-modal="true"
    aria-label="Agregar transacción"
  >
    <div id="modal-content" class="relative w-full max-w-lg bg-[#151e32] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300 pointer-events-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div id="modal-inner"></div>
    </div>
  </div>

  <!-- Decorative blobs -->
  <div id="modal-blob-1" class="fixed top-1/4 left-1/4 w-64 h-64 bg-primary-glow/20 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none opacity-0 transition-opacity duration-500"></div>
  <div id="modal-blob-2" class="fixed bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none opacity-0 transition-opacity duration-500" style="animation-delay:700ms"></div>

  <!-- Add Exchange Modal shell -->
  ${AddExchangeModal()}
`;

// ─── Init Logic ────────────────────────────────────────────────────

/** Re-renders the inner content based on currentView */
const renderInner = () => {
  const inner = document.getElementById("modal-inner");
  if (!inner) return;

  if (currentView === "exchange") {
    inner.innerHTML = SelectExchange(selectedExchange?.id);
    wireExchangeView();
  } else if (currentView === "coin") {
    inner.innerHTML = CoinPicker(coins, selectedCoin.id);
    initCoinPicker({
        onBack: () => { currentView = "form"; renderInner(); },
        onClose: closeModal,
        onSelect: async (id) => {
            // Si la moneda seleccionada viene de búsqueda, podría no tener precio
            let found = coins.find((c) => c.id === id);
            
            // Si no tiene precio o no está en la lista inicial, buscamos los detalles completos
            if (!found || !found.current_price) {
                const detailedCoin = await getCoin(id);
                if (detailedCoin) {
                    found = detailedCoin;
                    // Opcionalmente actualizar la lista local para futuras referencias
                    if (!coins.find(c => c.id === id)) coins.push(detailedCoin);
                }
            }

            if (found) {
                selectedCoin = found;
                price = found.current_price?.toString() || "0";
                currentView = "form";
                renderInner();
            }
        },
        onCoinsUpdate: (newCoins) => { coins = newCoins; },
        currentCoins: coins,
        selectedCoinId: selectedCoin.id
    });
  } else {
    inner.innerHTML = FormView();
    wireFormView();
  }
};

const openModal = () => {
  currentView = "form";
  activeTab = "buy";
  // Reset form state on open
  quantity = "";
  price = selectedCoin?.current_price?.toString() || "0";
  date = now();
  fees = "";
  notes = "";
  showNotes = false;
  renderInner();

  const backdrop = document.getElementById("modal-backdrop");
  const modal = document.getElementById("add-asset-modal");
  const content = document.getElementById("modal-content");
  const blob1 = document.getElementById("modal-blob-1");
  const blob2 = document.getElementById("modal-blob-2");

  requestAnimationFrame(() => {
    backdrop?.classList.remove("opacity-0", "pointer-events-none");
    modal?.classList.remove("opacity-0", "pointer-events-none");
    content?.classList.remove("scale-95");
    content?.classList.add("scale-100");
    blob1?.classList.remove("opacity-0");
    blob2?.classList.remove("opacity-0");
    document.body.style.overflow = "hidden";
  });
};

const closeModal = () => {
  const backdrop = document.getElementById("modal-backdrop");
  const modal = document.getElementById("add-asset-modal");
  const content = document.getElementById("modal-content");
  const blob1 = document.getElementById("modal-blob-1");
  const blob2 = document.getElementById("modal-blob-2");

  backdrop?.classList.add("opacity-0", "pointer-events-none");
  modal?.classList.add("opacity-0", "pointer-events-none");
  content?.classList.remove("scale-100");
  content?.classList.add("scale-95");
  blob1?.classList.add("opacity-0");
  blob2?.classList.add("opacity-0");
  document.body.style.overflow = "";
};

// ─── Wire Form ─────────────────────────────────────────────────────
const wireFormView = () => {
  // Close button
  document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);

  // Tabs
  document.querySelectorAll(".modal-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = /** @type {'buy'|'sell'|'transfer'} */ (btn.dataset.tab);
      renderInner();
    });
  });

  // Coin selector → switch to coin picker view
  document.getElementById("coin-selector-btn")?.addEventListener("click", () => {
    currentView = "coin";
    renderInner();
  });

  // Exchange selector → switch to exchange view
  document.getElementById("exchange-selector-btn")?.addEventListener("click", () => {
    currentView = "exchange";
    renderInner();
  });

  // Notes toggle
  document.getElementById("add-notes-btn")?.addEventListener("click", () => {
    const ta = document.getElementById("notes-textarea");
    showNotes = !showNotes;
    ta?.classList.toggle("hidden");
    if (showNotes) ta?.focus();
  });

  // Use Market Price
  document.getElementById("use-market-btn")?.addEventListener("click", async () => {
    const marketPrice = selectedCoin.current_price;
    if (marketPrice) {
        price = marketPrice.toString();
        const priceInput = document.getElementById("price-input");
        if (priceInput) priceInput.value = price;
        updateTotal();
    }
  });

  // Input sync with state
  const qtyInput = document.getElementById("quantity-input");
  const priceInput = document.getElementById("price-input");
  const dateInput = document.getElementById("date-input");
  const feesInput = document.getElementById("fees-input");
  const notesTextarea = document.getElementById("notes-textarea");
  const totalDisplay = document.getElementById("total-display");

  const updateTotal = () => {
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(price) || 0;
    const f = parseFloat(fees) || 0;
    totalDisplay.textContent = formatUsd(q * p + f);
  };

  qtyInput?.addEventListener("input", (e) => {
    quantity = e.target.value;
    updateTotal();
  });
  priceInput?.addEventListener("input", (e) => {
    price = e.target.value;
    updateTotal();
  });
  dateInput?.addEventListener("input", (e) => {
    date = e.target.value;
  });
  feesInput?.addEventListener("input", (e) => {
    fees = e.target.value;
    updateTotal();
  });
  notesTextarea?.addEventListener("input", (e) => {
    notes = e.target.value;
  });

  // Submit
  document.getElementById("submit-transaction-btn")?.addEventListener("click", () => {
    // TODO: Actually persist the transaction
    closeModal();
  });
};

// ─── Wire Exchange View ────────────────────────────────────────────
const wireExchangeView = () => {
  document.getElementById("exchange-back-btn")?.addEventListener("click", () => {
    currentView = "form";
    renderInner();
  });

  document.getElementById("exchange-close-btn")?.addEventListener("click", closeModal);

  // Search filter
  document.getElementById("exchange-search-input")?.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll(".exchange-row").forEach((row) => {
      const name = row.dataset.exchangeName?.toLowerCase() ?? "";
      row.style.display = name.includes(term) ? "" : "none";
    });
  });

  // Select exchange
  document.querySelectorAll(".exchange-row").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.exchangeId;
      const sources = getSource().filter((s) => s !== DEFAULT_SOURCE);
      const found = sources.find((ex) => (typeof ex === 'string' ? ex : ex.id) === id);
      if (found) {
        selectedExchange = found;
        currentView = "form";
        renderInner();
      }
    });
  });
  // Add new exchange → open AddExchangeModal
  document.getElementById("add-new-exchange-btn")?.addEventListener("click", () => {
    openAddExchangeModal({
      onBack: () => {
        // Re-render exchange view after closing the add-exchange modal
        currentView = "exchange";
        renderInner();
      },
      onSave: (exchange) => {
        // Auto-select the newly added exchange using the shape from sources.js
        selectedExchange = {
          id: exchange.id,
          name: exchange.name,
          image: exchange.image ?? null,
          url: exchange.url ?? null,
          description: exchange.url ? new URL(exchange.url).hostname.replace('www.', '') : null,
        };
        currentView = "form";
        renderInner();
      },
    });
  });
};

// ─── Public Init ───────────────────────────────────────────────────

/**
 * Wires up the "Add Funds" button to open the modal.
 * Must be called after the DOM containing AddAssetModal() has been rendered.
 */
const initAddAssetModal = () => {
  // The "Add Funds" button has id="add-funds"
  document.getElementById("add-funds")?.addEventListener("click", openModal);

  // Close on backdrop click
  document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "modal-backdrop") closeModal();
  });

  // Close on Escape (only when AddExchangeModal is not open)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const addExchangeModal = document.getElementById("add-exchange-modal");
    const isAddExchangeOpen = addExchangeModal && !addExchangeModal.classList.contains("opacity-0");
    if (!isAddExchangeOpen) closeModal();
  });

  // Init Add Exchange modal (Escape key + backdrop)
  initAddExchangeModal();
};

export { initAddAssetModal };
export default AddAssetModal;
