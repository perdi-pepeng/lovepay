/**
 * LovepayRegistry — live contract config for Arc Testnet.
 * Address: 0xf2f7052b9d116c283540f88adf2137f0f1d741fc
 * Deployed: 2026-10-21 (v2 — added blockNumber to PaymentRecord)
 */
import artifact from '../contracts/out/LovepayRegistry.sol/LovepayRegistry.json'

export const LOVEPAY_CONTRACT = {
  address: '0xf2f7052b9d116c283540f88adf2137f0f1d741fc' as const,
  abi: artifact.abi,
  chainId: 5042002, // Arc Testnet
} as const

export const ARC_TESTNET_CHAIN_ID = 5042002
