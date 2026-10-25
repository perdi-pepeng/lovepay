import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, Globe, Instagram, Twitter, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterMerchant, useArcChainId, type MerchantFormData } from '../store'
import { buildTxExplorerUrl } from '@/onchain-facts'

interface Props { address: string }

export default function MerchantOnboarding({ address }: Props) {
  const chainId = useArcChainId()
  const [form, setForm] = useState<MerchantFormData>({
    name: '', email: '', businessType: '',
    website: '', instagram: '', twitter: '', whatsapp: '',
  })
  const { register, hash, isPending, isConfirming, isSuccess, error } = useRegisterMerchant()

  useEffect(() => {
    if (isSuccess) {
      toast.success('Merchant registered successfully!')
      setTimeout(() => window.location.reload(), 1500)
    }
  }, [isSuccess])

  useEffect(() => {
    if (error) toast.error('Registration failed. Please try again.')
  }, [error])

  const set = (k: keyof MerchantFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const valid = form.name.trim().length > 0 && form.email.trim().length > 0 && form.businessType.trim().length > 0
  const txUrl = hash ? buildTxExplorerUrl(chainId, hash) : null

  const inputCls = 'w-full rounded-xl px-4 py-3 text-sm outline-none'
  const inputStyle = { background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }
  const labelCls = 'block text-xs font-semibold mb-1.5 tracking-wide uppercase'
  const labelStyle = { color: 'var(--subtle)' }

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
        <h1 className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Register as Merchant</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Your data is stored permanently on the blockchain. Only needs to be done once.</p>

        <div className="space-y-3">
          {/* Required fields */}
          <div>
            <label className={labelCls} style={labelStyle}>Business Name <span style={{ color: 'var(--love)' }}>*</span></label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Digital Store Pro"
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Contact Email <span style={{ color: 'var(--love)' }}>*</span></label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="merchant@email.com"
              className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Business Type <span style={{ color: 'var(--love)' }}>*</span></label>
            <select value={form.businessType} onChange={set('businessType')}
              className={inputCls} style={{ ...inputStyle, color: form.businessType ? 'var(--ink)' : 'var(--subtle)' }}>
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
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
              Social Media <span className="normal-case font-normal tracking-normal ml-1" style={{ color: 'var(--muted)' }}>(optional)</span>
            </p>
            <div className="space-y-2.5">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input value={form.website} onChange={set('website')} placeholder="https://yourwebsite.com"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input value={form.instagram} onChange={set('instagram')} placeholder="Instagram handle (without @)"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input value={form.twitter} onChange={set('twitter')} placeholder="X / Twitter handle (without @)"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number (+628xx…)"
                  className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 mb-4 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
          Wallet: <span className="mono">{address.slice(0, 10)}…{address.slice(-6)}</span>
        </div>

        {isSuccess && txUrl && (
          <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
            <CheckCircle2 className="w-4 h-4" />
            <a href={txUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">View transaction</a>
          </div>
        )}

        <button
          disabled={!valid || isPending || isConfirming}
          onClick={() => register({ ...form, name: form.name.trim(), email: form.email.trim() })}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'var(--gradient-love)' }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet…</span>
          ) : isConfirming ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processing…</span>
          ) : 'Register Now'}
        </button>
      </motion.div>
    </div>
  )
}
