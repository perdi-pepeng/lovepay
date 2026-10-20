/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import { requireChain } from './onchain-facts'
import { registerChain as traceRegisterChain } from './tracing'

const arcChainFacts = requireChain(arcTestnet.id)
const arcRpcUrl = arcChainFacts.rpcUrls[0]

// Pre-register chain RPC URLs so trace events show correct chain names immediately
traceRegisterChain(arcTestnet.id, arcRpcUrl)

export const config = createConfig({
  chains: [arcTestnet, mainnet],
  connectors: [
    injected({ shimDisconnect: true }),          // MetaMask, Rabby, any injected wallet
    coinbaseWallet({ appName: 'Lovepay' }),       // Coinbase Wallet
  ],
  transports: {
    [arcTestnet.id]: http(arcRpcUrl),            // explicit RPC — never rely on viem/chains default
    [mainnet.id]: http(),
  },
})
