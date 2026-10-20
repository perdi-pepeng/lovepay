import { X, Shield, Zap, ExternalLink, Copy, Check, QrCode } from 'lucide-react'
import LovepayLogo from './LovepayLogo'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { LOVEPAY_CONTRACT, ARC_TESTNET_CHAIN_ID } from '../contract'
import { buildAddressExplorerUrl, requireChain } from '@/onchain-facts'

interface Props { open: boolean; onClose: () => void }

export default function AboutModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const chain = requireChain(ARC_TESTNET_CHAIN_ID)
  const explorerUrl = buildAddressExplorerUrl(ARC_TESTNET_CHAIN_ID, LOVEPAY_CONTRACT.address)

  const copyAddress = () => {
    void navigator.clipboard.writeText(LOVEPAY_CONTRACT.address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Gradient header bar */}
            <div className="h-1" style={{ background: 'var(--gradient-love)' }} />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <LovepayLogo size={48} className="shrink-0" />
                <div>
                  <div className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>Lovepay</div>
                  <div className="text-xs font-medium tracking-wide" style={{ color: 'var(--subtle)' }}>Payment Gateway · Onchain</div>
                </div>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-muted)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-4">
              {/* Tagline */}
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                Platform pembayaran USDC berbasis blockchain. Terima pembayaran dari mana saja,
                tanpa bank, tanpa perantara — semua transaksi tersimpan permanen di smart contract.
              </p>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Shield, label: 'Immutable', sub: 'Kontrak permanen' },
                  { icon: Zap,    label: 'Sub-second', sub: 'Arc Testnet' },
                  { icon: QrCode, label: 'USDC Only', sub: 'Stablecoin' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="rounded-2xl p-3 text-center"
                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--love)' }} />
                    <div className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{label}</div>
                    <div className="text-[10px]" style={{ color: 'var(--subtle)' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Contract info */}
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
                  Info Kontrak
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Network</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{chain.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Chain ID</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: 'var(--ink)' }}>{ARC_TESTNET_CHAIN_ID}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>Currency</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>USDC</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>Contract</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-mono truncate" style={{ color: 'var(--ink)' }}>
                        {LOVEPAY_CONTRACT.address.slice(0, 10)}…{LOVEPAY_CONTRACT.address.slice(-6)}
                      </span>
                      <button onClick={copyAddress} className="shrink-0 w-5 h-5 flex items-center justify-center rounded"
                        style={{ color: copied ? 'var(--success)' : 'var(--subtle)' }}>
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explorer link */}
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>
                <ExternalLink className="w-4 h-4" />
                Lihat di Arc Explorer
              </a>

              <p className="text-center text-[10px]" style={{ color: 'var(--subtle)' }}>
                Lovepay v1.0 · Built on Arc Testnet · Powered by Circle USDC
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
