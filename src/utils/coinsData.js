/**
 * Coins available for the "Select Coin" picker inside AddAssetModal.
 *
 * @typedef {Object} Coin
 * @property {string} id      - CoinGecko-style id
 * @property {string} name    - Human-readable name
 * @property {string} symbol  - Ticker
 * @property {string} logoUrl - Logo thumbnail
 * @property {string} color   - Brand color for fallback avatar
 */

/** @type {Coin[]} */
const coins = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    logoUrl: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    color: "#F7931A",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    color: "#627EEA",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    logoUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    color: "#14F195",
  },
  {
    id: "tether",
    name: "Tether",
    symbol: "USDT",
    logoUrl: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    color: "#26A17B",
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    logoUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    color: "#F3BA2F",
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    logoUrl: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
    color: "#0033AD",
  },
  {
    id: "xrp",
    name: "XRP",
    symbol: "XRP",
    logoUrl: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    color: "#23292F",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    logoUrl: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
    color: "#E6007A",
  },
];

export default coins;
