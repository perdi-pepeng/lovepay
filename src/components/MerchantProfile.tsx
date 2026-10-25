import { useState, useEffect, startTransition } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, CheckCircle2, XCircle, Copy, Check, Loader2, UserCircle, Globe, Instagram, Twitter, Phone, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useMerchant, useUpdateMerchant, useArcChainId, type MerchantFormData } from '../store'
import { buildAddressExplorerUrl } from '@/onchain-facts'

const BIZ_LABELS: Record<string, string> = {
  retail: 'Retail / E-commerce',
  services: 'Services / Consulting',
  food: 'Food & Beverage',
  digital: 'Digital Products',
  education: 'Education',
  other: 'Other',
}

interface Props { merchantAddress: string }

export default function MerchantProfile({ merchantAddress }: Props) {
  const chainId = useArcChainId()
  const chainLabel = chainId === 5042 ? 'Arc Mainnet' : 'Arc Testnet'
  const { merchant, isLoading, refetch } = useMerchant(merchantAddress)
  const { update, isPending, isConfirming, isSuccess, error } = useUpdateMerchant()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<MerchantFormData>({
    name: '', email: '', businessType: '',
    website: '', instagram: '', twitter: '', whatsapp: '',
  })
  const [copied, setCopied] = useState(false)

  // Sync form when merchant loads or editing stops
  useEffect(() => {
    if (merchant && !editing) {
      setForm({
        name: merchant.name,
        email: merchant.email,
        businessType: merchant.businessType,
        website: merchant.website ?? '',
        instagram: merchant.instagram ?? '',
        twitter: merchant.twitter ?? '',
        whatsapp: merchant.whatsapp ?? '',
      })
    }
  }, [merchant, editing])

  useEffect(() => {
    if (isSuccess) {
      toast.success('Profile updated successfully!')
      startTransition(() => setEditing(false))
      void refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  useEffect(() => {
    if (error) toast.error('Failed to save. Please try again.')
  }, [error])

  const set = (k: keyof MerchantFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim() || !form.businessType) return
    update({ ...form, name: form.name.trim(), email: form.email.trim() })
  }

  const handleCancel = () => {
    setEditing(false)
    if (merchant) setForm({
      name: merchant.name, email: merchant.email, businessType: merchant.businessType,
      website: merchant.website ?? '', instagram: merchant.instagram ?? '',
      twitter: merchant.twitter ?? '', whatsapp: merchant.whatsapp ?? '',
    })
  }

  const copyAddress = () => {
    void navigator.clipboard.writeText(merchantAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const registeredDate = merchant?.registeredAt
    ? new Date(Number(merchant.registeredAt) * 1000).toLocaleDateString('en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  const explorerUrl = buildAddressExplorerUrl(chainId, merchantAddress)

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none'
  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }
  const inputWithIconStyle = { ...inputStyle, paddingLeft: '2.5rem' }
  const labelCls = 'block text-xs font-semibold mb-1.5 uppercase tracking-wide'
  const labelStyle = { color: 'var(--subtle)' }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2" style={{ color: 'var(--muted)' }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
      </div>
    )
  }

  if (!merchant || !merchant.registeredAt) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--muted)' }}>
        <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Merchant account not registered yet.</p>
      </div>
    )
  }

  const hasSocial = merchant.website || merchant.instagram || merchant.twitter || merchant.whatsapp

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 max-w-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Merchant Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>Data stored permanently on {chainLabel} blockchain</p>
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
          ? <><CheckCircle2 className="w-4 h-4" /> Account Active</>
          : <><XCircle className="w-4 h-4" /> Account Inactive</>}
      </div>

      {/* Profile card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
        {editing ? (
          <div className="p-5 space-y-4">
            {/* Required fields */}
            <div>
              <label className={labelCls} style={labelStyle}>Business Name</label>
              <input value={form.name} onChange={set('name')} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Contact Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Business Type</label>
              <select value={form.businessType} onChange={set('businessType')} className={inputCls} style={inputStyle}>
                <option value="">Select category…</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="services">Services / Consulting</option>
                <option value="food">Food &amp; Beverage</option>
                <option value="digital">Digital Products</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Social media */}
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>Social Media</p>
              <div className="space-y-2.5">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input value={form.website} onChange={set('website')} placeholder="https://yourwebsite.com"
                    className={inputCls} style={inputWithIconStyle} />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input value={form.instagram} onChange={set('instagram')} placeholder="Instagram handle (without @)"
                    className={inputCls} style={inputWithIconStyle} />
                </div>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input value={form.twitter} onChange={set('twitter')} placeholder="X / Twitter handle (without @)"
                    className={inputCls} style={inputWithIconStyle} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="WhatsApp number (+628xx…)"
                    className={inputCls} style={inputWithIconStyle} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.email.trim() || !form.businessType || isPending || isConfirming}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'var(--gradient-love)' }}
              >
                {(isPending || isConfirming)
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                  : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {[
              { label: 'Business Name', value: merchant.name },
              { label: 'Contact Email', value: merchant.email },
              { label: 'Business Type', value: BIZ_LABELS[merchant.businessType] ?? merchant.businessType },
              { label: 'Registered Since', value: registeredDate },
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

      {/* Social media display (view mode) */}
      {!editing && hasSocial && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest px-5 pt-4 pb-2" style={{ color: 'var(--subtle)' }}>Social Media</p>
          <div>
            {[
              { key: 'website',   label: 'Website',   icon: Globe,      href: merchant.website ? (merchant.website.startsWith('http') ? merchant.website : `https://${merchant.website}`) : null, display: merchant.website },
              { key: 'instagram', label: 'Instagram', icon: Instagram,  href: merchant.instagram ? `https://instagram.com/${merchant.instagram.replace('@','')}` : null, display: merchant.instagram ? `@${merchant.instagram.replace('@','')}` : '' },
              { key: 'twitter',   label: 'X / Twitter', icon: Twitter,  href: merchant.twitter ? `https://x.com/${merchant.twitter.replace('@','')}` : null, display: merchant.twitter ? `@${merchant.twitter.replace('@','')}` : '' },
              { key: 'whatsapp',  label: 'WhatsApp',  icon: Phone,      href: merchant.whatsapp ? `https://wa.me/${merchant.whatsapp.replace(/[^0-9]/g,'')}` : null, display: merchant.whatsapp },
            ].filter(r => r.display).map((row, i, arr) => {
              const Icon = row.icon
              return (
                <div
                  key={row.key}
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                    <span className="text-xs font-semibold uppercase tracking-wide w-24 shrink-0" style={{ color: 'var(--subtle)' }}>{row.label}</span>
                  </div>
                  {row.href
                    ? <a href={row.href} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-medium text-right"
                        style={{ color: 'var(--love)' }}>
                        {row.display} <ExternalLink className="w-3 h-3" />
                      </a>
                    : <span className="text-sm font-medium text-right" style={{ color: 'var(--ink)' }}>{row.display}</span>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              title="Copy address"
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

      <p className="text-xs text-center pb-4" style={{ color: 'var(--subtle)' }}>
        Data stored on smart contract · {chainLabel} · Registered {registeredDate}
      </p>
    </motion.div>
  )
}
