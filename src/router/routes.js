import Header from "../components/Header";
import Home from "../pages/Home";
import About from "../pages/About";
import CoinDetails from "../pages/CoinDetails";
import Error404 from "../pages/Error404";

import getHash from "../utils/getHash";
import resolveRoutes from "../utils/resolveRoutes";

const routes = {
  "/": Home,
  "/about": About,
  "/coin/:id": CoinDetails,
  "/404": Error404,
};

const router = async () => {
  const header = document.getElementById("header");
  const root = document.getElementById("app");

  let hash = getHash();
  let path = resolveRoutes(hash);

  let render = (routes[path] ? routes[path] : routes["/404"]);

  header.innerHTML = Header();
  root.innerHTML = render();
}

export default router;