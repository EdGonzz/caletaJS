import Balance from "../components/Balance";
import Activos from "../components/Activos";
import ActionToolbar from "../components/ActionToolbar";

const Home = () => {
  const view = `
  <main class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1600px] space-y-6">
      ${ActionToolbar()}
      ${Balance()}
      ${Activos()}
    </div>
  </main>
`;

  return view;
}

export default Home;
