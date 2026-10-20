import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterMerchant } from '../store'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_TESTNET_CHAIN_ID } from '../contract'

interface Props { address: string }

export default function MerchantOnboarding({ address }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bizType, setBizType] = useState('')
  const { register, hash, isPending, isConfirming, isSuccess, error } = useRegisterMerchant()

  useEffect(() => {
    if (isSuccess) {
      toast.success('Merchant berhasil terdaftar!')
      setTimeout(() => window.location.reload(), 1500)
    }
  }, [isSuccess])

  useEffect(() => {
    if (error) toast.error('Pendaftaran gagal. Coba lagi.')
  }, [error])

  const valid = name.trim().length > 0 && email.trim().length > 0 && bizType.trim().length > 0
  const txUrl = hash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, hash) : null

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg-gradient)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl p-8"
        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
      >
        <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center" style={{ background: 'var(--love-soft)' }}>
          <span style={{ color: 'var(--love)', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20 }}>L</span>
        </div>
        <h1 className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Daftar sebagai Merchant</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Data kamu disimpan permanen di blockchain. Hanya perlu sekali.</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: 'var(--subtle)' }}>Nama Bisnis</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Contoh: Toko Digital Abadi"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: 'var(--subtle)' }}>Email Kontak</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="merchant@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: 'var(--subtle)' }}>Jenis Bisnis</label>
            <select
              value={bizType} onChange={e => setBizType(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: bizType ? 'var(--ink)' : 'var(--subtle)', border: '1px solid var(--border)' }}
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
        </div>

        <div className="mt-2 mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
          Wallet: <span className="mono">{address.slice(0, 10)}…{address.slice(-6)}</span>
        </div>

        {isSuccess && txUrl && (
          <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="w-4 h-4" />
            <a href={txUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">Lihat transaksi</a>
          </div>
        )}

        <button
          disabled={!valid || isPending || isConfirming}
          onClick={() => register(name.trim(), email.trim(), bizType)}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'var(--accent)' }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Konfirmasi di wallet…</span>
          ) : isConfirming ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Memproses…</span>
          ) : 'Daftar Sekarang'}
        </button>
      </motion.div>
    </div>
  )
}
