import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, ExternalLink, ArrowLeft, QrCode, Shield } from 'lucide-react'
import { useAccount, useSwitchChain, useReadContract } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { erc20Abi } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { requireChain, buildTxExplorerUrl } from '@/onchain-facts'
import { Amount, usdcDecimalsFor, parseAmount } from '@/onchain-money'
import { useApproveUsdc, usePay, USDC_FACT } from '../store'
import { LOVEPAY_CONTRACT, ARC_TESTNET_CHAIN_ID } from '../contract'

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('user denied')) return 'Transaksi dibatalkan.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Saldo tidak mencukupi.'
  if (msg.includes('inactive merchant')) return 'Merchant tidak aktif.'
  if (msg.includes('amount must equal invoice total')) return 'Nominal harus sama dengan total invoice.'
  if (msg.includes('reverted')) return 'Transaksi ditolak kontrak. Periksa nominal.'
  if (msg.includes('network') || msg.includes('timeout')) return 'Gangguan jaringan. Coba lagi.'
  return 'Terjadi kesalahan. Coba lagi.'
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
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [amount, setAmount] = useState(prefillAmount || '')
  const [step, setStep] = useState<'form' | 'approve' | 'pay' | 'done'>('form')
  const [successHash, setSuccessHash] = useState('')

  const chain = requireChain(ARC_TESTNET_CHAIN_ID)
  const usdcAddress = USDC_FACT?.address as `0x${string}` | undefined

  // USDC balance
  const { data: rawBalance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address && !!USDC_FACT },
  })

  // USDC allowance for registry
  const { data: rawAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, LOVEPAY_CONTRACT.address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address && !!USDC_FACT },
  })

  // Read merchant from payment link if linkId provided
  const { data: linkData } = useReadContract({
    ...LOVEPAY_CONTRACT,
    functionName: 'paymentLinks',
    args: linkId && linkId !== ZERO_BYTES32 ? [linkId as `0x${string}`] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!linkId && linkId.length > 20 },
  })

  type LinkTuple = readonly [string, string, string, bigint, string, boolean, bigint, boolean, bigint]
  const linkTuple = linkData as LinkTuple | undefined
  // Invoice checkout: merchant comes from URL param; link checkout: merchant from link data
  const merchantAddress = (merchantProp || linkTuple?.[1] || null) as `0x${string}` | null

  const formattedBalance = rawBalance != null
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)).toFixed(2)
    : null

  const { approve, isPending: isApprovePending, isSuccess: isApproveSuccess, isConfirming: isApproveConfirming } = useApproveUsdc()
  const { pay, hash: payHash, isPending: isPayPending, isConfirming: isPayConfirming, isSuccess: isPaySuccess, error: payError } = usePay()

  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID

  const parsedAmount = amount ? (() => { try { return parseAmount(ARC_TESTNET_CHAIN_ID, amount) } catch { return null } })() : null
  const hasAmount = !!parsedAmount && Number(amount) > 0
  const hasAllowance = rawAllowance != null && parsedAmount != null && (rawAllowance) >= parsedAmount.raw
  const needsApprove = hasAmount && !hasAllowance

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Izin USDC diberikan!')
      void refetchAllowance()
      setStep('pay')
    }
  }, [isApproveSuccess, refetchAllowance])

  useEffect(() => {
    if (isPaySuccess && payHash) {
      setSuccessHash(payHash)
      setStep('done')
      onSuccess(payHash)
      toast.success('Pembayaran berhasil!')
      // Simpan tx hash ke localStorage agar Riwayat bisa tampilkan link Explorer
      try {
        const stored = JSON.parse(localStorage.getItem('lovepay_tx_hashes') ?? '[]') as Array<{ hash: string; ts: number }>
        stored.push({ hash: payHash, ts: Math.floor(Date.now() / 1000) })
        // Simpan maksimal 200 entry
        if (stored.length > 200) stored.splice(0, stored.length - 200)
        localStorage.setItem('lovepay_tx_hashes', JSON.stringify(stored))
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaySuccess, payHash])

  useEffect(() => {
    if (payError) toast.error(parseOnchainError(payError))
  }, [payError])

  const handleAction = () => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (!hasAmount || !merchantAddress || !address) return
    if (needsApprove) {
      approve(parsedAmount.raw)
      setStep('approve')
    } else {
      pay(
        merchantAddress,
        amount,
        (linkId && linkId.length > 20 && !invoiceId ? linkId : ZERO_BYTES32) as `0x${string}`,
        (invoiceId && invoiceId.length > 20 ? invoiceId : ZERO_BYTES32) as `0x${string}`,
        memo,
      )
      setStep('pay')
    }
  }

  const txUrl = successHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, successHash) : null
  const isPending = isApprovePending || isPayPending
  const isConfirming = isApproveConfirming || isPayConfirming

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-8 pb-24 px-4" style={{ background: 'var(--bg-gradient)' }}>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Kembali
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
                <div className="display text-xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Pembayaran Berhasil!</div>
                <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>USDC {Number(amount).toLocaleString('id-ID')} telah dikirim</div>
                {memo && <div className="text-sm mb-4" style={{ color: 'var(--subtle)' }}>"{memo}"</div>}
                {txUrl && (
                  <a href={txUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#1061a6' }}>
                    Lihat Transaksi <ExternalLink className="w-3.5 h-3.5" />
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
                        {merchantAddress ? `${merchantAddress.slice(0, 10)}…${merchantAddress.slice(-4)}` : 'Merchant Lovepay'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--subtle)' }}>{memo || 'Pembayaran Lovepay'}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-2)' }}>Jumlah Pembayaran (USDC)</div>
                    {prefillAmount ? (
                      <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                        <div className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{Number(prefillAmount).toLocaleString('id-ID')}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>USDC · Arc Testnet</div>
                      </div>
                    ) : (
                      <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)' }}>
                        <input type="number" inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                          className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300" style={{ color: 'var(--ink)' }} />
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--subtle)' }}>USDC</span>
                          {formattedBalance && (
                            <button onClick={() => setAmount(formattedBalance)} className="text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>
                              Saldo: {formattedBalance} · Maks
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
                      Langkah 1/2: Izinkan kontrak menggunakan USDC kamu, lalu konfirmasi pembayaran.
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="text-center py-4">
                      <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Hubungkan wallet untuk membayar</div>
                      <div className="flex justify-center"><ConnectKitButton /></div>
                    </div>
                  ) : wrongChain ? (
                    <button onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white" style={{ background: '#b45309' }}>
                      Ganti ke Arc Testnet
                    </button>
                  ) : (
                    <button disabled={!hasAmount || !merchantAddress || isPending || isConfirming}
                      onClick={handleAction}
                      className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'var(--love)' }}>
                      {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Konfirmasi di wallet…</>
                        : isConfirming ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</>
                        : needsApprove ? `Izinkan & Bayar ${amount ? Number(amount).toLocaleString('id-ID') + ' USDC' : ''}`
                        : `Bayar${amount ? ` ${Number(amount).toLocaleString('id-ID')} USDC` : ''}`}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 justify-center">
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--subtle)' }} />
                <span className="text-xs" style={{ color: 'var(--subtle)' }}>Disimpan di smart contract · {chain.name}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
