import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Copy, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'

interface QRModalProps {
  linkId: string
  title: string
  amount: string
  memo: string
  onClose: () => void
}

export default function QRModal({ linkId, title, amount, memo, onClose }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('')
  const url = `${window.location.origin}?checkout=${linkId}&amount=${amount}&memo=${encodeURIComponent(memo)}`
  const filename = `lovepay-qr-${title.replace(/\s+/g, '-').toLowerCase()}.png`

  useEffect(() => {
    void QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#122d45', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(du => { setDataUrl(du) })
  }, [url])

  // Strategy: open data URL in new tab — bypasses iframe sandbox download restriction.
  // User sees the image full-screen and can right-click → Save / long-press → Save on mobile.
  const handleDownload = () => {
    if (!dataUrl) return
    // Try native download first (works in full browser window)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    // Also open in new tab as reliable fallback (works inside sandboxed iframe too)
    const tab = window.open('', '_blank')
    if (tab) {
      tab.document.write(`
        <html><head><title>QR Lovepay - ${title}</title>
        <style>body{margin:0;background:#0d1117;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#fff}
        img{border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
        p{margin-top:16px;font-size:14px;opacity:.7}
        a{color:#e83e8c;font-weight:600;text-decoration:none}</style></head>
        <body><img src="${dataUrl}" width="280" height="280"/>
        <p>Klik kanan gambar → <strong>Simpan gambar sebagai…</strong> untuk mengunduh</p>
        <p><a href="${url}" target="_blank">🔗 Buka Payment Link</a></p>
        </body></html>`)
      tab.document.close()
    }
    toast.success('QR dibuka di tab baru — klik kanan → Simpan gambar')
  }

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(url)
    toast.success('Link disalin!')
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

          {/* QR as <img> — right-click saveable, no canvas taint issues */}
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
              : <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Jumlah bebas</div>
            }
            {memo && <div className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>{memo}</div>}
          </div>

          <p className="text-xs text-center mb-5" style={{ color: 'var(--subtle)' }}>
            Scan QR dengan kamera HP atau bagikan link ke pelanggan
          </p>

          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:opacity-80"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            >
              <Copy className="w-3.5 h-3.5" /> Salin Link
            </button>
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--gradient-love)', boxShadow: dataUrl ? '0 4px 14px var(--love-glow)' : 'none' }}
            >
              <Download className="w-3.5 h-3.5" />
              <ExternalLink className="w-3 h-3 opacity-60" />
              Unduh QR
            </button>
          </div>

          {dataUrl && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--subtle)' }}>
              Atau klik kanan gambar QR di atas → <strong>Simpan gambar</strong>
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
