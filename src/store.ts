/**
 * Live contract hooks — all data comes from / goes to LovepayRegistry on Arc Testnet.
 * No mock data. Every hook reads onchain state via wagmi useReadContract.
 */
import { useReadContract, usePublicClient } from 'wagmi'
import { erc20Abi, type Abi, parseAbiItem, type Address } from 'viem'
import { useEffect, useState } from 'react'
import { LOVEPAY_CONTRACT, ARC_TESTNET_CHAIN_ID } from './contract'
import { getUsdc } from '@/onchain-facts'
import { parseAmount } from '@/onchain-money'
import { useUniversalWrite } from './circle-wallet'
export { useUniversalWrite as useCircleWrite }
const useCircleWrite = useUniversalWrite

const CONTRACT_ABI = LOVEPAY_CONTRACT.abi as Abi

export const USDC_FACT = getUsdc(ARC_TESTNET_CHAIN_ID)

// ─── Types matching contract storage ──────────────────────────────────────────

export interface ChainMerchant {
  wallet: string
  name: string
  email: string
  businessType: string
  registeredAt: bigint
  active: boolean
}

export interface ChainPaymentLink {
  id: string          // bytes32 hex
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
  id: string          // bytes32 hex
  merchant: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  items: string       // hex-encoded bytes
  taxBps: bigint
  discountBps: bigint
  dueDate: bigint
  status: number      // 0=draft 1=sent 2=paid 3=overdue
  total: bigint
  createdAt: bigint
  notes: string
}

export interface ChainPayment {
  id: string          // bytes32 hex
  payer: string
  merchant: string
  amount: bigint
  linkId: string
  invoiceId: string
  memo: string
  status: number      // 0=pending 1=success 2=failed 3=refunded
  createdAt: bigint
  txRef: string
}

// ─── Merchant hooks ───────────────────────────────────────────────────────────

export function useMerchant(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'merchants',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })
  // ABI returns 6 separate outputs decoded as an array: [wallet, name, email, businessType, registeredAt, active]
  const raw = data as [string, string, string, string, bigint, boolean] | undefined
  const merchant: ChainMerchant | undefined = raw && raw[4] > 0n
    ? { wallet: raw[0], name: raw[1], email: raw[2], businessType: raw[3], registeredAt: raw[4], active: raw[5] }
    : undefined
  return { merchant, isLoading, refetch }
}

export function useIsMerchant(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'isMerchant',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })
  return { isMerchant: data as boolean | undefined, isLoading, refetch }
}

export function useRegisterMerchant() {
  const { write, hash, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const register = (name: string, email: string, businessType: string) => {
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'registerMerchant',
      args: [name, email, businessType],
    })
  }
  return { register, hash, isPending, isConfirming, isSuccess, error }
}

// ─── Payment link hooks ───────────────────────────────────────────────────────

export function useMerchantLinkIds(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'getMerchantLinkIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })
  return { linkIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function usePaymentLink(linkId?: string) {
  const { data, isLoading } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'paymentLinks',
    args: linkId ? [linkId as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!linkId && linkId !== '0x0000000000000000000000000000000000000000000000000000000000000000' },
  })
  // ABI: [id, merchant, title, amount, memo, multiUse, paidCount, active, createdAt]
  const raw = data as [`0x${string}`, string, string, bigint, string, boolean, bigint, boolean, bigint] | undefined
  const link: ChainPaymentLink | undefined = raw && raw[8] > 0n
    ? { id: raw[0], merchant: raw[1], title: raw[2], amount: raw[3], memo: raw[4], multiUse: raw[5], paidCount: raw[6], active: raw[7], createdAt: raw[8] }
    : undefined
  return { link, isLoading }
}

export function useCreatePaymentLink() {
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } = useCircleWrite()

  const create = (title: string, amount: bigint, memo: string, multiUse: boolean) => {
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'createPaymentLink',
      args: [title, amount, memo, multiUse],
    })
  }
  return { create, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useDeactivatePaymentLink() {
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const deactivate = (linkId: `0x${string}`) => {
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'deactivatePaymentLink',
      args: [linkId],
    })
  }
  return { deactivate, hash, isPending, isConfirming, isSuccess }
}

// ─── Invoice hooks ────────────────────────────────────────────────────────────

export function useMerchantInvoiceIds(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'getMerchantInvoiceIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })
  return { invoiceIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function useInvoice(invoiceId?: string) {
  const { data, isLoading } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'invoices',
    args: invoiceId ? [invoiceId as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!invoiceId },
  })
  // ABI: [id, merchant, invoiceNumber, customerName, customerEmail, items, taxBps, discountBps, dueDate, status, total, createdAt, notes]
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
  const { write, hash, isPending, isConfirming, isSuccess, error, reset } = useCircleWrite()

  const create = (p: CreateInvoiceParams) => {
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'createInvoice',
      args: [p],
    })
  }
  return { create, hash, isPending, isConfirming, isSuccess, error, reset }
}

export function useUpdateInvoiceStatus() {
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const update = (invoiceId: `0x${string}`, status: number) => {
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'updateInvoiceStatus',
      args: [invoiceId, status],
    })
  }
  return { update, hash, isPending, isConfirming, isSuccess }
}

