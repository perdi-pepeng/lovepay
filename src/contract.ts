/**
 * LovepayRegistry — contract config for Arc Testnet, Arc Mainnet, and QMS Testnet.
 *
 * Arc Testnet (5042002): 0x16c966614e32dfa9e56a0c3a44004d589283f8f9
 * Arc Mainnet (5042):    0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9
 * QMS Testnet (19480):   0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9
 */
import artifact from '../contracts/out/LovepayRegistry.sol/LovepayRegistry.json'

export const ARC_TESTNET_CHAIN_ID = 5042002
export const ARC_MAINNET_CHAIN_ID = 5042
export const QMS_TESTNET_CHAIN_ID  = 19480

/** USDC on Arc (testnet and mainnet — same predeploy address) */
export const ARC_USDC  = '0x3600000000000000000000000000000000000000' as const
/** USDC on QMS Testnet */
export const QMS_USDC  = '0xDd4D61DF875cc613E1372c78827a5F4C2741bf11' as const

/** Returns the USDC address for the given chain */
export function getUsdcAddress(chainId: number): `0x${string}` {
  if (chainId === QMS_TESTNET_CHAIN_ID) return QMS_USDC
  return ARC_USDC
}

const TESTNET_ADDRESS = '0x16c966614e32dfa9e56a0c3a44004d589283f8f9' as const
const MAINNET_ADDRESS = (
  import.meta.env.VITE_MAINNET_CONTRACT ?? '0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9'
) as string
const QMS_ADDRESS = (
  import.meta.env.VITE_QMS_CONTRACT ?? '0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9'
) as string

export function getLovepayContract(chainId: number) {
  let address: `0x${string}`
  if (chainId === ARC_MAINNET_CHAIN_ID && MAINNET_ADDRESS) {
    address = MAINNET_ADDRESS as `0x${string}`
  } else if (chainId === QMS_TESTNET_CHAIN_ID && QMS_ADDRESS) {
    address = QMS_ADDRESS as `0x${string}`
  } else {
    address = TESTNET_ADDRESS
  }
  return { address, abi: artifact.abi, chainId } as const
}

/** Backwards-compat default (Arc testnet) */
export const LOVEPAY_CONTRACT = getLovepayContract(ARC_TESTNET_CHAIN_ID)

export function isSupportedChain(chainId: number | undefined): boolean {
  return (
    chainId === ARC_TESTNET_CHAIN_ID ||
    chainId === ARC_MAINNET_CHAIN_ID ||
    chainId === QMS_TESTNET_CHAIN_ID
  )
}

export function isMainnet(chainId: number | undefined): boolean {
  return chainId === ARC_MAINNET_CHAIN_ID
}

export function getChainLabel(chainId: number | undefined): string {
  if (chainId === ARC_MAINNET_CHAIN_ID) return 'Arc Mainnet'
  if (chainId === QMS_TESTNET_CHAIN_ID)  return 'QMS Testnet'
  return 'Arc Testnet'
}

export function getExplorerBase(chainId: number): string {
  if (chainId === ARC_MAINNET_CHAIN_ID) return 'https://explorer.arc.io'
  if (chainId === QMS_TESTNET_CHAIN_ID)  return 'https://explorer.testnet.qms.finance'
  return 'https://explorer.testnet.arc.io'
}
