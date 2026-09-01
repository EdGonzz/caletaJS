// src/components/EditTransactionModal.js
import sprite from '../assets/sprite.svg';
import { SelectExchange } from './SelectExchange.js';
import { getSource, DEFAULT_SOURCE } from '../utils/sources.js';
import { now } from '../utils/formatters.js';
import { escapeHTML, sanitizeNumericInput } from '../utils/helpers.js';
import { showWarning, showError } from './ErrorToast.js';
import AddExchangeModal, { openAddExchangeModal, initAddExchangeModal, cleanupAddExchangeModal } from './AddExchangeModal.js';
import {
  getAvailableBalanceExcluding,
  getAvailableBalanceExcludingTransfer,
  getNetBalance,
  stripTransferNotesPrefix,
} from '../utils/transactionUtils.js';

/**
 * Mapa de tipo de transacción a configuración visual del badge.
 * @type {Record<string, { label: string, cls: string, dot: string }>}
 */
const TYPE_CONFIG = {
  buy: { label: 'Compra', cls: 'tx-badge--buy', dot: 'tx-dot--green' },
  sell: { label: 'Venta', cls: 'tx-badge--sell', dot: 'tx-dot--red' },
  transfer_in: { label: 'Recibida', cls: 'tx-badge--transfer-in', dot: 'tx-dot--sky' },
  transfer_out: { label: 'Enviada', cls: 'tx-badge--transfer-out', dot: 'tx-dot--amber' },
};

// ─── State ─────────────────────────────────────────────────────────
/** @type {Object|null} */
let _tx = null;
/** @type {Object|null} */
let _pairedTx = null;
/** @type {Object|null} */
let _outTx = null;
/** @type {Object|null} */
let _inTx = null;
/** @type {(updates: Object) => void | null} */
let _onSave = null;
/** @type {HTMLElement | null} */
let _lastFocusedEl = null;

/** @type {'form'|'exchange'|'destination-exchange'} */
let _currentView = 'form';

// Valores editables (prefijados al abrir)
let _qty = '';
let _price = '';
let _date = '';
let _fees = '';
let _networkFee = '';
let _notes = '';
let _showNotes = false;
let _sourceName = '';
let _sourceImage = null;
let _destName = '';
let _destImage = null;

// ─── Helpers de fuentes ────────────────────────────────────────────
const getSources = () => getSource().filter((s) => s !== DEFAULT_SOURCE);
const sourceName = (s) => (typeof s === 'string' ? s : s.name);
const sourceImage = (s) => (s && typeof s === 'object' && s.image ? s.image : null);
const findSourceByName = (name) => getSources().find((s) => sourceName(s) === name) ?? null;

const isTransfer = () => _tx?.type === 'transfer_in' || _tx?.type === 'transfer_out';
const isSell = () => _tx?.type === 'sell';

const symbolUpper = () => (_tx?.symbol ?? '').toUpperCase();

