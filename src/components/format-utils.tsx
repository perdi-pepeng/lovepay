import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { ARC_TESTNET_CHAIN_ID } from '../contract'

export function formatUSDC(raw: bigint): string {
  return Amount.fromRaw(raw, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)).toFixed(2)
}

const STATUS_LABELS: Record<number, string> = { 0: 'Draft', 1: 'Dikirim', 2: 'Lunas', 3: 'Batal' }
const STATUS_COLORS: Record<number, string> = {
  0: 'var(--muted)',
  1: 'var(--accent-hover)',
  2: 'var(--success)',
  3: 'var(--danger)',
}

export function StatusBadge({ status }: { status: number }) {
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${STATUS_COLORS[status]}18`, color: STATUS_COLORS[status] }}>
      {STATUS_LABELS[status] ?? 'Unknown'}
    </span>
  )
}
