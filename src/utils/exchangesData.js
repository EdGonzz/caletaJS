/**
 * Static mock exchanges (caletas) data.
 * In a real app this would come from localStorage or an API.
 *
 * @typedef {Object} Exchange
 * @property {string} id         - Unique identifier
 * @property {string} name       - Display name
 * @property {string} label      - Secondary label (type/wallet info)
 * @property {string} color      - Background color for avatar
 * @property {string} [logoUrl]  - Optional logo URL
 * @property {string} [initial]  - Fallback letter if no logo
 * @property {string} [icon]     - Material icon name (e.g. for hardware wallets)
 */

/** @type {Exchange[]} */
const exchanges = [
  {
    id: "binance",
    name: "Binance",
    label: "Principal • Spot",
    color: "#F3BA2F",
    logoUrl: "https://assets.coingecko.com/markets/images/52/small/binance.jpg",
    initial: "B",
  },
  {
    id: "kraken",
    name: "Kraken",
    label: "Futures",
    color: "#5841D8",
    initial: "K",
  },
  {
    id: "coinbase",
    name: "Coinbase",
    label: "Wallet 1",
    color: "#0052FF",
    initial: "C",
  },
  {
    id: "metamask",
    name: "MetaMask",
    label: "0x71...3A92",
    color: "#F6851B",
    logoUrl: "https://assets.coingecko.com/markets/images/882/small/metamask.png",
    initial: "M",
  },
  {
    id: "ledger",
    name: "Ledger Nano X",
    label: "Cold Storage",
    color: "#1A1A2E",
    icon: "usb",
    initial: "L",
  },
];

export default exchanges;
