import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Copy, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'

interface QRModalProps {
  /** Either pass a pre-built URL (for invoices / arbitrary links) */
  url?: string
  /** Or pass legacy Payment Link fields — url takes precedence */
  linkId?: string
  title: string
  amount?: string
  memo?: string
  onClose: () => void
}

export default function QRModal({ url: urlProp, linkId, title, amount, memo, onClose }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('')

  const url = urlProp ?? (
    linkId
      ? `${window.location.origin}?checkout=${linkId}&amount=${amount ?? ''}&memo=${encodeURIComponent(memo ?? '')}`
      : ''
  )

  const filename = `lovepay-qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`

  useEffect(() => {
    if (!url) return
    void QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#122d45', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(du => { setDataUrl(du) })
  }, [url])

  const handleDownload = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    const tab = window.open('', '_blank')
    if (tab) {
      tab.document.write(`
        <html><head><title>QR Lovepay - ${title}</title>
        <style>body{margin:0;background:#0d1117;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#fff}
        img{border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
        p{margin-top:16px;font-size:14px;opacity:.7}
        a{color:#e83e8c;font-weight:600;text-decoration:none}</style></head>
        <body><img src="${dataUrl}" width="280" height="280"/>
        <p>Right-click the image → <strong>Save image as…</strong> to download</p>
        <p><a href="${url}" target="_blank">🔗 Open Payment Link</a></p>
        </body></html>`)
      tab.document.close()
    }
    toast.success('QR opened in new tab — right-click → Save image')
  }

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#e83e8c,#f9a8d4,#e83e8c)' }} />

        <div className="p-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-5">
            <div className="display font-bold text-base" style={{ color: 'var(--ink)' }}>QR Payment</div>
            <button onClick={onClose} className="p-1.5 rounded-full transition-all" style={{ background: 'var(--surface-muted)' }}>
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          </div>

          {/* QR image — right-click saveable */}
          <div className="p-3 rounded-2xl mb-4" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
            {dataUrl
              ? <img src={dataUrl} alt="QR Payment" width={220} height={220} className="rounded-lg block" />
              : <div className="w-[220px] h-[220px] rounded-lg animate-pulse" style={{ background: 'var(--surface-muted)' }} />
            }
          </div>

          <div className="text-center mb-4 w-full">
            <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</div>
            {amount
              ? <div className="display text-2xl font-bold tabular-nums mt-1" style={{ color: 'var(--love)' }}>${amount} <span className="text-base font-semibold">USDC</span></div>
              : <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Open amount</div>
            }
            {memo && <div className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>{memo}</div>}
          </div>

          <p className="text-xs text-center mb-5" style={{ color: 'var(--subtle)' }}>
            Scan QR with your phone camera or share the link with your customer
          </p>

          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--gradient-love)', boxShadow: dataUrl ? '0 4px 14px var(--love-glow)' : 'none' }}
            >
              <Download className="w-3.5 h-3.5" />
              <ExternalLink className="w-3 h-3 opacity-60" />
              Download QR
            </button>
          </div>

          {dataUrl && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--subtle)' }}>
              Or right-click the QR image above → <strong>Save image</strong>
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
