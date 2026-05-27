import Header from "../components/Header";
import Home from "../pages/Home";
import About from "../pages/About";
import CoinDetails from "../pages/CoinDetails";
import Error404 from "../pages/Error404";
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

  const segments = getHash();
  const { path, params } = resolveRoutes(segments);

  const render = (routes[path] ? routes[path] : routes["/404"]);

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
}

export default router;
