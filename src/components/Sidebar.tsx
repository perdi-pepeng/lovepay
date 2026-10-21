import { LayoutDashboard, Link2, FileText, History, UserCircle, Zap, BookOpen } from 'lucide-react'
import LovepayLogo from './LovepayLogo'

export type View = 'dashboard' | 'links' | 'invoices' | 'transactions' | 'checkout' | 'profile' | 'guide'

interface SidebarProps {
  view: View
  onView: (v: View) => void
  onAbout: () => void
  notifCount: number
}

const NAV = [
  { id: 'dashboard'    as View, label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'links'        as View, label: 'Payment Links',    icon: Link2 },
  { id: 'invoices'     as View, label: 'Invoices',         icon: FileText },
  { id: 'transactions' as View, label: 'History',          icon: History },
  { id: 'profile'      as View, label: 'Merchant Profile', icon: UserCircle },
]

export default function Sidebar({ view, onView, onAbout, notifCount }: SidebarProps) {
  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 min-h-dvh fixed left-0 top-0 z-30"
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Brand — clickable untuk About modal */}
        <button
          onClick={onAbout}
          className="px-6 pt-7 pb-5 text-left group transition-all rounded-none hover:opacity-90"
          title="About Lovepay"
        >
          <div className="flex items-center gap-3">
            <LovepayLogo size={40} className="shrink-0 transition-transform group-hover:scale-105" />
            <div>
              <div className="display font-bold text-[17px]" style={{ color: 'var(--ink)' }}>Lovepay</div>
              <div className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--subtle)' }}>PAYMENT GATEWAY</div>
            </div>
          </div>

          {/* Live badge */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>Arc Testnet · Live</span>
            <Zap className="w-3 h-3 ml-auto" style={{ color: 'var(--success)' }} />
          </div>
        </button>

        {/* Section label */}
        <div className="px-6 mb-2">
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--subtle)' }}>Main Menu</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => onView(id)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative group"
                style={{
                  background: active ? 'rgba(244,63,143,0.10)' : 'transparent',
                  color: active ? 'var(--love)' : 'var(--muted)',
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: 'var(--love)' }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom — Panduan + notif */}
        <div className="px-3 pb-4 space-y-1.5" style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: '12px' }}>
          {/* Panduan menu */}
          <button
            onClick={() => onView('guide')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all relative"
            style={{
              background: view === 'guide' ? 'rgba(244,63,143,0.10)' : 'transparent',
              color: view === 'guide' ? 'var(--love)' : 'var(--muted)',
            }}
          >
            {view === 'guide' && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                style={{ background: 'var(--love)' }} />
            )}
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Guide</span>
          </button>

          {/* Notif badge */}
          {notifCount > 0 && (
            <div className="px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium"
              style={{ background: 'var(--love-soft)', color: 'var(--love)', border: '1px solid rgba(244,63,143,0.20)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--love)' }} />
              {notifCount} new notifications
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-1"
        style={{
          background: 'rgba(8,13,26,0.95)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--sidebar-border)',
        }}
      >
        {[...NAV, { id: 'guide' as View, label: 'Guide', icon: BookOpen }].map(({ id, label, icon: Icon }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => onView(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all"
              style={{ color: active ? 'var(--love)' : 'var(--subtle)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
