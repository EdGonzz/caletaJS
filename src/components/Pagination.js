/**
 * @typedef {Object} PaginationOptions
 * @property {number} currentPage  - 1-indexed active page
 * @property {number} totalPages   - Total number of pages
 * @property {number} totalItems   - Total number of assets
 * @property {number} pageSize     - Items shown per page
 */

/**
 * Pagination — renders the bottom nav bar for the Holdings table.
 * @param {PaginationOptions} opts
 * @returns {string}
 */

import sprite from "../assets/sprite.svg";

const Pagination = ({ currentPage, totalPages, totalItems, pageSize }) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  /** @param {number} page */
  const pageBtn = (page) => {
    const isActive = page === currentPage;
    return `
      <button
        class="${
          isActive
            ? "bg-primary text-background-dark flex size-8 items-center justify-center rounded font-bold"
            : "flex size-8 items-center justify-center rounded bg-slate-800 text-white transition-colors hover:bg-slate-700"
        }"
        aria-label="Go to page ${page}"
        aria-current="${isActive ? "page" : "false"}"
        data-page="${page}"
      >${page}</button>`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => pageBtn(i + 1)).join("");

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return `
    <div class="flex items-center justify-between border-t border-slate-700/50 px-6 py-4 text-xs text-slate-400" role="navigation" aria-label="Holdings pagination">
      <span>Showing ${start} to ${end} of ${totalItems} assets</span>
      <div class="flex gap-1" role="group" aria-label="Page navigation">
        <button
          class="flex size-8 items-center justify-center rounded bg-slate-800 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to previous page"
          ${isPrevDisabled ? "disabled" : ""}
          data-page="${currentPage - 1}"
        >
          <svg class="h-4 w-4" aria-hidden="true">
            <use href="${sprite}#chevron-left"></use>
          </svg>
        </button>

        ${pages}

        <button
          class="flex size-8 items-center justify-center rounded bg-slate-800 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Go to next page"
          ${isNextDisabled ? "disabled" : ""}
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
