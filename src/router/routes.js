import Header from "../components/Header";
import Home from "../pages/Home";
import About from "../pages/About";
import CoinDetails from "../pages/CoinDetails";
import Error404 from "../pages/Error404";
import { initHoldingsTable } from "../components/HoldingsTable";
import { initAddAssetModal } from "../components/AddAssetModal";
import { initStatsGrid } from "../components/StatsGrid";
import { initActionToolbar } from "../components/ActionToolbar";
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
  cleanupHistoryChart();
  cleanupAllocationDonut();

  const header = document.getElementById("header");
  const root = document.getElementById("app");

  let hash = getHash();
  let path = resolveRoutes(hash);

  let render = (routes[path] ? routes[path] : routes["/404"]);

  header.innerHTML = Header();
  root.innerHTML = await render();

  // Wire up interactive components after the DOM is populated
  if (path === "/") {
    initActionToolbar();
    initStatsGrid();
    initHoldingsTable();
    initHistoryChart();
    initAllocationDonut(); // Debe ir después de initHoldingsTable (escucha prices-updated)
    initAddAssetModal();
  }
}

export default router;
