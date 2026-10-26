import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount } from 'wagmi'
import Sidebar, { type View } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import PaymentLinks from './components/PaymentLinks'
import Invoices from './components/Invoices'
import Transactions from './components/Transactions'
import Checkout from './components/Checkout'
import MerchantProfile from './components/MerchantProfile'
import Guide from './components/Guide'
import AboutModal from './components/AboutModal'
import LovepayLogo from './components/LovepayLogo'
import WalletButton from './components/WalletButton'
import { useCircleWallet } from './circle-wallet'
import { useIsMerchant } from './store'

function parseCheckoutParams() {
  const params = new URLSearchParams(window.location.search)
  const checkoutId = params.get('checkout')
  if (!checkoutId) return null
  return {
    linkId: checkoutId,
    amount: params.get('amount') ?? '',
    memo: decodeURIComponent(params.get('memo') ?? ''),
    merchant: params.get('merchant') ?? '',
    invoiceId: params.get('invoice') ?? '',
  }
}

export default function App() {
  const [checkoutParams] = useState(parseCheckoutParams)
  const [view, setView] = useState<View>(checkoutParams ? 'checkout' : 'dashboard')
  const [showAbout, setShowAbout] = useState(false)

  const { wallet } = useCircleWallet()
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()

  const circleAddress = wallet.status === 'connected' ? wallet.address : undefined
  const address = circleAddress ?? (wagmiConnected ? wagmiAddress : undefined)
  const isConnected = !!address
  const isCircle = wallet.status === 'connected'

  const { isMerchant, isLoading: merchantLoading } = useIsMerchant(address)

  if (checkoutParams) {
    return (
      <Checkout
        {...checkoutParams}
        onBack={() => {
          window.history.replaceState({}, '', window.location.pathname)
          window.location.reload()
        }}
        onSuccess={(txHash) => {
          toast.success('Payment successful!', { description: txHash.slice(0, 18) + '…' })
        }}
      />
    )
  }

  if (wallet.status === 'loading' || (isConnected && merchantLoading)) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <LovepayLogo size={48} />
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--love)' }} />
            Loading…
          </div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-dvh relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'var(--gradient-love)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--gradient-blue)' }} />

        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <LovepayLogo size={32} />
            <span className="display font-bold text-base" style={{ color: 'var(--ink)' }}>Lovepay</span>
          </div>
          <WalletButton />
        </div>

        <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 mx-auto">
            <LovepayLogo size={80} />
          </div>
          <h1 className="display font-bold mb-3" style={{ fontSize: '2.5rem', color: 'var(--ink)', letterSpacing: '-0.04em' }}>
            Accept Payments<br />
            <span style={{ background: 'var(--gradient-love)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Onchain
            </span>
          </h1>
          <p className="text-base max-w-xs mx-auto mb-8" style={{ color: 'var(--muted)' }}>
            Blockchain-powered payment gateway. USDC direct to your wallet, no intermediaries.
          </p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <Sidebar view={view} onView={setView} onAbout={() => setShowAbout(true)} notifCount={0} />
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />

      <header
        className="lg:pl-64 fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-4 h-14"
        style={{ background: 'rgba(8,13,26,0.80)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--subtle)' }}>
            {isCircle ? 'Circle Passkey Wallet' : 'External Wallet'}
          </span>
        </div>
        <WalletButton />
      </header>

      <main className="lg:pl-64 pb-24 lg:pb-8 pt-14">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {view === 'dashboard'    && <Dashboard onViewAll={() => setView('transactions')} merchantAddress={address} isMerchant={isMerchant ?? false} />}
          {view === 'links'        && <PaymentLinks merchantAddress={address} onGoToDashboard={() => setView('dashboard')} />}
          {view === 'invoices'     && <Invoices merchantAddress={address} onGoToDashboard={() => setView('dashboard')} />}
          {view === 'transactions' && <Transactions merchantAddress={address} />}
          {view === 'profile'      && <MerchantProfile merchantAddress={address} />}
          {view === 'guide'        && <Guide />}
        </div>
      </main>
    </div>
  )
}
