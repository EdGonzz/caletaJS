import AssetRow from "./AssetRow";
import Pagination from "./Pagination";
import { getHoldings } from "../utils/holdingsStorage";
import sprite from "../assets/sprite.svg";

const PAGE_SIZE = 4;

/**
 * Aggregates individual transactions into a list of unique assets.
 * @param {Array} transactions 
 * @returns {Array}
 */
const aggregateHoldings = (transactions) => {
  const aggregated = transactions.reduce((acc, tx) => {
    // Group by coinId and source to show separate rows for different sources
    const key = `${tx.coinId}-${tx.source}`;
    if (!acc[key]) {
      acc[key] = {
        id: tx.coinId,
        name: tx.name,
        symbol: tx.symbol,
        logoUrl: tx.logoUrl,
        source: tx.source,
        sourceIcon: tx.sourceIcon || 'wallet',
        balance: 0,
        price: tx.price, // Last price recorded (initial fallback)
        change24h: 0,
        value: 0,
        sparkPath: "M0,15 Q25,25 50,10 T100,5", // Dummy initial sparkline
        sparkColor: "#64748b",
        isFlat: tx.symbol.toLowerCase().includes("usd") || tx.symbol.toLowerCase().includes("eur"),
      };
    }
    
    // Simplistic balance calculation based on transaction type
    if (tx.type === 'buy' || tx.type === 'transfer') acc[key].balance += tx.balance;
    if (tx.type === 'sell') acc[key].balance -= tx.balance;
    
    return acc;
  }, {});

  // Return only assets with a positive balance
  return Object.values(aggregated).filter(h => h.balance > 0);
};

/**
 * Placeholder for empty state when no holdings are found.
 * @returns {string}
 */
const EmptyState = () => `
  <tr>
    <td colspan="8" class="px-6 py-20 text-center">
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="relative">
          <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <div class="relative rounded-full bg-slate-800/50 p-6 border border-slate-700/50">
            <svg class="h-10 w-10 text-slate-500" aria-hidden="true">
              <use href="${sprite}#wallet" />
            </svg>
          </div>
        </div>
        <div class="space-y-1">
          <h4 class="text-lg font-bold text-white">No assets found</h4>
          <p class="text-sm text-slate-400 max-w-xs mx-auto">Your portfolio is empty. Add your first transaction to start tracking your investments.</p>
        </div>
        <button 
          id="empty-state-add-btn"
          class="inline-flex items-center px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg border border-primary/20 transition-all focus:outline-none"
        >
          <svg class="w-4 h-4 mr-2"><use href="${sprite}#plus" /></svg>
          Add First Asset
        </button>
      </div>
    </td>
  </tr>
`;

/**
 * HoldingsTable — the full Holdings section with table structure + pagination.
 */
const HoldingsTable = () => {
  const view = `
    <section class="glass-panel overflow-hidden rounded-xl" aria-label="Holdings">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-slate-700/50 px-6 py-5">
        <h3 class="text-lg font-bold text-white">Holdings</h3>
        <div class="flex gap-2">
        </button>
          <button
            id="search-btn"
            class="text-slate-400 transition-colors hover:text-white group focus:outline-none"
            aria-label="Search"
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
          <button
            id="refresh-prices-btn"
            class="text-slate-400 transition-colors hover:text-white group focus:outline-none"
            aria-label="Refresh prices"
          >
            <svg class="w-5 h-5 transition-transform group-active:rotate-180 duration-500" aria-hidden="true">
              <use href="${sprite}#refresh" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scrollable table wrapper -->
      <div class="custom-scrollbar overflow-x-auto min-h-[300px]">
        <table
          class="w-full border-collapse text-left"
          aria-label="Asset holdings list"
          id="holdings-table"
          data-current-page="1"
          data-total-pages="1"
          data-total-items="0"
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
            <!-- Content injected by initHoldingsTable -->
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div id="holdings-pagination"></div>
    </section>`;

  return view;
};