// ─── Payment / transaction hooks ─────────────────────────────────────────────

export function useMerchantPaymentIds(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'getMerchantPaymentIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })
  return { paymentIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

export function usePayment(paymentId?: string) {
  const { data, isLoading } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'payments',
    args: paymentId ? [paymentId as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!paymentId },
  })
  // ABI: [id, payer, merchant, amount, linkId, invoiceId, memo, status, createdAt, txRef]
  const raw = data as [`0x${string}`, string, string, bigint, `0x${string}`, `0x${string}`, string, number, bigint, string] | undefined
  const payment: ChainPayment | undefined = raw && raw[8] > 0n
    ? { id: raw[0], payer: raw[1], merchant: raw[2], amount: raw[3], linkId: raw[4], invoiceId: raw[5], memo: raw[6], status: Number(raw[7]), createdAt: raw[8], txRef: raw[9] }
    : undefined
  return { payment, isLoading }
}

export function usePayerPaymentIds(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'getPayerPaymentIds',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })
  return { paymentIds: (data as `0x${string}`[] | undefined) ?? [], isLoading, refetch }
}

/** Semua payment yang melibatkan address ini — sebagai penerima (merchant) DAN sebagai pengirim (payer), tanpa duplikat. */
export function useAllMyPaymentIds(address?: string) {
  const { paymentIds: received, isLoading: l1, refetch: r1 } = useMerchantPaymentIds(address)
  const { paymentIds: sent,     isLoading: l2, refetch: r2 } = usePayerPaymentIds(address)
  const allIds = [...new Set([...received, ...sent])]
  const isLoading = l1 || l2
  const refetch = () => { void r1(); void r2() }
  return { allIds, received, sent, isLoading, refetch }
}

export function useAllPaymentCount() {
  const { data } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'getAllPaymentCount',
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return (data as bigint | undefined) ?? 0n
}

// ─── USDC balance helper ──────────────────────────────────────────────────────

export function useUsdcBalance(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_FACT?.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address && !!USDC_FACT },
  })
  return { balance: data, isLoading, refetch }
}

// ─── USDC approval helper ─────────────────────────────────────────────────────

export function useApproveUsdc() {
  const { write, hash, isPending, isConfirming, isSuccess } = useCircleWrite()

  const approve = (amount: bigint) => {
    if (!USDC_FACT) return
    void write({
      address: USDC_FACT.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [LOVEPAY_CONTRACT.address, amount],
    })
  }
  return { approve, hash, isPending, isConfirming, isSuccess }
}

// ─── Pay helper ──────────────────────────────────────────────────────────────

export function usePay() {
  const { write, hash, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const pay = (
    merchant: `0x${string}`,
    amountStr: string,
    linkId: `0x${string}`,
    invoiceId: `0x${string}`,
    memo: string,
  ) => {
    const parsed = parseAmount(ARC_TESTNET_CHAIN_ID, amountStr)
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'pay',
      args: [merchant, parsed.raw, linkId, invoiceId, memo],
    })
  }
  return { pay, hash, isPending, isConfirming, isSuccess, error }
}

// ─── usePaymentTxHashes ────────────────────────────────────────────────────────
// Fetch PaymentMade event logs from blockchain — returns Map<paymentId, txHash>
// Cross-device, cross-browser, permanent onchain — no localStorage needed.
const PAYMENT_MADE_EVENT = parseAbiItem(
  'event PaymentMade(bytes32 indexed paymentId, address indexed payer, address indexed merchant, uint256 amount, bytes32 linkId, bytes32 invoiceId)'
)

export function usePaymentTxHashes(address: string | undefined): Map<string, string> {
  const [txMap, setTxMap] = useState<Map<string, string>>(new Map())
  const client = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID })

  useEffect(() => {
    if (!address || !client) return
    const addr = address as Address
    let cancelled = false

    const fetchLogs = async () => {
      try {
        const latestBlock = await client.getBlockNumber()
        // Scan last 50,000 blocks — safe range for Arc Testnet RPC
        const fromBlock = latestBlock > 50_000n ? latestBlock - 50_000n : 0n

        // Fetch logs where address is payer OR merchant (two separate calls, merged)
        const [payerLogs, merchantLogs] = await Promise.all([
          client.getLogs({
            address: LOVEPAY_CONTRACT.address as Address,
            event: PAYMENT_MADE_EVENT,
            args: { payer: addr },
            fromBlock,
            toBlock: latestBlock,
          }),
          client.getLogs({
            address: LOVEPAY_CONTRACT.address as Address,
            event: PAYMENT_MADE_EVENT,
            args: { merchant: addr },
            fromBlock,
            toBlock: latestBlock,
          }),
        ])

        if (cancelled) return
        const map = new Map<string, string>()
        for (const log of [...payerLogs, ...merchantLogs]) {
          if (log.args.paymentId && log.transactionHash) {
            map.set(log.args.paymentId, log.transactionHash)
          }
        }
        setTxMap(map)
      } catch {
        // silently ignore — link just shows — if RPC fails
      }
    }

    void fetchLogs()
    return () => { cancelled = true }
  }, [address, client])

  return txMap
}