// ─── Form View ─────────────────────────────────────────────────────
const FormView = () => {
  const config = TYPE_CONFIG[_tx?.type] ?? { label: _tx?.type ?? '', cls: 'tx-badge--default', dot: 'tx-dot--default' };
  const symbol = symbolUpper();
  const coinName = _tx?.name ?? '';
  const logo = _tx?.logoUrl ?? '';
  const transfer = isTransfer();

  const exchangeBtn = (id, name, image, label, ariaLabel) => `
    <button type="button" id="${id}" class="w-full flex items-center px-3 py-3 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-primary/50 transition-colors group" aria-label="${ariaLabel}">
      ${image
    ? `<img alt="${escapeHTML(name)}" class="w-5 h-5 mr-3 rounded-full opacity-90" src="${escapeHTML(image)}" width="20" height="20" loading="lazy" />`
    : name
      ? `<div class="w-5 h-5 mr-3 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-slate-700">${escapeHTML((name.charAt(0) || '?').toUpperCase())}</div>`
      : `<div class="w-5 h-5 mr-3 rounded-full bg-slate-600 flex items-center justify-center"><svg class="w-3 h-3 text-slate-400"><use href="${sprite}#wallet"></use></svg></div>`
  }
      <span class="text-sm font-medium ${name ? 'text-slate-200' : 'text-slate-500'}">${escapeHTML(name || label)}</span>
      <svg class="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors ml-auto">
        <use href="${sprite}#chevron-down"></use>
      </svg>
    </button>
  `;

  const destinoRecibe = (() => {
    const q = parseFloat(_qty) || 0;
    const nf = parseFloat(_networkFee) || 0;
    return Math.max(0, q - nf);
  })();

  return `
  <div id="edit-tx-form-view">
    <header class="flex items-center justify-between px-6 py-5 border-b border-slate-700/50 bg-[#151e32]/80 backdrop-blur-md">
      <div class="flex items-center gap-3 min-w-0">
        <span class="tx-badge ${config.cls}" aria-label="Tipo de transacción">${escapeHTML(config.label)}</span>
        <div class="flex items-center gap-2 min-w-0">
          ${logo
    ? `<img src="${escapeHTML(logo)}" alt="${escapeHTML(coinName)}" class="w-6 h-6 rounded-full object-contain" width="24" height="24" loading="lazy" />`
    : `<div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">${escapeHTML((symbol.charAt(0) || '?').toUpperCase())}</div>`
  }
          <div class="min-w-0">
            <p class="text-sm font-bold text-white truncate">${escapeHTML(coinName)}</p>
            <p class="text-xs text-slate-400 font-medium">${escapeHTML(symbol)}</p>
          </div>
        </div>
      </div>
      <button type="button" id="edit-tx-close-btn" class="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-700/50 focus:outline-none" aria-label="Cerrar modal">
        <svg class="w-6 h-6"><use href="${sprite}#close"></use></svg>
      </button>
    </header>

    <div class="p-6 space-y-5">
      <!-- Cantidad -->
      <div class="space-y-2">
        <label for="edit-tx-qty-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">${transfer ? 'Cantidad a enviar' : 'Cantidad'}</label>
        <div class="relative">
          <input id="edit-tx-qty-input" type="text" inputmode="decimal" placeholder="0.00" value="${escapeHTML(_qty)}" class="w-full pl-4 pr-14 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-display font-medium placeholder-slate-500 transition-all outline-none" aria-label="Cantidad" />
          <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <span class="text-xs font-bold text-slate-400">${escapeHTML(symbol)}</span>
          </div>
        </div>
      </div>

      ${transfer ? `
        <!-- Precio (cost basis) read-only -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Precio (cost basis)</label>
          <div class="w-full px-4 py-3 bg-slate-800/20 border border-slate-700/50 rounded-xl text-white font-display font-medium tabular-nums cursor-default" aria-label="Precio por moneda (solo lectura)">${escapeHTML(_price || '—')}</div>
        </div>
      ` : `
        <!-- Precio -->
        <div class="space-y-2">
          <label for="edit-tx-price-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Precio por moneda</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <span class="text-slate-400 font-medium">$</span>
            </div>
            <input id="edit-tx-price-input" type="text" inputmode="decimal" placeholder="0.00" value="${escapeHTML(_price)}" class="w-full pl-8 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-display font-medium placeholder-slate-500 transition-all outline-none" aria-label="Precio por moneda" />
          </div>
        </div>
      `}

      <!-- Fecha -->
      <div class="space-y-2">
        <label for="edit-tx-date-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Fecha y hora</label>
        <input id="edit-tx-date-input" type="datetime-local" value="${escapeHTML(_date)}" class="w-full pl-4 pr-4 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none appearance-none [&::-webkit-calendar-picker-indicator]:invert" aria-label="Fecha y hora" />
      </div>

      <!-- Exchange / Caleta origen -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">${transfer ? 'Caleta origen' : 'Exchange'}</label>
        ${exchangeBtn('edit-tx-source-btn', _sourceName, _sourceImage, 'Seleccionar caleta', 'Seleccionar caleta de origen')}
      </div>

      ${transfer ? `
        <!-- Network Fee -->
        <div class="space-y-2">
          <label for="edit-tx-network-fee-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Network Fee</label>
          <div class="relative">
            <input id="edit-tx-network-fee-input" type="text" inputmode="decimal" value="${escapeHTML(_networkFee)}" placeholder="0.00" class="w-full pl-4 pr-14 py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none text-sm" aria-label="Comisión de red en la moneda" />
            <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <span class="text-xs font-bold text-slate-400">${escapeHTML(symbol)}</span>
            </div>
          </div>
        </div>

        <!-- Destino recibe -->
        <div id="edit-tx-destino-recibe-block" class="p-3 bg-slate-800/30 rounded-xl border border-slate-700/30 ${!parseFloat(_qty) ? 'hidden' : ''}">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-400 font-medium">Destino recibe</span>
            <span id="edit-tx-destino-recibe-value" class="text-sm font-semibold text-white tabular-nums">${destinoRecibe.toFixed(8)} ${escapeHTML(symbol)}</span>
          </div>
        </div>

        <!-- Caleta destino -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Caleta destino</label>
          ${exchangeBtn('edit-tx-dest-btn', _destName, _destImage, 'Seleccionar destino', 'Seleccionar caleta de destino')}
        </div>
      ` : `
        <!-- Fees -->
        <div class="space-y-2">
          <label for="edit-tx-fees-input" class="block text-xs font-semibold uppercase tracking-wider text-slate-400">${isSell() ? 'Fees (en la moneda)' : 'Fees (USD)'}</label>
          <div class="relative">
            ${isSell() ? '' : '<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><span class="text-slate-400 font-medium text-sm">$</span></div>'}
            <input id="edit-tx-fees-input" type="text" inputmode="decimal" value="${escapeHTML(_fees)}" placeholder="0.00" class="w-full ${isSell() ? 'pl-4 pr-14' : 'pl-7 pr-4'} py-3 bg-slate-800/40 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-white font-medium placeholder-slate-500 transition-all outline-none text-sm" aria-label="Comisiones" />
            ${isSell() ? `<div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><span class="text-xs font-bold text-slate-400">${escapeHTML(symbol)}</span></div>` : ''}
          </div>
        </div>
      `}

      <!-- Notas -->
      <div class="pt-1">
        <button type="button" id="edit-tx-notes-btn" class="flex items-center text-xs font-semibold text-slate-400 hover:text-primary transition-colors" aria-label="${_showNotes ? 'Ocultar notas' : 'Agregar notas'}" aria-expanded="${_showNotes ? 'true' : 'false'}">
          <svg class="w-4 h-4 mr-1"><use href="${sprite}#pencil"></use></svg>
          Notas
        </button>
        <textarea id="edit-tx-notes-textarea" class="${_showNotes ? '' : 'hidden'} mt-2 w-full p-3 bg-slate-800/40 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none" rows="3" placeholder="Notas sobre esta transacción..." aria-label="Notas">${escapeHTML(_notes)}</textarea>
      </div>

      <!-- Submit -->
      <button type="button" id="edit-tx-submit-btn" class="w-full py-4 mt-4 bg-primary hover:brightness-110 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl active:scale-[0.99] transition-all duration-200 text-base btn-press" aria-label="Guardar cambios">
        Guardar cambios
      </button>
    </div>
  </div>
  `;
};

// ─── Modal Container ───────────────────────────────────────────────
const EditTransactionModal = () => `
  <div id="edit-tx-backdrop" class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-150 transition-opacity opacity-0 pointer-events-none" aria-hidden="true"></div>

  <div id="edit-tx-modal" class="fixed inset-0 z-151 flex items-center justify-center p-4 pointer-events-none opacity-0 transition-all duration-300" role="dialog" aria-modal="true" aria-label="Editar transacción">
    <div id="edit-tx-modal-content" class="relative w-full max-w-lg bg-[#151e32] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transform scale-95 transition-all duration-300 pointer-events-none max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div id="edit-tx-modal-inner"></div>
    </div>
  </div>

  <!-- Add Exchange Modal shell -->
  ${AddExchangeModal()}
