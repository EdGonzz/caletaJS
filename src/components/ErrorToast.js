/**
 * @fileoverview ErrorToast — componente de notificaciones no-bloqueantes.
 * Monta toasts flotantes en #app-error-toast.
 * API pública: showError(message, type?, duration?) y showSuccess(message, duration?)
 */

import { ErrorType } from '../utils/errors.js';
import { escapeHTML } from '../utils/helpers';

/** @type {HTMLElement | null} */
let _container = null;

/**
 * Obtiene o inicializa el contenedor del toast.
 * @returns {HTMLElement | null}
 */
const getContainer = () => {
  if (!_container) {
    _container = document.getElementById('app-error-toast');
  }
  return _container;
};

/**
 * Devuelve los colores y el icono SVG según el tipo de toast.
 * @param {'error'|'warning'|'success'|'info'} variant
 * @returns {{ bg: string, border: string, text: string, icon: string }}
 */
const getVariantStyles = (variant) => {
  switch (variant) {
    case 'success':
      return {
        bg: 'rgba(11, 213, 112, 0.1)',
        border: 'rgba(11, 213, 112, 0.3)',
        text: '#0bd570',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>`,
      };
    case 'warning':
      return {
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        text: '#f59e0b',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>`,
      };
    case 'info':
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgba(59, 130, 246, 0.3)',
        text: '#3b82f6',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>`,
      };
    default: // 'error'
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        text: '#ef4444',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>`,
      };
  }
};

/**
 * Muestra un toast de notificación.
 *
 * @param {string} message - Mensaje para el usuario
 * @param {'error'|'warning'|'success'|'info'} [variant='error']
 * @param {number} [duration=5000] - ms antes de autodismiss (0 = manual)
 */
export const showToast = (message, variant = 'error', duration = 5000) => {
  const container = getContainer();
  if (!container) return;

  const styles = getVariantStyles(variant);

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.875rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid ${styles.border};
    background: ${styles.bg};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  `;

  toast.innerHTML = `
    <span style="color: ${styles.text}; flex-shrink: 0; margin-top: 1px;">
      ${styles.icon}
    </span>
    <p style="
      font-size: 0.8125rem;
      font-weight: 500;
      color: #cbd5e1;
      line-height: 1.4;
      flex: 1;
      margin: 0;
    ">${escapeHTML(message)}</p>
    <button
      aria-label="Cerrar notificación"
      style="
        color: #64748b;
        background: none;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
        padding: 0;
        line-height: 1;
        transition: color 0.15s;
      "
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  /** Dismiss con animación */
  const dismiss = () => {
    toast.classList.add('toast-dismissing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const closeBtn = toast.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('click', dismiss);
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = '#94a3b8';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = '#64748b';
    });
  }

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
};

/**
 * Muestra un toast de error.
 * @param {string} message
 * @param {number} [duration=6000]
 */
export const showError = (message, duration = 6000) => {
  showToast(message, 'error', duration);
};

/**
 * Muestra un toast de advertencia.
 * @param {string} message
 * @param {number} [duration=5000]
 */
export const showWarning = (message, duration = 5000) => {
  showToast(message, 'warning', duration);
};

/**
 * Muestra un toast de éxito.
 * @param {string} message
 * @param {number} [duration=3000]
 */
export const showSuccess = (message, duration = 3000) => {
  showToast(message, 'success', duration);
};

/**
 * Muestra un toast de información.
 * @param {string} message
 * @param {number} [duration=4000]
 */
export const showInfo = (message, duration = 4000) => {
  showToast(message, 'info', duration);
};
