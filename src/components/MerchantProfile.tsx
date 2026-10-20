import { useState, useEffect, startTransition } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, CheckCircle2, XCircle, Copy, Check, Loader2, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useMerchant, useCircleWrite } from '../store'
import { LOVEPAY_CONTRACT, ARC_TESTNET_CHAIN_ID } from '../contract'
import { buildAddressExplorerUrl } from '@/onchain-facts'
import { type Abi } from 'viem'

const CONTRACT_ABI = LOVEPAY_CONTRACT.abi as Abi

const BIZ_LABELS: Record<string, string> = {
  retail: 'Retail / E-commerce',
  services: 'Jasa / Konsultasi',
  food: 'Kuliner / F&B',
  digital: 'Produk Digital',
  education: 'Pendidikan',
  other: 'Lainnya',
}

interface Props { merchantAddress: string }

export default function MerchantProfile({ merchantAddress }: Props) {
  const { merchant, isLoading, refetch } = useMerchant(merchantAddress)
  const { write, isPending, isConfirming, isSuccess, error } = useCircleWrite()

  const [editing, setEditing] = useState(false)
  // Initialize directly from merchant (avoids set-state-in-effect)
  const [name, setName] = useState(() => merchant?.name ?? '')
  const [email, setEmail] = useState(() => merchant?.email ?? '')
  const [bizType, setBizType] = useState(() => merchant?.businessType ?? '')
  const [copied, setCopied] = useState(false)

  // Sync form when merchant data first arrives (merchant was undefined on mount)
  const merchantName = merchant?.name ?? ''
  const merchantEmail = merchant?.email ?? ''
  const merchantBizType = merchant?.businessType ?? ''
  if (!editing && merchantName && name !== merchantName) setName(merchantName)
  if (!editing && merchantEmail && email !== merchantEmail) setEmail(merchantEmail)
  if (!editing && merchantBizType && bizType !== merchantBizType) setBizType(merchantBizType)

  // On save success
  useEffect(() => {
    if (isSuccess) {
      toast.success('Profil berhasil diperbarui!')
      startTransition(() => setEditing(false))
      void refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  useEffect(() => {
    if (error) toast.error('Gagal menyimpan. Coba lagi.')
  }, [error])

  const handleSave = () => {
    if (!name.trim() || !email.trim() || !bizType) return
    void write({
      address: LOVEPAY_CONTRACT.address,
      abi: CONTRACT_ABI,
      functionName: 'updateMerchant',
      args: [name.trim(), email.trim(), bizType],
    })
  }

  const copyAddress = () => {
    void navigator.clipboard.writeText(merchantAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registeredDate = merchant?.registeredAt
    ? new Date(Number(merchant.registeredAt) * 1000).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  const explorerUrl = buildAddressExplorerUrl(ARC_TESTNET_CHAIN_ID, merchantAddress)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2" style={{ color: 'var(--muted)' }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat profil…
      </div>
    )
  }

  if (!merchant || !merchant.registeredAt) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Akun merchant belum terdaftar.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Profil Merchant</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Data tersimpan permanen di blockchain Arc Testnet</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid var(--love)' }}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium w-fit"
        style={{
          background: merchant.active ? '#dcfce718' : '#fef2f218',
          border: `1px solid ${merchant.active ? '#bbf7d0' : '#fecaca'}`,
          color: merchant.active ? 'var(--success)' : 'var(--danger)',
        }}
      >
        {merchant.active
          ? <><CheckCircle2 className="w-4 h-4" /> Akun Aktif</>
          : <><XCircle className="w-4 h-4" /> Akun Nonaktif</>}
      </div>

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
        {editing ? (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Nama Bisnis</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Email Kontak</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>Jenis Bisnis</label>
              <select
                value={bizType}
                onChange={e => setBizType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              >
                <option value="">Pilih kategori…</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="services">Jasa / Konsultasi</option>
                <option value="food">Kuliner / F&amp;B</option>
                <option value="digital">Produk Digital</option>
                <option value="education">Pendidikan</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!name.trim() || !email.trim() || !bizType || isPending || isConfirming}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'var(--love)' }}
              >
                {(isPending || isConfirming)
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan…</>
                  : <><Save className="w-3.5 h-3.5" /> Simpan</>}
              </button>
              <button
                onClick={() => { setEditing(false); setName(merchant.name); setEmail(merchant.email); setBizType(merchant.businessType) }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                <X className="w-3.5 h-3.5" /> Batal
              </button>
            </div>
          </div>
        ) : (
          <div>
            {[
              { label: 'Nama Bisnis', value: merchant.name },
              { label: 'Email Kontak', value: merchant.email },
              { label: 'Jenis Bisnis', value: BIZ_LABELS[merchant.businessType] ?? merchant.businessType },
              { label: 'Terdaftar Sejak', value: registeredDate },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-start justify-between px-5 py-4"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span className="text-xs font-semibold uppercase tracking-wide w-36 shrink-0 pt-0.5" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                <span className="text-sm font-medium text-right" style={{ color: 'var(--ink)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wallet address card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--subtle)' }}>Wallet Address</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-xs break-all font-mono" style={{ color: 'var(--ink)' }}>{merchantAddress}</code>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={copyAddress}
              className="p-2 rounded-lg transition-all"
              style={{ background: 'var(--surface-muted)', color: copied ? 'var(--success)' : 'var(--muted)' }}
              title="Salin alamat"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg transition-all text-xs font-semibold"
              style={{ background: 'var(--love-soft)', color: 'var(--love)' }}
            >
              Explorer
            </a>
          </div>
        </div>
      </div>

      {/* Blockchain info */}
      <p className="text-xs text-center pb-4" style={{ color: 'var(--subtle)' }}>
        Data disimpan di smart contract · Arc Testnet · Terdaftar {registeredDate}
      </p>
    </motion.div>
  )
}
