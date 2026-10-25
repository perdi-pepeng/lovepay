/**
 * Unified wallet connect button.
 * Tab 1: Circle Agent Wallet (passkey, no seed phrase) — Arc Testnet only
 * Tab 2: External wallet — MetaMask, Rabby, Coinbase Wallet, WalletConnect, etc.
 *        Shows network switcher so user can pick Arc Testnet or Arc Mainnet.
 */

import { useState } from 'react'
import { Loader2, Wallet, LogOut, ChevronDown, ShieldCheck, Plug, Network } from 'lucide-react'
import { useDisconnect, useAccount, useSwitchChain } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { arc, arcTestnet } from 'viem/chains'
import { useCircleWallet } from '../circle-wallet'

function shortAddr(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

function isValidUsername(u: string) {
  return u.length >= 5 && u.length <= 50 && /^[a-zA-Z0-9_@:+\-]+$/.test(u)
}

type Tab = 'passkey' | 'external'

export default function WalletButton() {
  const { wallet, register, login, disconnect: circleDisconnect, error: circleError } = useCircleWallet()
  const { address: wagmiAddress, isConnected: wagmiConnected, chainId: wagmiChainId } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [tab, setTab] = useState<Tab>('passkey')
  const [username, setUsername] = useState('')
  const [mode, setMode] = useState<'choose' | 'register'>('choose')

  function openModal() {
    setMode('choose')
    setUsername('')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setUsername('')
    setMode('choose')
  }

  const isOnArcTestnet = wagmiChainId === arcTestnet.id
  const isOnArcMainnet = wagmiChainId === arc.id
  const isOnArc = isOnArcTestnet || isOnArcMainnet

  // ── Connected state ────────────────────────────────────────────────────────

  if (wallet.status === 'loading') {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        style={{ background: 'var(--surface-strong)', color: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </button>
    )
  }

  // Circle wallet connected
  if (wallet.status === 'connected') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(m => !m)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid var(--love)' }}
        >
          <div className="w-2 h-2 rounded-full bg-green-400" />
          {shortAddr(wallet.address)}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl p-2 z-50 shadow-xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
            >
              <div className="px-3 py-2">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--subtle)' }}>Circle Passkey Wallet</div>
                <div className="text-xs font-mono break-all mb-1" style={{ color: 'var(--muted)' }}>{wallet.address}</div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'var(--love-soft)', color: 'var(--love)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Arc Testnet
                </div>
              </div>
              <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
              <div className="px-3 py-2 text-xs rounded-xl" style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}>
                Circle Passkey Wallet runs on Arc Testnet. To use Arc Mainnet, connect an external wallet instead.
              </div>
              <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
              <button
                onClick={() => { circleDisconnect(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all hover:bg-red-50"
                style={{ color: 'var(--ink)' }}
              >
                <LogOut className="w-4 h-4 text-red-400" /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Wagmi/injected wallet connected (MetaMask, Rabby, etc.)
  if (wagmiConnected && wagmiAddress) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(m => !m)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isOnArc ? 'var(--surface-strong)' : '#fef3c7',
            color: isOnArc ? 'var(--ink)' : '#92400e',
            border: `1px solid ${isOnArc ? 'var(--border)' : '#fcd34d'}`,
          }}
        >
          <div className={`w-2 h-2 rounded-full ${isOnArc ? 'bg-green-400' : 'bg-yellow-400'}`} />
          {shortAddr(wagmiAddress)}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl p-2 z-50 shadow-xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
            >
              <div className="px-3 py-2">
                <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--subtle)' }}>External Wallet</div>
                <div className="text-xs font-mono break-all mb-1" style={{ color: 'var(--muted)' }}>{wagmiAddress}</div>
                {isOnArc ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: isOnArcMainnet ? 'var(--love-soft)' : 'var(--surface-muted)',
                      color: isOnArcMainnet ? 'var(--love)' : 'var(--ink-2)',
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {isOnArcMainnet ? 'Arc Mainnet' : 'Arc Testnet'}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: '#fef3c7', color: '#92400e' }}>
                    Wrong Network
                  </div>
                )}
              </div>
              <hr style={{ borderColor: 'var(--border)' }} className="my-1" />

              {/* Network switcher */}
              <div className="px-1 py-1 space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
                  Switch Network
                </p>
                <button
                  onClick={() => { void switchChainAsync({ chainId: arcTestnet.id }); setShowMenu(false) }}
                  disabled={isSwitching || isOnArcTestnet}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all disabled:opacity-40"
                  style={{
                    background: isOnArcTestnet ? 'var(--surface-muted)' : 'transparent',
                    color: 'var(--ink)',
                    fontWeight: isOnArcTestnet ? 600 : 400,
                  }}
                >
                  <Network className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                  Arc Testnet
                  {isOnArcTestnet && <span className="ml-auto text-xs" style={{ color: 'var(--success)' }}>Active</span>}
                </button>
                <button
                  onClick={() => { void switchChainAsync({ chainId: arc.id }); setShowMenu(false) }}
                  disabled={isSwitching || isOnArcMainnet}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all disabled:opacity-40"
                  style={{
                    background: isOnArcMainnet ? 'var(--love-soft)' : 'transparent',
                    color: isOnArcMainnet ? 'var(--love)' : 'var(--ink)',
                    fontWeight: isOnArcMainnet ? 600 : 400,
                  }}
                >
                  <Network className="w-3.5 h-3.5" style={{ color: isOnArcMainnet ? 'var(--love)' : 'var(--muted)' }} />
                  Arc Mainnet
                  {isOnArcMainnet && <span className="ml-auto text-xs" style={{ color: 'var(--love)' }}>Active</span>}
                  {isSwitching && <Loader2 className="ml-auto w-3 h-3 animate-spin" />}
                </button>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
              <button
                onClick={() => { wagmiDisconnect(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all hover:bg-red-50"
                style={{ color: 'var(--ink)' }}
              >
                <LogOut className="w-4 h-4 text-red-400" /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Disconnected ────────────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: 'var(--love)', boxShadow: '0 2px 8px rgba(232,62,140,0.35)' }}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-bold text-lg" style={{ color: 'var(--ink)', fontFamily: 'Space Grotesk' }}>Connect Wallet</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Choose your connection method</div>
                </div>
                <button onClick={closeModal} className="text-xl leading-none" style={{ color: 'var(--muted)' }}>×</button>
              </div>

              {/* Tabs */}
              <div
                className="flex rounded-2xl p-1 mb-5"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={() => setTab('passkey')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: tab === 'passkey' ? 'var(--love-soft)' : 'transparent',
                    color: tab === 'passkey' ? 'var(--love)' : 'var(--muted)',
                    border: tab === 'passkey' ? '1px solid var(--love)' : '1px solid transparent',
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Circle Passkey
                </button>
                <button
                  onClick={() => setTab('external')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: tab === 'external' ? 'var(--surface-muted)' : 'transparent',
                    color: tab === 'external' ? 'var(--ink)' : 'var(--muted)',
                    border: tab === 'external' ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <Plug className="w-3.5 h-3.5" /> External Wallet
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="px-6 pb-6">

              {/* ── Passkey tab ────────────────────────────────── */}
              {tab === 'passkey' && (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid var(--love)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    No seed phrase. Stored securely on your device.
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <Network className="w-3.5 h-3.5 shrink-0" />
                    Runs on <strong className="ml-1">Arc Testnet</strong>. For Arc Mainnet, use External Wallet.
                  </div>

                  {circleError && (
                    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      {circleError}
                    </div>
                  )}

                  {mode === 'choose' && (
                    <>
                      <button
                        onClick={() => { void login().then(() => closeModal()) }}
                        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                        style={{ background: 'var(--love)', color: '#fff' }}
                      >
                        Login with Passkey
                      </button>
                      <button
                        onClick={() => { setMode('register'); setUsername('') }}
                        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                        style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid var(--love)' }}
                      >
                        Create New Wallet
                      </button>
                    </>
                  )}

                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--subtle)' }}>
                          Passkey Username
                        </label>
                        <input
                          autoFocus
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && isValidUsername(username)) {
                              void register(username).then(() => closeModal())
                            }
                          }}
                          placeholder="min. 5 chars (a–z, 0–9, _@:+-)"
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                        />
                        {username.length > 0 && !isValidUsername(username) && (
                          <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                            5–50 characters, letters/digits/_@:+- only
                          </p>
                        )}
                      </div>
                      <button
                        disabled={!isValidUsername(username)}
                        onClick={() => { void register(username).then(() => closeModal()) }}
                        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40"
                        style={{ background: 'var(--love)', color: '#fff' }}
                      >
                        Create Wallet
                      </button>
                      <button
                        onClick={() => setMode('choose')}
                        className="w-full py-2 rounded-2xl text-xs transition-all"
                        style={{ color: 'var(--muted)' }}
                      >
                        ← Back
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── External wallet tab ────────────────────────── */}
              {tab === 'external' && (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ background: '#f8fafc', color: 'var(--subtle)', border: '1px solid var(--border)' }}
                  >
                    <Plug className="w-3.5 h-3.5 shrink-0" />
                    MetaMask, Rabby, Coinbase Wallet, WalletConnect, and more.
                  </div>

                  {/* ConnectKit handles the full wallet selection UI */}
                  <ConnectKitButton.Custom>
                    {({ isConnected, isConnecting, show }) => (
                      <button
                        onClick={() => { show?.(); closeModal() }}
                        disabled={isConnecting}
                        className="w-full py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: 'var(--gradient-love)', color: '#fff', boxShadow: '0 4px 20px var(--love-glow)' }}
                      >
                        {isConnecting
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</>
                          : isConnected
                            ? 'Switch Wallet'
                            : <><Plug className="w-4 h-4" /> Select Wallet</>
                        }
                      </button>
                    )}
                  </ConnectKitButton.Custom>

                  {/* Network choice */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-center" style={{ color: 'var(--subtle)' }}>
                      After connecting, switch network:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => void switchChainAsync({ chainId: arcTestnet.id })}
                        disabled={isSwitching}
                        className="py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                      >
                        Arc Testnet
                      </button>
                      <button
                        onClick={() => void switchChainAsync({ chainId: arc.id })}
                        disabled={isSwitching}
                        className="py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid var(--love)' }}
                      >
                        Arc Mainnet
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
