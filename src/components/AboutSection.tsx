import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Shield, Zap, Globe, QrCode, Link2, FileText, ArrowRight } from 'lucide-react'

// ─── Animated feature card ────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
  glow,
  delay,
}: {
  icon: React.ElementType
  title: string
  desc: string
  gradient: string
  glow: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        boxShadow: `0 0 32px ${glow}`,
      }}
    >
      {/* Glow blob */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: gradient }} />

      <motion.div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 relative"
        style={{ background: gradient, boxShadow: `0 6px 18px ${glow}` }}
        whileHover={{ scale: 1.12, rotate: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <Icon className="w-5 h-5 text-white" />
      </motion.div>

      <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--ink)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--subtle)' }}>{desc}</p>
    </motion.div>
  )
}

// ─── Animated flow step ────────────────────────────────────────────────────────
function FlowStep({
  step,
  label,
  sub,
  delay,
}: {
  step: string
  label: string
  sub: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center gap-2"
    >
      <motion.div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black"
        style={{
          background: 'var(--gradient-love)',
          boxShadow: '0 6px 20px var(--love-glow)',
          color: 'white',
          fontSize: '1.1rem',
        }}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.4, delay: delay * 0.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {step}
      </motion.div>
      <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{label}</p>
      <p className="text-xs leading-relaxed max-w-[120px]" style={{ color: 'var(--subtle)' }}>{sub}</p>
    </motion.div>
  )
}

// ─── Animated arrow ────────────────────────────────────────────────────────────
function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.div
      className="hidden sm:flex items-center self-start mt-5"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <motion.div
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowRight className="w-5 h-5" style={{ color: 'var(--love)' }} />
      </motion.div>
    </motion.div>
  )
}

// ─── Animated stat badge ───────────────────────────────────────────────────────
function StatBadge({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      <span className="display text-3xl font-black tabular-nums" style={{
        background: 'var(--gradient-love)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>{value}</span>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AboutSection() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true, margin: '-60px' })

  const features = [
    {
      icon: Zap,
      title: 'Instant Settlement',
      desc: 'Payments confirm in under 1 second on Arc. No waiting, no delays — USDC lands in your wallet the moment the customer pays.',
      gradient: 'linear-gradient(135deg,#f43f8f,#ec4899)',
      glow: 'rgba(244,63,143,0.18)',
      delay: 0.05,
    },
    {
      icon: Shield,
      title: 'Non-Custodial',
      desc: 'Your funds go directly to your wallet. Lovepay never holds your money — the smart contract sends USDC straight to you.',
      gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      glow: 'rgba(99,102,241,0.18)',
      delay: 0.12,
    },
    {
      icon: Globe,
      title: 'No Borders',
      desc: 'Accept payments from anyone, anywhere in the world. USDC on Arc works the same whether your customer is next door or across the globe.',
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      glow: 'rgba(16,185,129,0.18)',
      delay: 0.19,
    },
    {
      icon: QrCode,
      title: 'QR Code Ready',
      desc: 'Every payment link comes with a scannable QR code. Print it, share it, display it at your counter — customers just scan and pay.',
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
      glow: 'rgba(245,158,11,0.18)',
      delay: 0.05,
    },
    {
      icon: Link2,
      title: 'Shareable Links',
      desc: 'Create a link in seconds and share it via WhatsApp, email, or social media. Customers click, connect their wallet, and pay — that simple.',
      gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
      glow: 'rgba(59,130,246,0.18)',
      delay: 0.12,
    },
    {
      icon: FileText,
      title: 'Onchain Invoices',
      desc: 'Issue professional invoices stored permanently on the blockchain. Every payment is transparent, traceable, and tamper-proof forever.',
      gradient: 'linear-gradient(135deg,#ec4899,#db2777)',
      glow: 'rgba(236,72,153,0.18)',
      delay: 0.19,
    },
  ]

  const stats = [
    { value: '$0', label: 'Platform fees', delay: 0.05 },
    { value: '<1s', label: 'Settlement time', delay: 0.12 },
    { value: '100%', label: 'Non-custodial', delay: 0.19 },
    { value: '24/7', label: 'Always on', delay: 0.26 },
  ]

  return (
    <div className="space-y-10 pt-4">

      {/* Divider */}
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }} />

      {/* Title */}
      <motion.div
        ref={titleRef}
        initial={{ opacity: 0, y: 20 }}
        animate={titleInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--love)' }}>
          About Lovepay
        </p>
        <h2 className="display text-2xl font-black tracking-tight" style={{ color: 'var(--ink)' }}>
          The simplest way to accept<br />
          <span style={{
            background: 'var(--gradient-love)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>USDC payments onchain</span>
        </h2>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: 'var(--subtle)' }}>
          Lovepay is a permissionless payment gateway built on Arc — the blockchain where USDC is the native gas token. No middlemen, no monthly fees, no bank accounts needed.
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <StatBadge key={s.label} {...s} />
        ))}
      </div>

      {/* How it works flow */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-center" style={{ color: 'var(--muted)' }}>
          How it works
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
          <FlowStep step="1" label="Register" sub="Set up your merchant profile" delay={0.05} />
          <FlowArrow delay={0.15} />
          <FlowStep step="2" label="Create Link" sub="Payment link or invoice" delay={0.2} />
          <FlowArrow delay={0.3} />
          <FlowStep step="3" label="Share" sub="Send QR or link to customer" delay={0.35} />
          <FlowArrow delay={0.45} />
          <FlowStep step="4" label="Get Paid" sub="USDC arrives in your wallet" delay={0.5} />
        </div>
      </div>

      {/* Feature grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--muted)' }}>
          Everything you need
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map(f => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8 }}
        className="text-center py-2"
      >
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          Powered by{' '}
          <a href="https://arc.io" target="_blank" rel="noreferrer"
            className="font-semibold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--love)' }}>Arc</a>
          {' '}·{' '}
          <a href="https://circle.com" target="_blank" rel="noreferrer"
            className="font-semibold hover:opacity-80 transition-opacity"
            style={{ color: 'var(--love)' }}>Circle USDC</a>
          {' '}· Open source · Permissionless
        </p>

        {/* Social links */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <a href="https://x.com/lovepayyy" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 hover:opacity-90"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
            {/* X (Twitter) logo */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.857L1.745 2.25H8.42l4.264 5.632 5.56-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            @lovepayyy
          </a>
          <a href="https://github.com/perdi-pepeng/lovepay" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 hover:opacity-90"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
            {/* GitHub logo */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </div>
      </motion.div>
    </div>
  )
}