/**
 * Wires up dynamic data, pagination, and real-time updates.
 */
export const initHoldingsTable = () => {
  const table = document.getElementById("holdings-table");
  const tbody = document.getElementById("holdings-tbody");
  const paginationEl = document.getElementById("holdings-pagination");

  if (!table || !tbody || !paginationEl) return;

  const pageSize = Number(table.dataset.pageSize);
  let currentData = [];

  const updateDisplay = (page = 1) => {
    if (currentData.length === 0) {
      tbody.innerHTML = EmptyState();
      paginationEl.innerHTML = '';
      
      // Wire up the empty state button
      document.getElementById("empty-state-add-btn")?.addEventListener("click", () => {
        document.getElementById("add-funds")?.click();
      });
      return;
    }

    const totalPages = Math.ceil(currentData.length / pageSize);
    const start = (page - 1) * pageSize;
    
    tbody.innerHTML = currentData
      .slice(start, start + pageSize)
      .map((asset) => AssetRow(asset))
      .join("");

    paginationEl.innerHTML = Pagination({
      currentPage: page,
      totalPages,
      totalItems: currentData.length,
      pageSize,
    });

    table.dataset.totalPages = String(totalPages);
    table.dataset.totalItems = String(currentData.length);
    table.dataset.currentPage = String(page);

    bindPaginationEvents();
  };

  const bindPaginationEvents = () => {
    paginationEl.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        const currentPage = Number(table.dataset.currentPage);
        if (!btn.disabled && page !== currentPage) updateDisplay(page);
      });
    });
  };

  const fetchPricesAndUpdate = async () => {
    const rawHoldings = getHoldings();
    let data = aggregateHoldings(rawHoldings);

    if (data.length === 0) {
      currentData = [];
      updateDisplay(1);
      // Still notify StatsGrid so it shows zeros
      window.dispatchEvent(new CustomEvent('prices-updated', { detail: { holdings: [] } }));
      return;
    }

    const coinIds = [...new Set(data.map(h => h.id))].join(',');
    
    try {
      const url = `${process.env.API_URL}/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=true`;
      const options = {
        headers: { 
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': process.env.API_KEY || ''
        }
      };

      const response = await fetch(url, options);
      if (response.ok) {
        const markets = await response.json();
        
        data = data.map(asset => {
          const market = markets.find(m => m.id === asset.id);
          if (market) {
            return {
              ...asset,
              price: market.current_price,
              change24h: market.price_change_percentage_24h,
              value: asset.balance * market.current_price,
              sparkColor: market.price_change_percentage_24h >= 0 ? "#0bd570" : "#ef4444"
              // In a more advanced version, we would parse market.sparkline_in_7d.price to SVG path
            };
          }
          // Recalculate value with stored price if API fails for this specific coin
          return { ...asset, value: asset.balance * asset.price };
        });
      }
    } catch (e) {
      console.error("HoldingsTable: Failed to fetch real-time prices:", e);
      // Fallback: calculate value using the last known price
      data = data.map(a => ({...a, value: a.balance * a.price}));
    }

    currentData = data;
    
    // Dispatch event for StatsGrid
    window.dispatchEvent(new CustomEvent('prices-updated', { detail: { holdings: currentData } }));
    
    updateDisplay(Number(table.dataset.currentPage) || 1);
  };

  // Initial Load
  fetchPricesAndUpdate();

  // Manual Refresh Button
  document.getElementById("refresh-prices-btn")?.addEventListener("click", () => {
    const btn = document.getElementById("refresh-prices-btn");
    btn.querySelector('svg')?.classList.add("animate-spin");
    fetchPricesAndUpdate().finally(() => {
      setTimeout(() => btn.querySelector('svg')?.classList.remove("animate-spin"), 500);
    });
  });

  // Listen for new transactions
  window.addEventListener('holdings-updated', () => {
    fetchPricesAndUpdate();
  });
};

export default HoldingsTable;
