/**
 * Live contract hooks — all data comes from / goes to LovepayRegistry on Arc.
 * Supports both Arc Testnet (5042002) and Arc Mainnet (5042).
 * No mock data. Every hook reads onchain state via wagmi useReadContract.
 */
import { useReadContract, usePublicClient, useAccount } from 'wagmi'
import { erc20Abi, type Abi } from 'viem'
import { useEffect, useState } from 'react'
import {
  getLovepayContract,
  ARC_USDC,
  ARC_TESTNET_CHAIN_ID,
  ARC_MAINNET_CHAIN_ID,
  isSupportedChain,
} from './contract'
import { useUniversalWrite } from './circle-wallet'
export { useUniversalWrite as useCircleWrite }
const useCircleWrite = useUniversalWrite

// ─── Active chain helper ──────────────────────────────────────────────────────
// Returns the Arc chain the connected wallet is on, defaulting to testnet.
export function useArcChainId(): number {
  const { chainId } = useAccount()
  if (chainId === ARC_MAINNET_CHAIN_ID) return ARC_MAINNET_CHAIN_ID
  return ARC_TESTNET_CHAIN_ID
}

// ─── Types matching contract storage ──────────────────────────────────────────

export interface ChainMerchant {
  wallet: string
  name: string
  email: string
  businessType: string
  registeredAt: bigint
  active: boolean
  website: string
  instagram: string
  twitter: string
  whatsapp: string
}

export interface ChainPaymentLink {
  id: string
  merchant: string
  title: string
  amount: bigint      // 0 = open
  memo: string
  multiUse: boolean
  paidCount: bigint
  active: boolean
  createdAt: bigint
}

export interface ChainInvoice {
  id: string
  merchant: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  items: string
  taxBps: bigint
  discountBps: bigint
  dueDate: bigint
  status: number      // 0=draft 1=sent 2=paid 3=overdue
  total: bigint
  createdAt: bigint
  notes: string
}

export interface ChainPayment {
  id: string
  payer: string
  merchant: string
  amount: bigint
  linkId: string
  invoiceId: string
  memo: string
  status: number      // 0=pending 1=success 2=failed 3=refunded
  createdAt: bigint
  txRef: string
  blockNumber: bigint
}

// ─── Merchant hooks ───────────────────────────────────────────────────────────

export function useMerchant(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'merchants',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address },
  })
  const raw = data as [string, string, string, string, bigint, boolean, string, string, string, string] | undefined
  const merchant: ChainMerchant | undefined = raw && raw[4] > 0n
    ? { wallet: raw[0], name: raw[1], email: raw[2], businessType: raw[3], registeredAt: raw[4], active: raw[5], website: raw[6] ?? '', instagram: raw[7] ?? '', twitter: raw[8] ?? '', whatsapp: raw[9] ?? '' }
    : undefined
  return { merchant, isLoading, refetch }
}

export function useIsMerchant(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'isMerchant',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address },
  })
  return { isMerchant: data as boolean | undefined, isLoading, refetch }
}

export interface MerchantFormData {
  name: string
  email: string
  businessType: string
  website: string
  instagram: string
  twitter: string
  whatsapp: string
}

export function useRegisterMerchant() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const register = (d: MerchantFormData) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'registerMerchant',
      args: [d.name, d.email, d.businessType, d.website, d.instagram, d.twitter, d.whatsapp],
    })
  }
  return { register, hash, isPending, isConfirming, isSuccess, error }
}

export function useUpdateMerchant() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const update = (d: MerchantFormData) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'updateMerchant',
      args: [d.name, d.email, d.businessType, d.website, d.instagram, d.twitter, d.whatsapp],
    })
  }
  return { update, hash, isPending, isConfirming, isSuccess, error }
}

// ─── Payment link hooks ───────────────────────────────────────────────────────

export function useMerchantLinkIds(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getMerchantLinkIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address },
  })
  return { linkIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function usePaymentLink(linkId?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'paymentLinks',
    args: linkId ? [linkId as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!linkId && linkId !== '0x0000000000000000000000000000000000000000000000000000000000000000' },
  })
  const raw = data as [`0x${string}`, string, string, bigint, string, boolean, bigint, boolean, bigint] | undefined
  const link: ChainPaymentLink | undefined = raw && raw[8] > 0n
    ? { id: raw[0], merchant: raw[1], title: raw[2], amount: raw[3], memo: raw[4], multiUse: raw[5], paidCount: raw[6], active: raw[7], createdAt: raw[8] }
    : undefined
  return { link, isLoading }
}

export function useCreatePaymentLink() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } = useCircleWrite()

  const create = (title: string, amount: bigint, memo: string, multiUse: boolean) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'createPaymentLink',
      args: [title, amount, memo, multiUse],
    })
  }
  return { create, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useDeactivatePaymentLink() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const deactivate = (linkId: `0x${string}`) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'deactivatePaymentLink',
      args: [linkId],
    })
  }
  return { deactivate, hash, isPending, isConfirming, isSuccess }
}

// ─── Invoice hooks ────────────────────────────────────────────────────────────

export function useMerchantInvoiceIds(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getMerchantInvoiceIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address },
  })
  return { invoiceIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function useInvoice(invoiceId?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'invoices',
    args: invoiceId ? [invoiceId as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!invoiceId },
  })
  const raw = data as [`0x${string}`, string, string, string, string, string, bigint, bigint, bigint, number, bigint, bigint, string] | undefined
  const invoice: ChainInvoice | undefined = raw && raw[11] > 0n
    ? { id: raw[0], merchant: raw[1], invoiceNumber: raw[2], customerName: raw[3], customerEmail: raw[4], items: raw[5], taxBps: raw[6], discountBps: raw[7], dueDate: raw[8], status: Number(raw[9]), total: raw[10], createdAt: raw[11], notes: raw[12] }
    : undefined
  return { invoice, isLoading }
}

