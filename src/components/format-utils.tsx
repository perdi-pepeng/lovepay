import { Amount } from '@/onchain-money'

// USDC has 6 decimals on all Arc networks
const USDC_DECIMALS = 6

export function formatUSDC(raw: bigint): string {
  return Amount.fromRaw(raw, USDC_DECIMALS).toFixed(2)
}

const STATUS_LABELS: Record<number, string> = { 0: 'Draft', 1: 'Sent', 2: 'Paid', 3: 'Cancelled' }
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
