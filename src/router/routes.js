import Home from "../pages/Home";
import About from "../pages/About";
import CoinDetails from "../pages/CoinDetails";

const routes = {
  "/": Home,
  "/about": About,
  "/coin/:id": CoinDetails,
};

const router = async () => {
  const root = document.getElementById("app");

  let path = location.hash.slice(1).toLowerCase() || "/"

  const render = routes[path] ? routes[path] : routes["/"]

  root.innerHTML = await render();
}

export default router;