export interface CreateInvoiceParams {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  encodedItems: `0x${string}`
  taxBps: bigint
  discountBps: bigint
  dueDate: bigint
  total: bigint
  notes: string
}

export function useCreateInvoice() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } = useCircleWrite()

  const create = (p: CreateInvoiceParams) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'createInvoice',
      args: [p],
    })
  }
  return { create, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useUpdateInvoiceStatus() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const update = (invoiceId: `0x${string}`, status: number) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'updateInvoiceStatus',
      args: [invoiceId, status],
    })
  }
  return { update, hash, isPending, isConfirming, isSuccess }
}

// ─── Payment / transaction hooks ─────────────────────────────────────────────

export function useMerchantPaymentIds(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getMerchantPaymentIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })
  return { paymentIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function usePayment(paymentId?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'payments',
    args: paymentId ? [paymentId as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!paymentId },
  })
  const raw = data as [`0x${string}`, string, string, bigint, `0x${string}`, `0x${string}`, string, number, bigint, string, bigint] | undefined
  const payment: ChainPayment | undefined = raw && raw[8] > 0n
    ? { id: raw[0], payer: raw[1], merchant: raw[2], amount: raw[3], linkId: raw[4], invoiceId: raw[5], memo: raw[6], status: Number(raw[7]), createdAt: raw[8], txRef: raw[9], blockNumber: raw[10] }
    : undefined
  return { payment, isLoading }
}

export function usePayerPaymentIds(address?: string) {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data, isLoading, refetch } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getPayerPaymentIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })
  return { paymentIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function useAllMyPaymentIds(address?: string) {
  const { paymentIds: received, isLoading: l1, refetch: r1 } = useMerchantPaymentIds(address)
  const { paymentIds: sent,     isLoading: l2, refetch: r2 } = usePayerPaymentIds(address)
  const allIds = [...new Set([...received, ...sent])]
  const isLoading = l1 || l2
  const refetch = () => { void r1(); void r2() }
  return { allIds, received, sent, isLoading, refetch }
}

export function useAllPaymentCount() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { data } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'getAllPaymentCount',
    chainId,
  })
  return (data as bigint | undefined) ?? 0n
}

// ─── USDC balance helper ──────────────────────────────────────────────────────

export function useUsdcBalance(address?: string) {
  const chainId = useArcChainId()
  const { data, isLoading, refetch } = useReadContract({
    address: ARC_USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId,
    query: { enabled: !!address },
  })
  return { balance: data, isLoading, refetch }
}

// ─── USDC approval helper ─────────────────────────────────────────────────────

export function useApproveUsdc() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const approve = (amount: bigint) => {
    void write({
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: 'approve',
      args: [contract.address, amount],
    })
  }
  return { approve, hash, isPending, isConfirming, isSuccess }
}

// ─── Pay helper ──────────────────────────────────────────────────────────────

export function usePay() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const { write, hash, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const pay = (
    merchant: `0x${string}`,
    amountRaw: bigint,
    linkId: `0x${string}`,
    invoiceId: `0x${string}`,
    memo: string,
  ) => {
    void write({
      address: contract.address,
      abi: contract.abi as Abi,
      functionName: 'pay',
      args: [merchant, amountRaw, linkId, invoiceId, memo],
    })
  }
  return { pay, hash, isPending, isConfirming, isSuccess, error }
}

// ─── TX hash from block ───────────────────────────────────────────────────────

export function usePaymentTxHashes(
  payments: Array<{ id: string; blockNumber: bigint }> | undefined
): Map<string, string> {
  const [txMap, setTxMap] = useState<Map<string, string>>(new Map())
  const chainId = useArcChainId()
  const client = usePublicClient({ chainId })

  useEffect(() => {
    if (!payments || payments.length === 0 || !client) return
    let cancelled = false

    const fetchTxHashes = async () => {
      try {
        const blockMap = new Map<bigint, string[]>()
        for (const p of payments) {
          if (!p.blockNumber || p.blockNumber === 0n) continue
          const ids = blockMap.get(p.blockNumber) ?? []
          ids.push(p.id)
          blockMap.set(p.blockNumber, ids)
        }

        const contract = getLovepayContract(chainId)
        const contractAddr = contract.address.toLowerCase()
        const map = new Map<string, string>()

        await Promise.all(
          [...blockMap.entries()].map(async ([blockNumber, paymentIds]) => {
            try {
              const block = await client.getBlock({ blockNumber, includeTransactions: true })
              for (const tx of block.transactions) {
                if (typeof tx === 'object' && tx.to?.toLowerCase() === contractAddr) {
                  const id = paymentIds.shift()
                  if (id) map.set(id, tx.hash)
                }
              }
            } catch {
              // skip block on RPC error
            }
          })
        )

        if (!cancelled) setTxMap(map)
      } catch {
        // silently ignore
      }
    }

    void fetchTxHashes()
    return () => { cancelled = true }
  }, [payments, client, chainId])

  return txMap
}

// ─── Chain explorer URL helper ────────────────────────────────────────────────

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base = chainId === ARC_MAINNET_CHAIN_ID
    ? 'https://explorer.arc.io'
    : 'https://explorer.testnet.arc.io'
  return `${base}/tx/${txHash}`
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const base = chainId === ARC_MAINNET_CHAIN_ID
    ? 'https://explorer.arc.io'
    : 'https://explorer.testnet.arc.io'
  return `${base}/address/${address}`
}

export { isSupportedChain, ARC_TESTNET_CHAIN_ID, ARC_MAINNET_CHAIN_ID }
