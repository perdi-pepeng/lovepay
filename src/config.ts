/**
 * wagmi configuration — Arc Testnet + Arc Mainnet + Ethereum Mainnet (for ENS)
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arc, arcTestnet } from 'viem/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'

// Arc Testnet RPC
const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.io'
// Arc Mainnet RPC
const ARC_MAINNET_RPC = 'https://rpc.mainnet.arc.io'

export const config = createConfig({
  chains: [arcTestnet, arc, mainnet],
  connectors: [
    injected({ shimDisconnect: true }),          // MetaMask, Rabby, any injected wallet
    coinbaseWallet({ appName: 'Lovepay' }),       // Coinbase Wallet
  ],
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_RPC),      // explicit RPC — never rely on viem/chains default
    [arc.id]:        http(ARC_MAINNET_RPC),      // Arc Mainnet
    [mainnet.id]:    http(),                     // Ethereum (ENS only)
  },
})
