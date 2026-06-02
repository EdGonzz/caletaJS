import Header from "../components/Header";
import Home from "../pages/Home";
import About from "../pages/About";
import CoinDetails from "../pages/CoinDetails";
import Error404 from "../pages/Error404";
import ErrorPage, { initErrorPage } from "../pages/ErrorPage";
import { initHoldingsTable, cleanupHoldingsTable } from "../components/HoldingsTable";
import { initAddAssetModal, cleanupAddAssetModal } from "../components/AddAssetModal";
import { initStatsGrid, cleanupStatsGrid } from "../components/StatsGrid";
import { initActionToolbar, cleanupActionToolbar } from "../components/ActionToolbar";
import { initHistoryChart, cleanupHistoryChart } from "../components/HistoryChart";
import { initAllocationDonut, cleanupAllocationDonut } from "../components/AllocationDonut";

import getHash from "../utils/getHash";
import resolveRoutes from "../utils/resolveRoutes";

const routes = {
  "/": Home,
  "/about": About,
  "/coin/:id": CoinDetails,
  "/404": Error404,
};

const router = async () => {
  // Cleanup active charts and listeners to prevent memory leaks during SPA navigation
  cleanupHistoryChart(true);
  cleanupAllocationDonut();
  cleanupStatsGrid();
  cleanupHoldingsTable();
  cleanupAddAssetModal();
  cleanupActionToolbar();

  const header = document.getElementById("header");
  const root = document.getElementById("app");

  // Guard: si los elementos raíz no existen, algo está muy mal
  if (!root || !header) {
    console.error("Router: #app o #header no encontrados en el DOM.");
    return;
  }

  try {
    const segments = getHash();
    const { path, params } = resolveRoutes(segments);

    const render = routes[path] ?? routes["/404"];

    header.innerHTML = Header(path);
    root.innerHTML = await render(params);

    // Wire up interactive components after the DOM is populated
    // Order matters: listeners (StatsGrid, AllocationDonut) must register BEFORE
    // HoldingsTable dispatches 'prices-updated', which can happen synchronously
    // when aggregated holdings have zero net balance.
    if (path === "/") {
      initActionToolbar();
      initStatsGrid();       // Registers prices-updated listener
      initAllocationDonut(); // Registers prices-updated listener
      initHoldingsTable();   // May dispatch prices-updated synchronously
      initAddAssetModal();
      await initHistoryChart(); // Async: chart creation with API fetch
    }
  } catch (err) {
    console.error("Router: error crítico al renderizar la ruta —", err);

    // Mostrar página de error crítico en lugar de dejar la app en blanco
    try {
      root.innerHTML = ErrorPage(err);
      initErrorPage();
      header.innerHTML = "";
    } catch (renderErr) {
      root.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:#ef4444;font-family:sans-serif;text-align:center;padding:2rem;">
          <h1 style="font-size:2rem;font-weight:bold;margin-bottom:0.5rem;">Error crítico</h1>
          <p style="color:#94a3b8;margin-bottom:1.5rem;">No se pudo cargar la aplicación.</p>
          <button id="router-critical-reload-btn" style="padding:0.5rem 1.25rem;background:#1e293b;color:#f8fafc;border:1px solid #334155;border-radius:0.5rem;cursor:pointer;font-size:0.875rem;">
            Recargar
          </button>
        </div>
      `;
      document.getElementById("router-critical-reload-btn")?.addEventListener("click", () => {
        window.location.reload();
      });
    }
  }
};

export default router;
