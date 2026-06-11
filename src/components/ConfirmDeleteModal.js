import sprite from '../assets/sprite.svg';
import { getErrorMessage } from '../utils/errors.js';

/** @type {(() => void) | null} */
let _onConfirmCallback = null;

export const closeConfirmDeleteModal = () => {
  const backdrop = document.getElementById('confirm-delete-backdrop');
  const modal = document.getElementById('confirm-delete-modal');
  const content = document.getElementById('confirm-delete-modal-content');

  backdrop?.classList.add('opacity-0', 'pointer-events-none');
  modal?.classList.add('opacity-0', 'pointer-events-none');
  content?.classList.add('pointer-events-none');
  content?.classList.remove('scale-100');
  content?.classList.add('scale-95');
  document.body.style.overflow = '';

  // Fix #10: limpiar callback para evitar retener referencias en memoria.
  _onConfirmCallback = null;
};

/**
 * Abre el modal de confirmación de eliminación.
 * @param {object} options
 * @param {string} options.title - El título del modal.
 * @param {string} options.message - El mensaje del cuerpo del modal.
 * @param {() => void} options.onConfirm - El callback a ejecutar al confirmar.
 */
export const openConfirmDeleteModal = ({ title, message, onConfirm }) => {
  // Fix #11: garantizar que onConfirm es una función antes de abrir el modal.
  if (typeof onConfirm !== 'function') {
    console.warn('[ConfirmDeleteModal] onConfirm debe ser una función válida.');
    return;
  }

  _onConfirmCallback = onConfirm;

  const titleEl = document.getElementById('confirm-delete-title');
  const messageEl = document.getElementById('confirm-delete-message');
  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;

  const backdrop = document.getElementById('confirm-delete-backdrop');
  const modal = document.getElementById('confirm-delete-modal');
  const content = document.getElementById('confirm-delete-modal-content');

  requestAnimationFrame(() => {
    backdrop?.classList.remove('opacity-0', 'pointer-events-none');
    modal?.classList.remove('opacity-0', 'pointer-events-none');
    content?.classList.remove('scale-95', 'pointer-events-none');
    content?.classList.add('scale-100');
    document.body.style.overflow = 'hidden';

    document.getElementById('confirm-delete-cancel-btn')?.focus();
  });
};

const ConfirmDeleteModal = () => `
  <!-- Backdrop -->
  <div
    id="confirm-delete-backdrop"
    class="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-150 transition-opacity opacity-0 pointer-events-none"
    aria-hidden="true"
  ></div>

  <!-- Modal -->
  <div
    id="confirm-delete-modal"
    class="fixed inset-0 z-151 flex items-center justify-center p-4 pointer-events-none opacity-0 transition-all duration-300"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-delete-title"
    aria-describedby="confirm-delete-message"
  >
    <div
      id="confirm-delete-modal-content"
      class="relative w-full max-w-md bg-surface-overlay rounded-2xl border border-slate-700/80 shadow-2xl p-6 transform scale-95 transition-all duration-300 pointer-events-none flex flex-col gap-4"
    >
      <div class="flex items-start gap-4">
        <div class="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 text-rose-500">
          <svg class="w-5 h-5" aria-hidden="true"><use href="${sprite}#trash"></use></svg>
        </div>
        <div class="space-y-1">
          <h3 id="confirm-delete-title" class="text-white text-lg font-bold">Confirmar Eliminación</h3>
          <p id="confirm-delete-message" class="text-slate-400 text-sm leading-normal">¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 mt-2 shrink-0">
        <button
          id="confirm-delete-cancel-btn"
          class="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700/80 rounded-lg text-slate-300 text-sm font-bold transition-all btn-press"
          aria-label="Cancelar y volver"
        >
          Cancelar
        </button>
        <button
          id="confirm-delete-confirm-btn"
          class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-lg transition-all btn-press shadow-lg shadow-rose-500/10"
          aria-label="Confirmar eliminación permanente"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
`;

/** @type {((e: KeyboardEvent) => void) | null} */
let _keydownHandler = null;
/** @type {((e: MouseEvent) => void) | null} */
let _backdropHandler = null;
/** @type {(() => void) | null} */
let _cancelHandler = null;
/** @type {(() => void) | null} */
let _confirmHandler = null;

export const initConfirmDeleteModal = () => {
  cleanupConfirmDeleteModal();

  _keydownHandler = (e) => {
    const modal = document.getElementById('confirm-delete-modal');
    if (modal?.classList.contains('opacity-0')) return;

    if (e.key === 'Escape') {
      closeConfirmDeleteModal();
      return;
    }

    // Fix #9: focus trap — mantiene el foco dentro del modal con Tab/Shift+Tab.
    if (e.key === 'Tab') {
      const content = document.getElementById('confirm-delete-modal-content');
      if (!content) return;

      const focusable = /** @type {NodeListOf<HTMLElement>} */ (
        content.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
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

  _backdropHandler = (e) => {
    if (/** @type {HTMLElement} */(e.target).id === 'confirm-delete-modal') closeConfirmDeleteModal();
  };
  document.getElementById('confirm-delete-modal')?.addEventListener('click', _backdropHandler);

  // Fix #3: guardar referencias nombradas para poder limpiarlas en cleanup.
  const cancelBtn = document.getElementById('confirm-delete-cancel-btn');
  const confirmBtn = document.getElementById('confirm-delete-confirm-btn');

  cancelBtn?.addEventListener('click', _cancelHandler = closeConfirmDeleteModal);

  // Fix #12: try/finally garantiza que el modal siempre se cierra aunque el callback lance.
  confirmBtn?.addEventListener('click', _confirmHandler = () => {
    try {
      _onConfirmCallback?.();
    } catch (error) {
      console.error('Error en el callback de confirmación:', error);
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: { message: getErrorMessage(error) } }));
    } finally {
      closeConfirmDeleteModal();
    }
  });
};

export const cleanupConfirmDeleteModal = () => {
  if (_keydownHandler) {
    document.removeEventListener('keydown', _keydownHandler);
    _keydownHandler = null;
  }
  if (_backdropHandler) {
    const modal = document.getElementById('confirm-delete-modal');
    if (modal) modal.removeEventListener('click', _backdropHandler);
    _backdropHandler = null;
  }
  // Fix #3: remover listeners nombrados de cancel y confirm.
  if (_cancelHandler) {
    document.getElementById('confirm-delete-cancel-btn')?.removeEventListener('click', _cancelHandler);
    _cancelHandler = null;
  }
  if (_confirmHandler) {
    document.getElementById('confirm-delete-confirm-btn')?.removeEventListener('click', _confirmHandler);
    _confirmHandler = null;
  }
};

export default ConfirmDeleteModal;
