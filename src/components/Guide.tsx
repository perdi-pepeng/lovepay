import { QrCode, Link2, FileText, History, UserCircle, ArrowRight, Shield, Zap, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { getLovepayContract, ARC_MAINNET_CHAIN_ID } from '../contract'
import { useArcChainId } from '../store'
import { buildAddressExplorerUrl } from '@/onchain-facts'

interface AccordionProps { q: string; a: string }
function Accordion({ q, a }: AccordionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}>
        {q}
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm leading-relaxed"
          style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', borderTop: '1px solid var(--border)' }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function Guide() {
  const chainId = useArcChainId()
  const contract = getLovepayContract(chainId)
  const isMainnet = chainId === ARC_MAINNET_CHAIN_ID
  const chainLabel = isMainnet ? 'Arc Mainnet' : 'Arc Testnet'
  const explorerUrl = buildAddressExplorerUrl(chainId, contract.address)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Lovepay Guide</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Learn how to use every feature of the platform</p>
      </div>

      {/* How it works */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          How It Works
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              step: '01',
              title: 'Register as a Merchant',
              desc: 'Connect your wallet, enter your business name and email. Data is stored permanently on the blockchain — only needs to be done once.',
              color: 'var(--love)',
            },
            {
              step: '02',
              title: 'Create a Payment Link or Invoice',
              desc: 'Payment Links are for general payments shareable with anyone. Invoices are formal bills for specific customers with itemized details.',
              color: 'var(--accent-hover)',
            },
            {
              step: '03',
              title: 'Share & Receive Payments',
              desc: 'Share the link with your customers. They connect their wallet, approve USDC once, then pay. USDC goes directly into your wallet.',
              color: 'var(--success)',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-mono text-sm font-bold"
                style={{ background: `${color}18`, color }}>
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Feature Overview
        </p>
        <div className="space-y-2">
          {[
            {
              icon: Link2,
              title: 'Payment Link',
              color: 'var(--accent-hover)',
              desc: 'Create shareable payment links via WhatsApp, email, or QR code. Can be single-use (one payment only) or multi-use (unlimited). Optionally set a fixed amount or let the customer enter their own.',
            },
            {
              icon: FileText,
              title: 'Invoice',
              color: 'var(--love)',
              desc: 'Formal bill with invoice number, customer name, itemized breakdown, VAT, and discounts. Amount is locked — customer must pay the exact total. Invoice status automatically updates to Paid after payment.',
            },
            {
              icon: QrCode,
              title: 'QR Code',
              color: 'var(--success)',
              desc: 'Every payment link has a downloadable, printable QR code. Customers scan the QR with their phone camera and land directly on the payment page.',
            },
            {
              icon: History,
              title: 'Transaction History',
              color: 'var(--love)',
              desc: 'All incoming payments (from customers) and outgoing payments (sent by you). Filter by direction, search by ID, and export to CSV.',
            },
            {
              icon: UserCircle,
              title: 'Merchant Profile',
              color: 'var(--accent-hover)',
              desc: 'Your business data stored on the blockchain: name, email, business type, wallet address. Can be updated at any time — changes are saved onchain.',
            },
          ].map(({ icon: Icon, title, color, desc }) => (
            <div key={title} className="flex gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why blockchain */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Why Blockchain?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Shield, title: 'Tamper-Proof', desc: 'All data is stored in an immutable smart contract — no one can alter or delete transaction history.' },
            { icon: Zap,    title: 'Instant & Low Cost', desc: `Transactions confirm in seconds on ${chainLabel}. Gas fees are stable because Arc uses USDC as gas.` },
            { icon: Globe,  title: 'No Bank Required', desc: 'Accept payments from anyone worldwide without a bank account, no complex KYC, no international transfer fees.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-2xl text-center"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--love-soft)' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--love)' }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          FAQ
        </p>
        <div className="space-y-2">
          <Accordion
            q="What is USDC?"
            a="USDC is a stablecoin always pegged 1:1 to the US Dollar. Issued by Circle and used as the currency on Lovepay. Unlike Bitcoin or ETH, USDC does not fluctuate — safe for business transactions."
          />
          <Accordion
            q="Is my data safe?"
            a={`Merchant data, payment links, invoices, and transactions are stored in an immutable smart contract on the ${chainLabel} blockchain. There is no central server that can be hacked or manipulated. Only your wallet can change your business data.`}
          />
          <Accordion
            q="How do customers pay?"
            a="Customers open the link you shared, connect their wallet (MetaMask, Rabby, or any other), approve USDC spending once, then confirm the payment. USDC goes directly into your wallet with no intermediaries."
          />
          <Accordion
            q="What is the difference between a Payment Link and an Invoice?"
            a="A Payment Link can be shared with anyone and can be multi-use (many people can pay). An Invoice is directed at a specific customer with itemized breakdown, invoice number, and a locked amount — more formal for business billing."
          />
          <Accordion
            q="Are there any platform fees?"
            a="Lovepay does not charge platform fees. You only pay the Arc network gas fee (very small, paid in USDC). 100% of every payment goes directly into your wallet."
          />
          <Accordion
            q="Is this testnet or mainnet?"
            a={isMainnet ? 'Lovepay is running on Arc Mainnet — transactions use real USDC. All payments are final and irreversible.' : 'Lovepay is currently running on Arc Testnet — all USDC is testnet tokens with no real value. This is for demonstration and development.'}
          />
        </div>
      </div>

      {/* Contract info footer */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
          Technical Info
        </p>
        <div className="space-y-2 text-xs">
          {[
            ['Smart Contract', 'LovepayRegistry.sol'],
            ['Network', `${chainLabel} (Chain ID: ${chainId})`],
            ['Currency', 'USDC (6 decimals)'],
            ['Contract Address', `${contract.address.slice(0, 18)}…${contract.address.slice(-6)}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1"
          style={{ color: 'var(--love)' }}>
          View Contract on Explorer <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
