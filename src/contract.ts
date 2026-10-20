/**
 * LovepayRegistry — live contract config for Arc Testnet.
 * Address: 0xf1d2f4b823a2ec8ffa91be154029e8c0e5113b65
 * Deployed: 2026-10-17
 */
import artifact from '../contracts/out/LovepayRegistry.sol/LovepayRegistry.json'

export const LOVEPAY_CONTRACT = {
  address: '0xf1d2f4b823a2ec8ffa91be154029e8c0e5113b65' as const,
  abi: artifact.abi,
  chainId: 5042002, // Arc Testnet
} as const

export const ARC_TESTNET_CHAIN_ID = 5042002
