import AssetRow from "./AssetRow";
import Pagination from "./Pagination";
import holdings from "../utils/holdingsData";
import sprite from "../assets/sprite.svg";

const PAGE_SIZE = 4;

/**
 * HoldingsTable — the full Holdings section with table structure + pagination.
 *
 * State is stored on the DOM via a data attribute so that the plain-JS
 * pagination handler can re-render only the tbody without a framework.
 *
 * @returns {string}
 */
const HoldingsTable = () => {
  /** @param {number} page  1-indexed */
  const renderRows = (page) => {
    const start = (page - 1) * PAGE_SIZE;
    return holdings
      .slice(start, start + PAGE_SIZE)
      .map((asset) => AssetRow(asset))
      .join("");
  };

  const totalPages = Math.ceil(holdings.length / PAGE_SIZE);

  const view = `
    <section class="glass-panel overflow-hidden rounded-xl" aria-label="Holdings">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
        <h3 class="text-lg font-bold text-white">Holdings</h3>
        <div class="flex gap-2">
          <button
            class="text-slate-400 transition-colors hover:text-white"
            aria-label="Search holdings"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="${sprite}#search" />
            </svg>
          </button>
          <button
            class="text-slate-400 transition-colors hover:text-white"
            aria-label="Filter holdings"
          >
            <svg class="w-5 h-5" aria-hidden="true">
              <use href="${sprite}#filter-2" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable table wrapper -->
      <div class="custom-scrollbar overflow-x-auto">
        <table
          class="w-full border-collapse text-left"
          aria-label="Asset holdings list"
          id="holdings-table"
          data-current-page="1"
          data-total-pages="${totalPages}"
          data-total-items="${holdings.length}"
          data-page-size="${PAGE_SIZE}"
        >
          <thead>
            <tr class="border-b border-slate-700/50 bg-slate-800/30 text-xs tracking-wider text-slate-400 uppercase">
              <th class="px-6 py-4 font-semibold" scope="col">Asset</th>
              <th class="px-6 py-4 font-semibold" scope="col">Source</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Price</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">24h %</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Balance</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Value</th>
              <th class="w-32 px-6 py-4 text-center font-semibold" scope="col">Last 7d</th>
              <th class="px-6 py-4 text-right font-semibold" scope="col">Action</th>
            </tr>
          </thead>
          <tbody
            class="divide-y divide-slate-700/30 text-sm"
            id="holdings-tbody"
          >
            ${renderRows(1)}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div id="holdings-pagination">
        ${Pagination({
          currentPage: 1,
          totalPages,
          totalItems: holdings.length,
          pageSize: PAGE_SIZE,
        })}
      </div>
    </section>`;

  return view;
};

/**
 * Wires up pagination click events.
 * Call once after the component is mounted into the DOM.
 */
export const initHoldingsTable = () => {
  const table = document.getElementById("holdings-table");
  const tbody = document.getElementById("holdings-tbody");
  const paginationEl = document.getElementById("holdings-pagination");

  if (!table || !tbody || !paginationEl) return;

  const totalPages = Number(table.dataset.totalPages);
  const totalItems = Number(table.dataset.totalItems);
  const pageSize = Number(table.dataset.pageSize);
  const PAGE_SIZE_LOCAL = pageSize;

  /** @param {number} page */
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    const start = (page - 1) * PAGE_SIZE_LOCAL;

    Promise.all([
      import("../utils/holdingsData"),
      import("./AssetRow"),
      import("./Pagination"),
    ]).then(([{ default: data }, { default: AssetRowFn }, { default: PaginationFn }]) => {
      // Re-render tbody rows for the new page
      tbody.innerHTML = data
        .slice(start, start + PAGE_SIZE_LOCAL)
        .map((asset) => AssetRowFn(asset))
        .join("");

      // Re-render pagination controls
      paginationEl.innerHTML = PaginationFn({
        currentPage: page,
        totalPages,
        totalItems,
        pageSize: PAGE_SIZE_LOCAL,
      });

      table.dataset.currentPage = String(page);

      // Re-attach click events on freshly rendered buttons
      bindPaginationEvents();
    });
  };

  const bindPaginationEvents = () => {
    paginationEl.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        const currentPage = Number(table.dataset.currentPage);
        if (!btn.disabled && page !== currentPage) goToPage(page);
      });
    });
  };

  bindPaginationEvents();
};

export default HoldingsTable;
