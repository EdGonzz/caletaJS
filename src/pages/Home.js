import Balance from "../components/Balance";
import Activos from "../components/Activos";
import ActionToolbar from "../components/ActionToolbar";
import StatsGrid from "../components/StatsGrid";
import HistoryChart from "../components/HistoryChart";
import AllocationDonut from "../components/AllocationDonut";

const Home = () => {
  const view = `
  <main class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1600px] space-y-6">
      ${ActionToolbar()}
      ${StatsGrid()}
      <section class="grid h-auto grid-cols-1 gap-6 lg:h-[400px] lg:grid-cols-12">
        ${HistoryChart()}
        ${AllocationDonut()}
      </section>
      ${Balance()}
      ${Activos()}
    </div>
  </main>
`;

  return view;
}

export default Home;
