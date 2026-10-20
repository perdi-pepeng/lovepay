import { useState, useEffect } from 'react'
import { TrendingUp, ArrowUpRight, CheckCircle2, XCircle, Loader2, Store, ChevronRight, DollarSign, Activity, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useMerchant, useAllMyPaymentIds, usePayment, useUsdcBalance, useRegisterMerchant } from '../store'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_TESTNET_CHAIN_ID } from '../contract'
import { formatUSDC, StatusBadge } from './format-utils'

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

function RecentPaymentRow({ paymentId, myAddress }: { paymentId: string; myAddress: string }) {
  const { payment } = usePayment(paymentId)
  if (!payment) return null
  const isIncoming = payment.merchant.toLowerCase() === myAddress.toLowerCase()
  const hasTxRef = payment.txRef && payment.txRef !== ZERO_BYTES32
  const txUrl = hasTxRef ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, payment.txRef) : null
  const counterparty = isIncoming ? payment.payer : payment.merchant
  return (
    <div className="flex items-center gap-3 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isIncoming ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
        <DollarSign className="w-4 h-4" style={{ color: isIncoming ? 'var(--success)' : 'var(--danger)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate mono" style={{ color: 'var(--ink)' }}>
          {counterparty.slice(0, 6)}…{counterparty.slice(-4)}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
          {isIncoming ? 'Masuk' : 'Keluar'} · {payment.memo || 'Pembayaran langsung'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums" style={{ color: isIncoming ? 'var(--success)' : 'var(--danger)' }}>
          {isIncoming ? '+' : '-'}${formatUSDC(payment.amount)}
        </p>
        <StatusBadge status={payment.status} />
      </div>
      {txUrl && (
        <a href={txUrl} target="_blank" rel="noreferrer"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'var(--subtle)' }}>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

// ─── Merchant Setup Banner ────────────────────────────────────────────────────
function MerchantSetupBanner({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bizType, setBizType] = useState('')
  const { register, isPending, isConfirming, isSuccess, error } = useRegisterMerchant()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      toast.success('Merchant berhasil terdaftar!')
      void queryClient.invalidateQueries()
      setTimeout(onDone, 1500)
    }
  }, [isSuccess, onDone, queryClient])

  useEffect(() => {
    if (error) toast.error('Pendaftaran gagal. Coba lagi.')
  }, [error])

  const valid = name.trim().length > 0 && email.trim().length > 0 && bizType.length > 0
  const busy = isPending || isConfirming

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(244,63,143,0.30)', background: 'rgba(244,63,143,0.05)' }}
        >
          <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 12px var(--love-glow)' }}>
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--love)' }}>Lengkapi profil merchant kamu</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Diperlukan untuk mulai menerima pembayaran</p>
            </div>
            <ChevronRight
              className="w-4 h-4 transition-transform shrink-0"
              style={{ color: 'var(--love)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div className="px-5 pb-5 pt-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Nama Bisnis</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Toko Digital Abadi"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1"
                  style={{ ...inputStyle, '--tw-ring-color': 'var(--love)' } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Email Kontak</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="merchant@email.com"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Jenis Bisnis</label>
              <select
                value={bizType} onChange={e => setBizType(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ ...inputStyle, color: bizType ? 'var(--ink)' : 'var(--subtle)' }}
              >
                <option value="">Pilih kategori…</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="services">Jasa / Konsultasi</option>
                <option value="food">Kuliner / F&B</option>
                <option value="digital">Produk Digital</option>
                <option value="education">Pendidikan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            <button
              disabled={!valid || busy}
              onClick={() => register(name.trim(), email.trim(), bizType)}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-love"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Konfirmasi di wallet…</span>
              ) : isConfirming ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Menyimpan ke blockchain…</span>
              ) : isSuccess ? (
                <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Terdaftar!</span>
              ) : 'Daftar Sekarang'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface Props { onViewAll: () => void; merchantAddress: string; isMerchant: boolean }

export default function Dashboard({ onViewAll, merchantAddress, isMerchant }: Props) {
  const { merchant, refetch } = useMerchant(merchantAddress)
  const { allIds, received, isLoading: idsLoading } = useAllMyPaymentIds(merchantAddress)
  const { balance } = useUsdcBalance(merchantAddress)
  const [todayStr] = useState(() => new Date().toDateString())

  // 5 transaksi terbaru dari semua yang melibatkan merchant ini
  const recentIds = [...allIds].reverse().slice(0, 5)

  const stats = [
    {
      label: 'Saldo USDC',
      value: balance != null ? `$${formatUSDC(balance)}` : '—',
      sub: 'Saldo wallet kamu',
      icon: Wallet,
      gradient: 'var(--gradient-green)',
      glow: 'rgba(16,185,129,0.20)',
    },
    {
      label: 'Total Transaksi Diterima',
      value: `${received.length}`,
      sub: allIds.length > received.length ? `+ ${allIds.length - received.length} transaksi keluar` : 'Semua pembayaran masuk',
      icon: Activity,
      gradient: 'var(--gradient-blue)',
      glow: 'rgba(99,102,241,0.20)',
    },
    {
      label: 'Status Akun',
      value: merchant?.active ? 'Aktif' : (isMerchant ? 'Nonaktif' : 'Belum daftar'),
      sub: merchant?.businessType ?? '—',
      icon: merchant?.active ? CheckCircle2 : XCircle,
      gradient: merchant?.active ? 'var(--gradient-green)' : 'linear-gradient(135deg,#f43f8f,#ef4444)',
      glow: merchant?.active ? 'rgba(16,185,129,0.20)' : 'rgba(244,63,143,0.20)',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="display font-bold tracking-tight mb-1" style={{ fontSize: '1.75rem', color: 'var(--ink)' }}>
          {merchant?.name ?? (isMerchant ? '…' : 'Merchant Dashboard')}
        </h1>
        <p className="text-sm" style={{ color: 'var(--subtle)' }}>
          {new Date(todayStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="mx-2 opacity-30">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
            Semua sistem berjalan normal
          </span>
        </p>
      </div>

      {/* Setup banner */}
      {!isMerchant && <MerchantSetupBanner onDone={() => void refetch()} />}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: `0 0 24px ${s.glow}` }}>
            {/* Subtle glow blob */}
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-30 blur-2xl pointer-events-none" style={{ background: s.gradient }} />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.gradient, boxShadow: `0 4px 12px ${s.glow}` }}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
              <p className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent payments */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        {/* Card header with gradient top strip */}
        <div className="h-0.5" style={{ background: 'var(--gradient-love)' }} />
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--love)' }} />
            <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>Transaksi Terbaru</h2>
          </div>
          <button onClick={onViewAll}
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--accent)' }}>
            Lihat semua <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5">
          {idsLoading ? (
            <div className="flex items-center justify-center py-10 gap-2" style={{ color: 'var(--muted)' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat transaksi…
            </div>
          ) : recentIds.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
                <Activity className="w-6 h-6" style={{ color: 'var(--subtle)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Belum ada transaksi</p>
              <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>Bagikan payment link kamu untuk mulai menerima pembayaran</p>
            </div>
          ) : (
            recentIds.map(id => <RecentPaymentRow key={id} paymentId={id} myAddress={merchantAddress} />)
          )}
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
        Data tersimpan di smart contract · Arc Testnet · {new Date(todayStr).toLocaleDateString('id-ID')}
      </p>
    </div>
  )
}
