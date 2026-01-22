import Header from "../components/Header";
import Balance from "../components/Balance";
import Activos from "../components/Activos";

const Home = () => {
  const view = `
  ${Header()}

  <main class="max-w-md mx-auto pt-20 px-4 pb-24">
    ${Balance()}
    ${Activos()}
  </main>
`;

  return view;
}

export default Home;
