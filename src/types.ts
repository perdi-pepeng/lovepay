export type TxStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentMethod = 'usdc' | 'qr' | 'link'

export interface Transaction {
  id: string
  ref: string
  customer: string
  amount: number
  currency: string
  status: TxStatus
  method: PaymentMethod
  createdAt: Date
  description: string
  txHash?: string
}

export interface PaymentLink {
  id: string
  title: string
  amount: number | null
  memo: string
  recipientAddress: string
  uses: 'single' | 'multiple'
  createdAt: Date
  paidCount: number
  active: boolean
}

export interface InvoiceItem {
  id: string
  description: string
  qty: number
  price: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  items: InvoiceItem[]
  tax: number
  discount: number
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  createdAt: Date
  notes: string
}
