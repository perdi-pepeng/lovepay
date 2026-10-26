import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, ExternalLink, ArrowLeft, QrCode, Shield } from 'lucide-react'
import { useAccount, useSwitchChain, useReadContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { erc20Abi } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { arc, arcTestnet } from 'viem/chains'
import { useApproveUsdc, usePay, useArcChainId, getExplorerTxUrl, ARC_MAINNET_CHAIN_ID } from '../store'
import { getLovepayContract, ARC_USDC } from '../contract'

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const
const USDC_DECIMALS = 6

function parseUsdc(val: string): bigint {
  const num = parseFloat(val)
  if (isNaN(num) || num <= 0) return 0n
  return BigInt(Math.round(num * 10 ** USDC_DECIMALS))
}

function formatUsdc(raw: bigint): string {
  return (Number(raw) / 10 ** USDC_DECIMALS).toFixed(2)
}

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('user denied')) return 'Transaction cancelled.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Insufficient balance.'
  if (msg.includes('inactive merchant')) return 'Merchant is not active.'
  if (msg.includes('amount must equal invoice total')) return 'Amount must match invoice total.'
  if (msg.includes('reverted')) return 'Transaction rejected by contract. Check the amount.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Network issue. Please try again.'
  return 'Something went wrong. Please try again.'
}

interface CheckoutProps {
  linkId: string
  amount: string
  memo: string
  merchant?: string
  invoiceId?: string
  onBack: () => void
  onSuccess: (txHash: string) => void
}

