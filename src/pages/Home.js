import ActionToolbar from "../components/ActionToolbar";
import StatsGrid from "../components/StatsGrid";
import HistoryChart from "../components/HistoryChart";
import AllocationDonut from "../components/AllocationDonut";
import HoldingsTable from "../components/HoldingsTable";
import AddAssetModal from "../components/AddAssetModal";

const Home = () => {
  const view = `
  <main class="px-4 pt-6 pb-20 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-[1600px] space-y-6">
      ${ActionToolbar()}
      ${StatsGrid()}
      <section class="grid grid-cols-1 gap-6 lg:min-h-[400px] lg:grid-cols-12">
        ${HistoryChart()}
        ${AllocationDonut()}
      </section>
        ${HoldingsTable()}
    </div>
  </main>
  ${AddAssetModal()}
`;

  return view;
}

export default Home;

