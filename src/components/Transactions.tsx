import { useState } from 'react'
import { Search, Download, ArrowUpDown, Loader2, ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon } from 'lucide-react'
import { useAllMyPaymentIds, usePayment } from '../store'
import { formatUSDC, StatusBadge } from './format-utils'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { ARC_TESTNET_CHAIN_ID } from '../contract'
import { usePaymentTxHashes } from '../store'

function PaymentRow({ paymentId, myAddress, directionFilter, txMap }: { paymentId: string; myAddress: string; directionFilter: 'all' | 'in' | 'out'; txMap: Map<string, string> }) {
  const { payment, isLoading } = usePayment(paymentId)
  if (isLoading || !payment) return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {(Array.from({ length: 7 })).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 rounded animate-pulse" style={{ background: 'var(--border)', width: i === 4 ? '60px' : i === 0 ? '80px' : '50px' }} />
        </td>
      ))}
    </tr>
  )

  const isIncoming = payment.merchant.toLowerCase() === myAddress.toLowerCase()
  // Apply direction filter now that we have payment data
  if (directionFilter === 'in' && !isIncoming) return null
  if (directionFilter === 'out' && isIncoming) return null
  const counterparty = isIncoming ? payment.payer : payment.merchant
  const date = new Date(Number(payment.createdAt) * 1000)
  const txHash = txMap.get(paymentId) ?? null
  const txUrl = txHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash) : null

  return (
    <tr className="text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
      {/* ID + Tanggal */}
      <td className="px-5 py-3">
        <p className="font-medium mono text-xs" style={{ color: 'var(--ink)' }}>{paymentId.slice(0, 10)}…</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{date.toLocaleDateString('id-ID')}</p>
      </td>

      {/* Arah */}
      <td className="px-5 py-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: isIncoming ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: isIncoming ? 'var(--success)' : 'var(--danger)',
          }}>
          {isIncoming
            ? <><ArrowDownLeft className="w-3 h-3" /> Masuk</>
            : <><ArrowUpRightIcon className="w-3 h-3" /> Keluar</>}
        </span>
      </td>

      {/* Counterparty */}
      <td className="px-5 py-3 text-xs mono" style={{ color: 'var(--ink-2)' }}>
        {counterparty.slice(0, 8)}…{counterparty.slice(-4)}
      </td>

      {/* Memo */}
      <td className="px-5 py-3">
        <p className="font-medium truncate max-w-[120px] text-xs" style={{ color: 'var(--ink)' }}>
          {payment.memo || '—'}
        </p>
      </td>

      {/* Jumlah */}
      <td className="px-5 py-3 tabular-nums text-right font-semibold text-sm"
        style={{ color: isIncoming ? 'var(--success)' : 'var(--danger)' }}>
        {isIncoming ? '+' : '-'}${formatUSDC(payment.amount)}
      </td>

      {/* Status */}
      <td className="px-5 py-3"><StatusBadge status={payment.status} /></td>

      {/* Bukti */}
      <td className="px-5 py-3">
        {txUrl ? (
          <a href={txUrl} target="_blank" rel="noreferrer"
            className="text-xs underline underline-offset-2"
            style={{ color: 'var(--accent-hover)' }}>
            Explorer
          </a>
        ) : (
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>—</span>
        )}
      </td>
    </tr>
  )
}

interface Props { merchantAddress: string }

export default function Transactions({ merchantAddress }: Props) {
  const { allIds, received, isLoading } = useAllMyPaymentIds(merchantAddress)
  const txMap = usePaymentTxHashes(merchantAddress)
  const [search, setSearch] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all')

  const sortedIds = sortAsc ? [...allIds] : [...allIds].reverse()

  const filtered = sortedIds.filter(id => {
    if (search.trim() && !id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })



  const handleExport = () => {
    const csv = 'paymentId\n' + sortedIds.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lovepay-transactions.csv'
    a.click()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Riwayat Transaksi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {received.length} diterima · {allIds.length - received.length} dikirim · {allIds.length} total
          </p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium"
          style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'in', 'out'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f ? 'rgba(244,63,143,0.12)' : 'var(--surface-muted)',
              color: filter === f ? 'var(--love)' : 'var(--muted)',
              border: filter === f ? '1px solid rgba(244,63,143,0.25)' : '1px solid transparent',
            }}>
            {f === 'all' ? 'Semua' : f === 'in' ? 'Masuk' : 'Keluar'}
          </button>
        ))}
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 min-w-[160px]"
          style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--subtle)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari ID transaksi…"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
            style={{ color: 'var(--ink)' }} />
        </div>
        <button onClick={() => setSortAsc(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
          <ArrowUpDown className="w-4 h-4" /> {sortAsc ? 'Lama' : 'Baru'}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2" style={{ color: 'var(--muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat dari blockchain…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {search ? 'Tidak ditemukan.' : 'Belum ada transaksi.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-5 py-3">ID / Tanggal</th>
                  <th className="px-5 py-3">Arah</th>
                  <th className="px-5 py-3">Pihak Lain</th>
                  <th className="px-5 py-3">Memo</th>
                  <th className="px-5 py-3 text-right">Jumlah</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Bukti</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(id => (
                  <PaymentRow key={id} paymentId={id} myAddress={merchantAddress} directionFilter={filter} txMap={txMap} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