export default function Checkout({ linkId, amount: prefillAmount, memo, merchant: merchantProp, invoiceId, onBack, onSuccess }: CheckoutProps) {
  const { address, isConnected, chainId: walletChainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [amount, setAmount] = useState(prefillAmount || '')
  const [step, setStep] = useState<'form' | 'approve' | 'pay' | 'done'>('form')
  const [successHash, setSuccessHash] = useState('')

  // Read chain from URL param — merchant embedded their chain when sharing the link
  const urlChainId = (() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('chain')
    if (c === String(arc.id)) return arc.id
    if (c === String(arcTestnet.id)) return arcTestnet.id
    return null
  })()

  const walletArcChainId = useArcChainId()
  // URL chain takes priority — ensures customer pays on same chain as merchant
  const arcChainId = urlChainId ?? walletArcChainId
  const contract = getLovepayContract(arcChainId)
  const onMainnet = arcChainId === ARC_MAINNET_CHAIN_ID
  const chainName = onMainnet ? 'Arc Mainnet' : 'Arc Testnet'
  const expectedChainId = onMainnet ? arc.id : arcTestnet.id

  // USDC balance
  const { data: rawBalance } = useReadContract({
    address: ARC_USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arcChainId,
    query: { enabled: !!address },
  })

  // USDC allowance for registry
  const { data: rawAllowance, refetch: refetchAllowance } = useReadContract({
    address: ARC_USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, contract.address] : undefined,
    chainId: arcChainId,
    query: { enabled: !!address },
  })

  // Read merchant from payment link if linkId provided
  const { data: linkData } = useReadContract({
    address: contract.address,
    abi: contract.abi,
    functionName: 'paymentLinks',
    args: linkId && linkId !== ZERO_BYTES32 ? [linkId as `0x${string}`] : undefined,
    chainId: arcChainId,
    query: { enabled: !!linkId && linkId.length > 20 },
  })

  type LinkTuple = readonly [string, string, string, bigint, string, boolean, bigint, boolean, bigint]
  const linkTuple = linkData as LinkTuple | undefined
  const merchantAddress = (merchantProp || linkTuple?.[1] || null) as `0x${string}` | null

  const formattedBalance = rawBalance != null ? formatUsdc(rawBalance) : null

  const { approve, isPending: isApprovePending, isSuccess: isApproveSuccess, isConfirming: isApproveConfirming } = useApproveUsdc()
  const { pay, hash: payHash, isPending: isPayPending, isConfirming: isPayConfirming, isSuccess: isPaySuccess, error: payError } = usePay()

  const wrongChain = isConnected && walletChainId !== expectedChainId

  const parsedRaw = amount ? parseUsdc(amount) : 0n
  const hasAmount = parsedRaw > 0n
  const hasAllowance = rawAllowance != null && hasAmount && (rawAllowance) >= parsedRaw
  const needsApprove = hasAmount && !hasAllowance

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('USDC approval granted!')
      void refetchAllowance()
      setStep('pay')
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isPaySuccess && payHash) {
      setSuccessHash(payHash)
      setStep('done')
      onSuccess(payHash)
      toast.success('Payment successful!')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaySuccess, payHash])

  useEffect(() => {
    if (payError) toast.error(parseOnchainError(payError))
  }, [payError])

  const handleAction = () => {
    if (wrongChain) { switchChain({ chainId: expectedChainId }); return }
    if (!hasAmount || !merchantAddress || !address) return
    if (needsApprove) {
      approve(parsedRaw)
      setStep('approve')
    } else {
      pay(
        merchantAddress,
        parsedRaw,
        (linkId && linkId.length > 20 && !invoiceId ? linkId : ZERO_BYTES32) as `0x${string}`,
        (invoiceId && invoiceId.length > 20 ? invoiceId : ZERO_BYTES32) as `0x${string}`,
        memo,
      )
      setStep('pay')
    }
  }

  const txUrl = successHash ? getExplorerTxUrl(arcChainId, successHash) : null
  const isPending = isApprovePending || isPayPending
  const isConfirming = isApproveConfirming || isPayConfirming

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-8 pb-24 px-4" style={{ background: 'var(--bg-gradient)' }}>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--love)' }}>
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="display font-bold" style={{ color: 'var(--ink)' }}>Lovepay</span>
          <div className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'var(--success)' }}>
            <Shield className="w-3.5 h-3.5" /> Onchain
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden text-center"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="h-1.5" style={{ background: 'var(--success)' }} />
              <div className="p-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(26,128,71,0.10)' }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--success)' }} />
                </div>
                <div className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Payment Successful!</div>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>{Number(amount).toLocaleString('en-US')} USDC sent</div>
                {memo && <div className="text-sm mb-4" style={{ color: 'var(--subtle)' }}>"{memo}"</div>}
                {txUrl && (
                  <a href={txUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#1061a6' }}>
                    View Transaction <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="mt-4 mono text-xs px-3 py-2 rounded-lg truncate" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
                  {successHash}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
                <div className="h-1" style={{ background: 'linear-gradient(90deg,#e83e8c,#f9a8d4,#e83e8c)' }} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-5 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white" style={{ background: 'var(--love)' }}>M</div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        {merchantAddress ? `${merchantAddress.slice(0, 10)}…${merchantAddress.slice(-4)}` : 'Lovepay Merchant'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--subtle)' }}>{memo || 'Lovepay Payment'}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-2)' }}>Payment Amount (USDC)</div>
                    {prefillAmount ? (
                      <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                        <div className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{Number(prefillAmount).toLocaleString('en-US')}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>USDC · {chainName}</div>
                      </div>
                    ) : (
                      <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                        <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                          className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300" style={{ color: 'var(--ink)' }} />
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
                          {formattedBalance && (
                            <button onClick={() => setAmount(formattedBalance)} className="text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>
                              Balance: {formattedBalance} · Max
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!prefillAmount && (
                    <div className="flex gap-2 mb-4">
                      {['10', '50', '100', '500'].map(a => (
                        <button key={a} onClick={() => setAmount(a)} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: amount === a ? 'var(--love-soft)' : 'var(--surface-muted)', color: amount === a ? 'var(--love)' : 'var(--muted)', border: amount === a ? '1px solid var(--love)' : '1px solid transparent' }}>
                          {a}
                        </button>
                      ))}
                    </div>
                  )}

                  {needsApprove && hasAmount && isConnected && !wrongChain && (
                    <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(232,62,140,0.06)', color: 'var(--love)' }}>
                      Step 1/2: Approve the contract to use your USDC, then confirm payment.
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="text-center py-4">
                      <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Connect your wallet to pay</div>
                      <div className="flex justify-center"><ConnectKitButton /></div>
                    </div>
                  ) : wrongChain ? (
                    <button onClick={() => switchChain({ chainId: expectedChainId })} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white" style={{ background: '#b45309' }}>
                      Switch to {chainName}
                    </button>
                  ) : (
                    <button disabled={!hasAmount || !merchantAddress || isPending || isConfirming}
                      onClick={handleAction}
                      className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'var(--love)' }}>
                      {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet…</>
                        : isConfirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                        : needsApprove ? `Approve & Pay ${amount ? Number(amount).toLocaleString('en-US') + ' USDC' : ''}`
                        : `Pay${amount ? ` ${Number(amount).toLocaleString('en-US')} USDC` : ''}`}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 justify-center">
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--subtle)' }} />
                <span className="text-xs" style={{ color: 'var(--subtle)' }}>Stored on smart contract · {chainName}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
