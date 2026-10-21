import { useState, useEffect, startTransition } from 'react'
import { Plus, FileText, X, Trash2, Loader2, User, Mail, Calendar, Receipt, ChevronRight, Share2, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { encodeAbiParameters, parseAbiParameters } from 'viem'
import { useMerchantInvoiceIds, useInvoice, useCreateInvoice, useUpdateInvoiceStatus, type CreateInvoiceParams } from '../store'
import { formatUSDC } from './format-utils'

const STATUS_LABELS: Record<number, string> = { 0: 'Draft', 1: 'Sent', 2: 'Paid', 3: 'Overdue' }
const STATUS_COLORS: Record<number, string> = { 0: 'var(--muted)', 1: 'var(--accent-hover)', 2: 'var(--success)', 3: 'var(--danger)' }

function InvoiceRow({ invoiceId }: { invoiceId: string }) {
  const { invoice } = useInvoice(invoiceId)
  const { update, isPending } = useUpdateInvoiceStatus()
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (!invoice) return (
    <div className="flex items-center gap-3 p-4 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }}>
      <div className="w-8 h-8 rounded-xl" style={{ background: 'var(--border)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-2 w-32 rounded" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  )

  const status = invoice.status

  // Build checkout URL for this invoice
  const checkoutUrl = (() => {
    const base = `${window.location.origin}${window.location.pathname}`
    const params = new URLSearchParams({
      checkout: invoiceId,
      invoice: invoiceId,
      merchant: invoice.merchant,
      amount: (Number(invoice.total) / 1e6).toFixed(6),
      memo: encodeURIComponent(invoice.invoiceNumber),
    })
    return `${base}?${params.toString()}`
  })()

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({ title: `Invoice ${invoice.invoiceNumber}`, text: `Pay invoice ${invoice.invoiceNumber} for $${formatUSDC(invoice.total)} USDC`, url: checkoutUrl })
    } else {
      void navigator.clipboard.writeText(checkoutUrl).then(() => {
        setCopied(true)
        toast.success('Invoice link copied!')
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const handleCopy = () => {
    void navigator.clipboard.writeText(checkoutUrl).then(() => {
      setCopied(true)
      toast.success('Invoice link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${STATUS_COLORS[status]}18` }}>
          <Receipt className="w-4 h-4" style={{ color: STATUS_COLORS[status] }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{invoice.invoiceNumber}</p>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: `${STATUS_COLORS[status]}18`, color: STATUS_COLORS[status] }}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{invoice.customerName} · {invoice.customerEmail}</p>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            ${formatUSDC(invoice.total)} USDC
          </p>
        </div>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {/* Share / Copy link */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--love-soft)', color: 'var(--love)' }}
              >
                <Share2 className="w-3.5 h-3.5" /> Share Invoice
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              {/* Tandai Lunas */}
              {status === 1 && (
                <button
                  onClick={() => update(invoiceId as `0x${string}`, 2)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}
                >
                  <Check className="w-3.5 h-3.5" /> Mark as Paid
                </button>
              )}

              {/* Kirim → Terkirim */}
              {status === 0 && (
                <button
                  onClick={() => update(invoiceId as `0x${string}`, 1)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                  style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
                >
                  Mark as Sent
                </button>
              )}

              {/* Link preview */}
              <div className="w-full mt-1 px-3 py-2 rounded-xl text-[10px] font-mono truncate"
                style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
                {checkoutUrl}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LocalItem { id: string; description: string; qty: string; price: string }

function calcTotal(items: LocalItem[], taxBps: number, discountBps: number) {
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0) * (parseFloat(i.qty) || 1), 0)
  const discountAmt = subtotal * discountBps / 10000
  const taxAmt = (subtotal - discountAmt) * taxBps / 10000
  const total = subtotal - discountAmt + taxAmt
  return { subtotal, discountAmt, taxAmt, total }
}

const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
const inputStyle = { background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }

interface Props { merchantAddress: string }

export default function Invoices({ merchantAddress }: Props) {
  const { invoiceIds, isLoading, refetch } = useMerchantInvoiceIds(merchantAddress)
  const { create, isPending, isConfirming, isSuccess, error } = useCreateInvoice()
  const [showSheet, setShowSheet] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tax, setTax] = useState(11)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LocalItem[]>([{ id: '1', description: '', qty: '1', price: '' }])
  const [nextInvNum] = useState(() => `INV-${String(Date.now() % 900 + 100).padStart(4, '0')}`)

  useEffect(() => {
    if (isSuccess) {
      toast.success('Invoice created successfully!')
      startTransition(() => {
        setShowSheet(false)
        setCustomerName('')
        setCustomerEmail('')
        setDueDate('')
        setNotes('')
        setItems([{ id: '1', description: '', qty: '1', price: '' }])
      })
      void refetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  useEffect(() => { if (error) toast.error('Failed to create invoice.') }, [error])

  const addItem = () => setItems(prev => [...prev, { id: String(Date.now()), description: '', qty: '1', price: '' }])
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const updateItem = (id: string, field: keyof LocalItem, val: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))

  const { subtotal, discountAmt, taxAmt, total } = calcTotal(items, tax * 100, discount * 100)
  const valid = customerName.trim() && customerEmail.trim() && dueDate && items.some(i => i.description.trim() && parseFloat(i.price) > 0)

  const handleCreate = () => {
    if (!valid) return
    const totalMicro = BigInt(Math.round(total * 1e6))
    const encodedItems = encodeAbiParameters(
      parseAbiParameters('(string description, uint256 qty, uint256 unitPrice)[]'),
      [items.filter(i => i.description.trim()).map(i => ({
        description: i.description,
        qty: BigInt(Math.round(parseFloat(i.qty) || 1)),
        unitPrice: BigInt(Math.round((parseFloat(i.price) || 0) * 1e6)),
      }))]
    )
    const params: CreateInvoiceParams = {
      invoiceNumber: nextInvNum,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      encodedItems,
      taxBps: BigInt(tax * 100),
      discountBps: BigInt(discount * 100),
      dueDate: BigInt(Math.floor(new Date(dueDate).getTime() / 1000)),
      total: totalMicro,
      notes: notes.trim(),
    }
    create(params)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Invoice</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{invoiceIds.length} invoices · stored onchain</p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white"
          style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 16px var(--love-glow)' }}
        >
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2" style={{ color: 'var(--muted)' }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Loading from blockchain…
        </div>
      ) : invoiceIds.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--subtle)' }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>No invoices yet</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Create your first invoice and share it with customers</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...invoiceIds].reverse().map(id => <InvoiceRow key={id} invoiceId={id} />)}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSheet(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>New Invoice</h2>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--love)' }}>{nextInvNum}</p>
                </div>
                <button
                  onClick={() => setShowSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'var(--surface-muted)' }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto max-h-[70dvh] px-6 py-5 space-y-5">

                {/* Section: Pelanggan */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
                    Customer Info
                  </p>
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--subtle)' }} />
                      <input
                        value={customerName} onChange={e => setCustomerName(e.target.value)}
                        placeholder="Customer name *"
                        className={inputCls + " pl-10"}
                        style={inputStyle}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--subtle)' }} />
                      <input
                        type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="Customer email *"
                        className={inputCls + " pl-10"}
                        style={inputStyle}
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--subtle)' }} />
                      <input
                        type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className={inputCls + " pl-10"}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Item */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
                      Item
                    </p>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: 'var(--love-soft)', color: 'var(--love)' }}
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                    <span className="col-span-6 text-[10px] font-medium" style={{ color: 'var(--subtle)' }}>Description</span>
                    <span className="col-span-2 text-[10px] font-medium text-center" style={{ color: 'var(--subtle)' }}>Qty</span>
                    <span className="col-span-3 text-[10px] font-medium" style={{ color: 'var(--subtle)' }}>Price (USD)</span>
                    <span className="col-span-1" />
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold w-4 h-4 rounded flex items-center justify-center"
                            style={{ background: 'var(--border)', color: 'var(--subtle)' }}>{idx + 1}</span>
                          <input
                            value={item.description}
                            onChange={e => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Product / service name"
                            className="w-full rounded-xl pl-8 pr-3 py-2.5 text-xs outline-none"
                            style={inputStyle}
                          />
                        </div>
                        <input
                          value={item.qty}
                          onChange={e => updateItem(item.id, 'qty', e.target.value)}
                          type="number" min="1"
                          className="col-span-2 rounded-xl px-2 py-2.5 text-xs outline-none text-center"
                          style={inputStyle}
                        />
                        <input
                          value={item.price}
                          onChange={e => updateItem(item.id, 'price', e.target.value.replace(/[^0-9.]/g, ''))}
                          placeholder="0.00"
                          className="col-span-3 rounded-xl px-3 py-2.5 text-xs outline-none"
                          style={inputStyle}
                        />
                        <div className="col-span-1 flex justify-center">
                          {items.length > 1 ? (
                            <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-lg flex items-center justify-center"
                              style={{ background: 'rgba(239,68,68,0.1)' }}>
                              <Trash2 className="w-3 h-3" style={{ color: 'var(--danger)' }} />
                            </button>
                          ) : <span />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: PPN + Diskon */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
                    Tax & Discount
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--muted)' }}>VAT (%)</label>
                      <input type="number" value={tax} onChange={e => setTax(Number(e.target.value))}
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--muted)' }}>Discount (%)</label>
                      <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                        className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--subtle)' }}>
                    Notes
                  </p>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Payment terms, special instructions, or other notes…"
                    rows={3}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    style={inputStyle}
                  />
                </div>

                {/* Summary */}
                <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--subtle)' }}>Summary</p>
                  <div className="flex justify-between text-sm" style={{ color: 'var(--muted)' }}>
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-sm" style={{ color: 'var(--success)' }}>
                      <span>Discount {discount}%</span>
                      <span className="tabular-nums font-medium">-${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {taxAmt > 0 && (
                    <div className="flex justify-between text-sm" style={{ color: 'var(--muted)' }}>
                      <span>VAT {tax}%</span>
                      <span className="tabular-nums font-medium">+${taxAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <div
                    className="flex justify-between text-base font-bold pt-2 mt-1"
                    style={{ color: 'var(--ink)', borderTop: '1px solid var(--border)' }}
                  >
                    <span>Total</span>
                    <span className="tabular-nums" style={{ color: 'var(--love)' }}>${total.toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="px-6 pb-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  disabled={!valid || isPending || isConfirming}
                  onClick={handleCreate}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'var(--gradient-love)', boxShadow: '0 4px 16px var(--love-glow)' }}
                >
                  {isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirm in wallet…</>
                    : isConfirming
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving to blockchain…</>
                    : <><ChevronRight className="w-4 h-4" /> Create Invoice</>}
                </button>
                <p className="text-center text-[11px] mt-2.5" style={{ color: 'var(--subtle)' }}>
                  Invoice stored permanently on Arc Testnet
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