`;

// ─── Init Logic ────────────────────────────────────────────────────
const renderInner = () => {
  const inner = document.getElementById('edit-tx-modal-inner');
  if (!inner) return;

  if (_currentView === 'exchange') {
    inner.innerHTML = SelectExchange(_sourceName);
    wireExchangeView();
    document.getElementById('exchange-search-input')?.focus();
  } else if (_currentView === 'destination-exchange') {
    inner.innerHTML = SelectExchange(_destName);
    wireDestExchangeView();
    document.getElementById('exchange-search-input')?.focus();
  } else {
    inner.innerHTML = FormView();
    wireFormView();
    document.getElementById('edit-tx-qty-input')?.focus();
  }
};

export const openEditTransactionModal = ({ tx, pairedTx = null, onSave }) => {
  if (!tx) {
    console.warn('[EditTransactionModal] tx es requerido.');
    return;
  }

  _tx = tx;
  _pairedTx = pairedTx;
  _onSave = typeof onSave === 'function' ? onSave : null;
  _lastFocusedEl = /** @type {HTMLElement | null} */ (document.activeElement);

  // Normalizar piernas para transferencias
  if (tx.type === 'transfer_out') {
    _outTx = tx;
    _inTx = pairedTx ?? null;
  } else if (tx.type === 'transfer_in') {
    _outTx = pairedTx ?? null;
    _inTx = tx;
  } else {
    _outTx = null;
    _inTx = null;
  }

  const transfer = isTransfer();

  _qty = transfer
    ? String(_outTx?.balance ?? tx.balance ?? '')
    : String(tx.balance ?? '');
  _price = transfer
    ? String(_outTx?.price ?? _inTx?.price ?? tx.price ?? '')
    : String(tx.price ?? '');
  _date = transfer
    ? (_outTx?.date ?? _inTx?.date ?? tx.date ?? now())
    : (tx.date ?? now());
  _fees = tx.fees ? String(tx.fees) : '';
  const rawNetworkFee = transfer ? (_outTx?.networkFee ?? _inTx?.networkFee ?? 0) : 0;
  _networkFee = rawNetworkFee ? String(rawNetworkFee) : '';
  _notes = stripTransferNotesPrefix(
    transfer ? (_outTx?.notes ?? _inTx?.notes ?? tx.notes ?? '') : (tx.notes ?? '')
  );
  _showNotes = Boolean(_notes);

  _sourceName = transfer ? (_outTx?.source ?? tx.source ?? '') : (tx.source ?? '');
  _sourceImage = transfer ? (_outTx?.sourceImage ?? tx.sourceImage ?? null) : (tx.sourceImage ?? null);
  _destName = transfer ? (_inTx?.source ?? '') : '';
  _destImage = transfer ? (_inTx?.sourceImage ?? null) : null;

  _currentView = 'form';
  renderInner();

  const backdrop = document.getElementById('edit-tx-backdrop');
  const modal = document.getElementById('edit-tx-modal');
  const content = document.getElementById('edit-tx-modal-content');

  requestAnimationFrame(() => {
    backdrop?.classList.remove('opacity-0', 'pointer-events-none');
    modal?.classList.remove('opacity-0', 'pointer-events-none');
    content?.classList.remove('scale-95', 'pointer-events-none');
    content?.classList.add('scale-100');
    document.body.style.overflow = 'hidden';

    document.getElementById('edit-tx-qty-input')?.focus();
  });
};

export const closeEditTransactionModal = () => {
  const backdrop = document.getElementById('edit-tx-backdrop');
  const modal = document.getElementById('edit-tx-modal');
  const content = document.getElementById('edit-tx-modal-content');

  backdrop?.classList.add('opacity-0', 'pointer-events-none');
  modal?.classList.add('opacity-0', 'pointer-events-none');
  content?.classList.add('pointer-events-none');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  document.body.style.overflow = '';

  // Restaurar foco al elemento que abrió el modal (o al contenedor como fallback)
  const target = _lastFocusedEl?.isConnected ? _lastFocusedEl : null;
  if (target) {
    target.focus();
  } else {
    content?.setAttribute('tabindex', '-1');
    content?.focus();
    content?.removeAttribute('tabindex');
  }

  _onSave = null;
  _lastFocusedEl = null;
};

// ─── Wire Form ─────────────────────────────────────────────────────
const wireFormView = () => {
  document.getElementById('edit-tx-close-btn')?.addEventListener('click', closeEditTransactionModal);

  document.getElementById('edit-tx-source-btn')?.addEventListener('click', () => {
    _currentView = 'exchange';
    renderInner();
  });

  document.getElementById('edit-tx-dest-btn')?.addEventListener('click', () => {
    _currentView = 'destination-exchange';
    renderInner();
  });

  document.getElementById('edit-tx-notes-btn')?.addEventListener('click', () => {
    const ta = document.getElementById('edit-tx-notes-textarea');
    _showNotes = !_showNotes;
    ta?.classList.toggle('hidden');
    if (_showNotes) ta?.focus();
  });

  const qtyInput = document.getElementById('edit-tx-qty-input');
  const priceInput = document.getElementById('edit-tx-price-input');
  const dateInput = document.getElementById('edit-tx-date-input');
  const feesInput = document.getElementById('edit-tx-fees-input');
  const networkFeeInput = document.getElementById('edit-tx-network-fee-input');
  const notesTextarea = document.getElementById('edit-tx-notes-textarea');

  qtyInput?.addEventListener('input', () => {
    _qty = sanitizeNumericInput(qtyInput);
    _updateDestinoRecibe();
  });
  priceInput?.addEventListener('input', () => {
    _price = sanitizeNumericInput(priceInput);
  });
  dateInput?.addEventListener('input', (e) => {
    _date = e.target.value;
  });
  feesInput?.addEventListener('input', () => {
    _fees = sanitizeNumericInput(feesInput);
  });
  networkFeeInput?.addEventListener('input', () => {
    _networkFee = sanitizeNumericInput(networkFeeInput);
    _updateDestinoRecibe();
  });
  notesTextarea?.addEventListener('input', (e) => {
    _notes = e.target.value;
  });

  document.getElementById('edit-tx-submit-btn')?.addEventListener('click', handleSave);
};

const _updateDestinoRecibe = () => {
  const block = document.getElementById('edit-tx-destino-recibe-block');
  const valueEl = document.getElementById('edit-tx-destino-recibe-value');
  if (!block || !valueEl) return;

  const q = parseFloat(_qty) || 0;
  const nf = parseFloat(_networkFee) || 0;
  const dest = Math.max(0, q - nf);

  if (q > 0) {
    block.classList.remove('hidden');
    valueEl.textContent = `${dest.toFixed(8)} ${symbolUpper()}`;
  } else {
    block.classList.add('hidden');
  }
};

// ─── Wire Exchange Views ───────────────────────────────────────────
const wireExchangeView = () => {
  document.getElementById('exchange-back-btn')?.addEventListener('click', () => {
    _currentView = 'form';
    renderInner();
  });
  document.getElementById('exchange-close-btn')?.addEventListener('click', closeEditTransactionModal);

  document.getElementById('exchange-search-input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.exchange-row').forEach((row) => {
      const name = row.dataset.exchangeName?.toLowerCase() ?? '';
      row.style.display = name.includes(term) ? '' : 'none';
    });
  });

  document.querySelectorAll('.exchange-row').forEach((row) => {
    row.addEventListener('click', () => {
      const name = row.dataset.exchangeName;
      if (!name) return;
      _sourceName = name;
      _sourceImage = sourceImage(findSourceByName(name));
      _currentView = 'form';
      renderInner();
    });
  });

  document.getElementById('add-new-exchange-btn')?.addEventListener('click', () => {
    openAddExchangeModal({
      onBack: () => { _currentView = 'exchange'; renderInner(); },
      onSave: (exchange) => {
        _sourceName = exchange.name;
        _sourceImage = exchange.image ?? null;
        _currentView = 'form';
        renderInner();
      },
    });
  });
};

const wireDestExchangeView = () => {
  document.getElementById('exchange-back-btn')?.addEventListener('click', () => {
    _currentView = 'form';
    renderInner();
  });
  document.getElementById('exchange-close-btn')?.addEventListener('click', closeEditTransactionModal);

  document.getElementById('exchange-search-input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.exchange-row').forEach((row) => {
      const name = row.dataset.exchangeName?.toLowerCase() ?? '';
      row.style.display = name.includes(term) ? '' : 'none';
    });
  });

  document.querySelectorAll('.exchange-row').forEach((row) => {
    row.addEventListener('click', () => {
      const name = row.dataset.exchangeName;
      if (!name) return;
      _destName = name;
      _destImage = sourceImage(findSourceByName(name));
      _currentView = 'form';
      renderInner();
    });
  });

  document.getElementById('add-new-exchange-btn')?.addEventListener('click', () => {
    openAddExchangeModal({
      onBack: () => { _currentView = 'destination-exchange'; renderInner(); },
      onSave: (exchange) => {
        _destName = exchange.name;
        _destImage = exchange.image ?? null;
        _currentView = 'form';
        renderInner();
      },
    });
  });
};

// ─── Save / Validación ─────────────────────────────────────────────
const handleSave = () => {
  const transfer = isTransfer();
  const parsedQty = parseFloat(_qty);
  const parsedPrice = parseFloat(_price);
  const parsedFees = parseFloat(_fees) || 0;
  const parsedNetworkFee = parseFloat(_networkFee) || 0;

  if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
    showWarning('La cantidad debe ser mayor a 0.');
    return;
  }

  if (transfer) {
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showWarning('No se pudo determinar el precio (cost basis) de la transferencia.');
      return;
    }
    if (parsedNetworkFee >= parsedQty) {
      showWarning('La comisión de red no puede ser mayor o igual a la cantidad enviada.');
      return;
    }
    if (!_destName) {
      showWarning('Selecciona una caleta de destino para la transferencia.');
      return;
    }
    if (_sourceName === _destName) {
      showWarning('La caleta de destino debe ser distinta a la caleta de origen.');
      return;
    }
  } else {
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      showWarning('Por favor completa los campos obligatorios: cantidad y precio.');
      return;
    }
    if (isSell() && parsedFees > parsedQty) {
      showWarning('La comisión no puede ser mayor a la cantidad de monedas vendidas.');
      return;
    }
  }

  // Overselling (sell / transfer_out) — validar contra el source EFECTIVO seleccionado
  if (isSell() || transfer) {
    const balanceTx = transfer ? (_outTx ?? _tx) : _tx;
    const effectiveSource = _sourceName;
    let available;
    if (effectiveSource === balanceTx.source) {
      available = getAvailableBalanceExcluding(balanceTx);
    } else if (transfer) {
      available = getAvailableBalanceExcludingTransfer(_tx.coinId, effectiveSource, _tx.transferId);
    } else {
      available = getNetBalance(_tx.coinId, effectiveSource);
    }
    if (parsedQty > available) {
      showError(`Balance insuficiente. Disponible: ${available.toFixed(8)} ${symbolUpper()}`);
      return;
    }
  }

  const updates = transfer
    ? {
      qty: parsedQty,
      networkFee: parsedNetworkFee,
      price: parsedPrice,
      date: _date,
      source: _sourceName,
      destSource: _destName,
      notes: _notes,
      sourceImage: _sourceImage ?? null,
      destSourceImage: _destImage ?? null,
    }
    : {
      qty: parsedQty,
      price: parsedPrice,
      date: _date,
      source: _sourceName,
      fees: parsedFees,
      notes: _notes,
      sourceImage: _sourceImage ?? null,
    };

  try {
    if (_onSave) _onSave(updates);
  } catch (error) {
    console.error('Error en el callback de guardado de transacción:', error);
    showError('No se pudo guardar la transacción. Intenta de nuevo.');
    return;
  }

  closeEditTransactionModal();
};

// ─── Public Init / Cleanup ─────────────────────────────────────────
/** @type {((e: KeyboardEvent) => void) | null} */
let _keydownHandler = null;
/** @type {((e: MouseEvent) => void) | null} */
let _backdropHandler = null;

export const initEditTransactionModal = () => {
  cleanupEditTransactionModal();

  _backdropHandler = (e) => {
    if (/** @type {HTMLElement} */(e.target).id === 'edit-tx-modal') closeEditTransactionModal();
  };
  document.getElementById('edit-tx-modal')?.addEventListener('click', _backdropHandler);

  _keydownHandler = (e) => {
    const modal = document.getElementById('edit-tx-modal');
    if (!modal || modal.classList.contains('opacity-0')) return;

    // Si el sub-modal AddExchangeModal está abierto, no interceptar Escape
    // (su propio handler lo cierra; evita volver al form del edit modal)
    const addExchangeModal = document.getElementById('add-exchange-modal');
    const isAddExchangeOpen = addExchangeModal && !addExchangeModal.classList.contains('opacity-0');
    if (isAddExchangeOpen) return;

    if (e.key === 'Escape') {
      if (_currentView !== 'form') {
        _currentView = 'form';
        renderInner();
      } else {
        closeEditTransactionModal();
      }
      return;
    }

    if (e.key === 'Tab') {
      const content = document.getElementById('edit-tx-modal-content');
      if (!content) return;

      const focusable = /** @type {NodeListOf<HTMLElement>} */ (
        content.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
  };
  document.addEventListener('keydown', _keydownHandler);

  initAddExchangeModal();
};

export const cleanupEditTransactionModal = () => {
  if (_keydownHandler) {
    document.removeEventListener('keydown', _keydownHandler);
    _keydownHandler = null;
  }
  if (_backdropHandler) {
    document.getElementById('edit-tx-modal')?.removeEventListener('click', _backdropHandler);
    _backdropHandler = null;
  }
  document.body.style.overflow = '';
  _currentView = 'form';
  _lastFocusedEl = null;

  cleanupAddExchangeModal();
};

export default EditTransactionModal;
