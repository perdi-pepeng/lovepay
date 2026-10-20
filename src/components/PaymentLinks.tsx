import { useState, useEffect, startTransition } from 'react'
import { Plus, Link2, Copy, Check, QrCode, Loader2, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useMerchantLinkIds, usePaymentLink, useCreatePaymentLink, useDeactivatePaymentLink } from '../store'
import { formatUSDC } from './format-utils'
import QRModal from './QRModal'
import { parseAmount } from '@/onchain-money'
import { ARC_TESTNET_CHAIN_ID } from '../contract'

function LinkCard({ linkId, onShowQR }: { linkId: string; onShowQR: (id: string, title: string, amount: bigint, memo: string) => void }) {
  const { link } = usePaymentLink(linkId)
  const { deactivate, isPending, isSuccess } = useDeactivatePaymentLink()
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (isSuccess) toast.success('Link dinonaktifkan') }, [isSuccess])

  if (!link) return null

  const url = `${window.location.origin}?checkout=${linkId}&amount=${link.amount ?? ''}&memo=${encodeURIComponent(link.memo)}`
  const handleCopy = () => {
    void navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link disalin!')
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
            {link.amount > 0n ? `$${formatUSDC(link.amount)} USDC · ` : 'Bebas · '}
            {link.multiUse ? 'Multi-pakai' : 'Sekali pakai'}
            {link.paidCount > 0n ? ` · ${link.paidCount.toString()}× terbayar` : ''}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0" style={{
          background: link.active ? 'rgba(26,128,71,0.1)' : 'rgba(100,100,100,0.1)',
          color: link.active ? 'var(--success)' : 'var(--muted)',
        }}>
          {link.active ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      {link.memo ? <p className="text-xs mb-3 truncate" style={{ color: 'var(--subtle)' }}>{link.memo}</p> : <div className="mb-3" />}
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Tersalin' : 'Salin Link'}
        </button>
        <button onClick={() => onShowQR(linkId, link.title, link.amount, link.memo)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          <QrCode className="w-3.5 h-3.5" /> QR Code
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          <ExternalLink className="w-3.5 h-3.5" /> Buka
        </a>
        {link.active && (
          <button
            onClick={() => deactivate(linkId as `0x${string}`)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-40"
            style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Nonaktifkan'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface Props { merchantAddress: string }

export default function PaymentLinks({ merchantAddress }: Props) {
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
      toast.success('Payment link dibuat!')
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

  useEffect(() => { if (error) toast.error('Gagal membuat link. Coba lagi.') }, [error])

  const handleCreate = () => {
    if (!title.trim()) return
    let parsedAmount = 0n
    if (amount.trim()) {
      try { parsedAmount = parseAmount(ARC_TESTNET_CHAIN_ID, amount).raw }
      catch { toast.error('Nominal tidak valid'); return }
    }
    create(title.trim(), parsedAmount, memo.trim(), multiUse)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Payment Link</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{linkIds.length} link · data live dari blockchain</p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 14px var(--love-glow)' }}
        >
          <Plus className="w-4 h-4" /> Buat Link
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2" style={{ color: 'var(--muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat dari blockchain…
        </div>
      ) : linkIds.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <Link2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Belum ada payment link</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Buat link pertama dan bagikan ke pelanggan.</p>
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
                  <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Buat Payment Link</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Link tersimpan permanen di blockchain</p>
                </div>
                <button onClick={() => setShowSheet(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-all hover:bg-gray-100" style={{ color: 'var(--muted)' }}>×</button>
              </div>

              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul link *" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="Nominal USDC (kosongkan = bebas)" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Deskripsi (opsional)" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--border)' }} />
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span className="text-sm flex-1" style={{ color: 'var(--ink-2)' }}>Bisa dipakai berkali-kali</span>
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
                {isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Konfirmasi…</span>
                  : isConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</span>
                  : 'Buat Link'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {qrTarget && (
        <QRModal
          linkId={qrTarget.id}
          title={qrTarget.title}
          amount={qrTarget.amount > 0n ? formatUSDC(qrTarget.amount) : ''}
          memo={qrTarget.memo}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  )
}
