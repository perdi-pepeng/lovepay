/**
 * LovepayRegistry — contract config for Arc Testnet and Arc Mainnet.
 *
 * Testnet  (chain 5042002): 0x16c966614e32dfa9e56a0c3a44004d589283f8f9
 * Mainnet  (chain 5042):    deploy with scripts/deploy-mainnet.sh, then set VITE_MAINNET_CONTRACT
 */
import artifact from '../contracts/out/LovepayRegistry.sol/LovepayRegistry.json'

export const ARC_TESTNET_CHAIN_ID = 5042002
export const ARC_MAINNET_CHAIN_ID = 5042

/** USDC predeploy address — identical on both Arc networks */
export const ARC_USDC = '0x3600000000000000000000000000000000000000' as const

const TESTNET_ADDRESS = '0x16c966614e32dfa9e56a0c3a44004d589283f8f9' as const
const MAINNET_ADDRESS = (
  import.meta.env.VITE_MAINNET_CONTRACT ?? '0xD133FE191eDB4f7fd8bE0bcFEeAc0948875A7de9'
) as string

export function getLovepayContract(chainId: number) {
  const address =
    chainId === ARC_MAINNET_CHAIN_ID && MAINNET_ADDRESS
      ? (MAINNET_ADDRESS as `0x${string}`)
      : TESTNET_ADDRESS
  return {
    address,
    abi: artifact.abi,
    chainId,
  } as const
}

/** Backwards-compat default (testnet) */
export const LOVEPAY_CONTRACT = getLovepayContract(ARC_TESTNET_CHAIN_ID)

export function isSupportedChain(chainId: number | undefined): boolean {
  return chainId === ARC_TESTNET_CHAIN_ID || chainId === ARC_MAINNET_CHAIN_ID
}

export function isMainnet(chainId: number | undefined): boolean {
  return chainId === ARC_MAINNET_CHAIN_ID
}
