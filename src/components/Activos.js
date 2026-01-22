import Coins from "./Coins";

const Activos = () => {
    const view = `
      <section>
        <h3 class="text-xl font-bold mb-4 flex justify-between items-end">
          Tus Activos
          <span class="text-xs text-slate-500 font-normal">Actualizado hace 1m</span>
        </h3>

        <div class="space-y-3">
          ${Coins('#/coin/ethereum', 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', 'ETH', '1.2 ETH', '$3,100.00', '$3,100.00', '-0.5%')}
          ${Coins('#/coin/bitcoin', 'https://assets.coingecko.com/coins/images/279/large/bitcoin.png', 'BTC', '0.0012 BTC', '$3,100.00', '$3,100.00', '-0.5%')}
          ${Coins('#/coin/solana', 'https://assets.coingecko.com/coins/images/279/large/solana.png', 'SOL', '1.2 SOL', '$3,100.00', '$3,100.00', '-0.5%')}
        </div>
      </section>
    `
    return view;
}

export default Activos;