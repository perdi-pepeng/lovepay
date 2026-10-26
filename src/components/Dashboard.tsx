import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2, Store, ChevronRight, Activity, Wallet, Globe, Instagram, Twitter, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useMerchant, useAllMyPaymentIds, useUsdcBalance, useRegisterMerchant, useArcChainId } from '../store'
import { formatUSDC } from './format-utils'
import AboutSection from './AboutSection'

// ─── Merchant Setup Banner ────────────────────────────────────────────────────
function MerchantSetupBanner({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bizType, setBizType] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const { register, isPending, isConfirming, isSuccess, error } = useRegisterMerchant()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (isSuccess) {
      toast.success('Merchant registered successfully!')
      void queryClient.invalidateQueries()
      setTimeout(onDone, 1500)
    }
  }, [isSuccess, onDone, queryClient])

  useEffect(() => {
    if (error) toast.error('Registration failed. Please try again.')
  }, [error])

  const valid = name.trim().length > 0 && email.trim().length > 0 && bizType.length > 0
  const busy = isPending || isConfirming

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
  }
  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none'
  const labelCls = 'block text-xs font-semibold mb-1.5 uppercase tracking-wide'

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
              <p className="text-sm font-bold" style={{ color: 'var(--love)' }}>Complete your merchant profile</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Required to start accepting payments</p>
            </div>
            <ChevronRight
              className="w-4 h-4 transition-transform shrink-0"
              style={{ color: 'var(--love)', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div className="px-5 pb-5 pt-1 space-y-3">
            {/* Required fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={{ color: 'var(--subtle)' }}>
                  Business Name <span style={{ color: 'var(--love)' }}>*</span>
                </label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="My Digital Store"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: 'var(--subtle)' }}>
                  Contact Email <span style={{ color: 'var(--love)' }}>*</span>
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="merchant@email.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--subtle)' }}>
                Business Type <span style={{ color: 'var(--love)' }}>*</span>
              </label>
              <select
                value={bizType} onChange={e => setBizType(e.target.value)}
                className={inputCls}
                style={{ ...inputStyle, color: bizType ? 'var(--ink)' : 'var(--subtle)' }}
              >
                <option value="">Select category…</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="services">Services / Consulting</option>
                <option value="food">Food &amp; Beverage</option>
                <option value="digital">Digital Products</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Social media — optional */}
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--subtle)' }}>
                Social Media <span className="normal-case font-normal tracking-normal ml-1" style={{ color: 'var(--muted)' }}>(optional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
                  <input value={website} onChange={e => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={inputCls} style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
                  <input value={instagram} onChange={e => setInstagram(e.target.value)}
                    placeholder="Instagram (without @)"
                    className={inputCls} style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                </div>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
                  <input value={twitter} onChange={e => setTwitter(e.target.value)}
                    placeholder="X / Twitter (without @)"
                    className={inputCls} style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted)' }} />
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (+628xx…)"
                    className={inputCls} style={{ ...inputStyle, paddingLeft: '2.25rem' }} />
                </div>
              </div>
            </div>

            <button
              disabled={!valid || busy}
              onClick={() => register({ name: name.trim(), email: email.trim(), businessType: bizType, website, instagram, twitter, whatsapp })}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--gradient-love)' }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet…</span>
              ) : isConfirming ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving to blockchain…</span>
              ) : isSuccess ? (
                <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" />Registered!</span>
              ) : 'Register Now'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface Props { merchantAddress: string; isMerchant: boolean }

export default function Dashboard({ merchantAddress, isMerchant }: Props) {
  const chainId = useArcChainId()
  const chainLabel = chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'
  const { merchant, refetch } = useMerchant(merchantAddress)
  const { allIds, received } = useAllMyPaymentIds(merchantAddress)
  const { balance } = useUsdcBalance(merchantAddress)
  const [todayStr] = useState(() => new Date().toDateString())

  const stats = [
    {
      label: 'USDC Balance',
      value: balance != null ? `$${formatUSDC(balance)}` : '—',
      sub: 'Your wallet balance',
      icon: Wallet,
      gradient: 'var(--gradient-green)',
      glow: 'rgba(16,185,129,0.20)',
    },
    {
      label: 'Total Received',
      value: `${received.length}`,
      sub: allIds.length > received.length ? `+ ${allIds.length - received.length} outgoing` : 'All incoming payments',
      icon: Activity,
      gradient: 'var(--gradient-blue)',
      glow: 'rgba(99,102,241,0.20)',
    },
    {
      label: 'Account Status',
      value: merchant?.active ? 'Active' : (isMerchant ? 'Inactive' : 'Not registered'),
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
          {new Date(todayStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="mx-2 opacity-30">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--success)' }} />
            All systems operational
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

      <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
        Data stored on smart contract · {chainLabel} · {new Date(todayStr).toLocaleDateString('en-US')}
      </p>

      <AboutSection />
    </div>
  )
}
