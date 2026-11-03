/**
 * wagmi configuration — Arc Testnet + Arc Mainnet + QMS Testnet
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arc, arcTestnet } from 'viem/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import type { Chain } from 'viem'

// ─── QMS Testnet chain definition ────────────────────────────────────────────
export const qmsTestnet = {
  id: 19480,
  name: 'QMS Testnet',
  nativeCurrency: { name: 'QMS', symbol: 'QMS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.qms.finance'] },
    public:  { http: ['https://rpc.testnet.qms.finance'] },
  },
  blockExplorers: {
    default: { name: 'QMSScan', url: 'https://testnet.qmsscan.io' },
  },
  testnet: true,
} as const satisfies Chain

// ─── RPC URLs ─────────────────────────────────────────────────────────────────
const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.io'
const ARC_MAINNET_RPC = 'https://rpc.mainnet.arc.io'
const QMS_TESTNET_RPC = 'https://rpc.testnet.qms.finance'

export const config = createConfig({
  chains: [arcTestnet, arc, qmsTestnet, mainnet],
  connectors: [
    injected({ shimDisconnect: true }),          // MetaMask, Rabby, any injected wallet
    coinbaseWallet({ appName: 'Lovepay' }),       // Coinbase Wallet
  ],
  transports: {
    [arcTestnet.id]:  http(ARC_TESTNET_RPC),
    [arc.id]:         http(ARC_MAINNET_RPC),
    [qmsTestnet.id]:  http(QMS_TESTNET_RPC),
    [mainnet.id]:     http(),                    // Ethereum (ENS only)
  },
})
