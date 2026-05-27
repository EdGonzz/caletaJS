/**
 * @typedef {Object} PaginationOptions
 * @property {number} currentPage  - 1-indexed active page
 * @property {number} totalPages   - Total number of pages
 * @property {number} totalItems   - Total number of assets
 * @property {number} pageSize     - Items shown per page
 */

import sprite from "../assets/sprite.svg";

const Pagination = ({ currentPage, totalPages, totalItems, pageSize }) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const pageBtn = (page) => {
    const isActive = page === currentPage;
    return `
      <button
        class="hidden sm:flex size-8 items-center justify-center rounded-lg ${
          isActive
            ? "bg-primary text-slate-900 font-bold"
            : "text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
        } btn-press"
        aria-label="Ir a página ${page}"
        aria-current="${isActive ? "page" : "false"}"
        data-page="${page}"
      >${page}</button>`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => pageBtn(i + 1)).join("");

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return `
    <div class="flex items-center justify-between border-t border-slate-700/50 px-6 py-4 text-xs text-slate-400" role="navigation" aria-label="Paginación de holdings">
      <!-- Info: full on desktop, compact on mobile -->
      <span class="hidden sm:inline">Showing ${start} to ${end} of ${totalItems} assets</span>
      <span class="sm:hidden font-medium text-slate-300">${currentPage} / ${totalPages}</span>

      <div class="flex gap-1 items-center" role="group" aria-label="Navegación de páginas">
        <button
          class="flex size-8 items-center justify-center rounded-lg bg-slate-800 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 btn-press"
          aria-label="Ir a página anterior"
          ${isPrevDisabled ? 'disabled aria-disabled="true"' : ""}
          data-page="${currentPage - 1}"
        >
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#chevron-left"></use>
          </svg>
        </button>

        ${pages}

        <button
          class="flex size-8 items-center justify-center rounded-lg bg-slate-800 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 btn-press"
          aria-label="Ir a página siguiente"
          ${isNextDisabled ? 'disabled aria-disabled="true"' : ""}
          data-page="${currentPage + 1}"
        >
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#chevron-right"></use>
          </svg>
        </button>
      </div>
    </div>`;
};

export default Pagination;
