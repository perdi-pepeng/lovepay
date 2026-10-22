/**
 * LovepayRegistry — live contract config for Arc Testnet.
 * Address: 0x16c966614e32dfa9e56a0c3a44004d589283f8f9
 * Deployed: 2026-10-22 (v3 — added social media fields to Merchant struct)
 */
import artifact from '../contracts/out/LovepayRegistry.sol/LovepayRegistry.json'

export const LOVEPAY_CONTRACT = {
  address: '0x16c966614e32dfa9e56a0c3a44004d589283f8f9' as const,
  abi: artifact.abi,
  chainId: 5042002, // Arc Testnet
} as const

export const ARC_TESTNET_CHAIN_ID = 5042002
