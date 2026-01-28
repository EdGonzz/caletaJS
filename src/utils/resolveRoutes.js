const resolveRoutes = (path) => {
  if (path === "/") return path;

  const staticRoutes = ["about", "404"];

  if (staticRoutes.includes(path)) return `/${path}`;

  if (path === "coin") return "/coin/:id";

  return "/404";
}

export default resolveRoutes;