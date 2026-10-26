import { useState, useEffect, startTransition } from 'react'
import { Plus, Link2, Copy, Check, QrCode, Loader2, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useMerchantLinkIds, usePaymentLink, useCreatePaymentLink, useDeactivatePaymentLink, useArcChainId, useIsMerchant } from '../store'
import { formatUSDC } from './format-utils'
import QRModal from './QRModal'
import { parseAmount, formatUsdc } from '@/onchain-money'

function LinkCard({ linkId, onShowQR }: { linkId: string; onShowQR: (id: string, title: string, amount: bigint, memo: string) => void }) {
  const { link } = usePaymentLink(linkId)
  const { deactivate, isPending, isSuccess } = useDeactivatePaymentLink()
  const chainId = useArcChainId()
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (isSuccess) toast.success('Link deactivated') }, [isSuccess])

  if (!link) return null

  // link.amount is raw onchain (6 decimals) — convert to display USDC string for URL
  const amountDisplay = link.amount ? formatUsdc(link.amount) : ''
  const url = `${window.location.origin}?checkout=${linkId}&amount=${amountDisplay}&memo=${encodeURIComponent(link.memo)}&chain=${chainId}`
  const handleCopy = () => {
    void navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4"
      style={{ background: 'var(--surface-strong)', border: `1px solid ${link.active ? 'var(--border)' : 'var(--border)'}`, opacity: link.active ? 1 : 0.6 }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--ink)' }}>{link.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {link.amount > 0n ? `$${formatUSDC(link.amount)} USDC · ` : 'Open amount · '}
            {link.multiUse ? 'Multi-use' : 'Single-use'}
            {link.paidCount > 0n ? ` · ${link.paidCount.toString()}× paid` : ''}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{
          background: link.active ? 'rgba(26,128,71,0.1)' : 'rgba(100,100,100,0.1)',
          color: link.active ? 'var(--success)' : 'var(--muted)',
        }}>
          {link.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      {link.memo ? <p className="text-xs mb-3 truncate" style={{ color: 'var(--subtle)' }}>{link.memo}</p> : <div className="mb-3" />}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button onClick={() => onShowQR(linkId, link.title, link.amount, link.memo)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          <QrCode className="w-3.5 h-3.5" /> QR Code
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </a>
        {link.active && (
          <button
            onClick={() => deactivate(linkId as `0x${string}`)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
            style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Deactivate'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface Props { merchantAddress: string; onGoToDashboard: () => void }

export default function PaymentLinks({ merchantAddress, onGoToDashboard }: Props) {
  const chainId = useArcChainId()
  const { isMerchant } = useIsMerchant(merchantAddress)
  const { linkIds, isLoading, refetch } = useMerchantLinkIds(merchantAddress)
  const { create, isPending, isConfirming, isSuccess, error } = useCreatePaymentLink()
  const [showSheet, setShowSheet] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [multiUse, setMultiUse] = useState(true)
  const [qrTarget, setQrTarget] = useState<{ id: string; title: string; amount: bigint; memo: string } | null>(null)

  useEffect(() => {
    if (isSuccess) {
      toast.success('Payment link created!')
      startTransition(() => {
        setShowSheet(false)
        setTitle('')
        setAmount('')
        setMemo('')
      })
      void refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  useEffect(() => { if (error) toast.error('Failed to create link. Please try again.') }, [error])

  const handleCreate = () => {
    if (!title.trim()) return
    let parsedAmount = 0n
    if (amount.trim()) {
      try { parsedAmount = parseAmount(chainId, amount).raw }
      catch { toast.error('Invalid amount'); return }
    }
    create(title.trim(), parsedAmount, memo.trim(), multiUse)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Payment Link</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{linkIds.length} links · live data from blockchain</p>
        </div>
        <button
          onClick={() => isMerchant ? setShowSheet(true) : onGoToDashboard()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 14px var(--love-glow)' }}
        >
          <Plus className="w-4 h-4" /> Create Link
        </button>
      </div>

      {isMerchant === false && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(232,62,140,0.06)', border: '1px solid rgba(232,62,140,0.2)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(232,62,140,0.12)' }}>
            <Link2 className="w-4 h-4" style={{ color: 'var(--love)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Register your business first</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>You need to register as a merchant before creating payment links.</p>
            <button onClick={onGoToDashboard} className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: 'var(--love)' }}>
              Go to Dashboard → Register
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2" style={{ color: 'var(--muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading from blockchain…
        </div>
      ) : linkIds.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <Link2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>No payment links yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Create your first link and share it with customers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...linkIds].reverse().map(id => (
            <LinkCard key={id} linkId={id} onShowQR={(id, title, amount, memo) => setQrTarget({ id, title, amount, memo })} />
          ))}
        </div>
      )}

      {/* Create modal — centered */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSheet(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Create Payment Link</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Link stored permanently on blockchain</p>
                </div>
                <button onClick={() => setShowSheet(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-all hover:bg-gray-100" style={{ color: 'var(--muted)' }}>×</button>
              </div>

              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Link title *" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="USDC amount (leave empty = open)" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Description (optional)" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span className="text-sm flex-1" style={{ color: 'var(--ink-2)' }}>Allow multiple payments</span>
                  <button onClick={() => setMultiUse(v => !v)} className="relative w-10 h-6 rounded-full transition-colors" style={{ background: multiUse ? 'var(--love)' : 'var(--border-strong)' }}>
                    <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: multiUse ? '1.25rem' : '0.25rem' }} />
                  </button>
                </div>
              </div>
              <button
                disabled={!title.trim() || isPending || isConfirming}
                onClick={handleCreate}
                className="w-full mt-4 py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 14px var(--love-glow)' }}
              >
                {isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirm…</span>
                  : isConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</span>
                  : 'Create Link'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {qrTarget && (() => {
        const amountDisplay = qrTarget.amount > 0n ? formatUsdc(qrTarget.amount) : ''
        const qrUrl = `${window.location.origin}?checkout=${qrTarget.id}&amount=${amountDisplay}&memo=${encodeURIComponent(qrTarget.memo)}&chain=${chainId}`
        return (
          <QRModal
            url={qrUrl}
            title={qrTarget.title}
            amount={amountDisplay}
            memo={qrTarget.memo}
            onClose={() => setQrTarget(null)}
          />
        )
      })()}
    </div>
  )
}
