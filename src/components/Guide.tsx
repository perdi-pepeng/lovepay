import { QrCode, Link2, FileText, History, UserCircle, ArrowRight, Shield, Zap, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { LOVEPAY_CONTRACT, ARC_TESTNET_CHAIN_ID } from '../contract'
import { buildAddressExplorerUrl } from '@/onchain-facts'

interface AccordionProps { q: string; a: string }
function Accordion({ q, a }: AccordionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}>
        {q}
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm leading-relaxed"
          style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', borderTop: '1px solid var(--border)' }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function Guide() {
  const explorerUrl = buildAddressExplorerUrl(ARC_TESTNET_CHAIN_ID, LOVEPAY_CONTRACT.address)

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="display text-2xl font-bold mb-1" style={{ color: 'var(--ink)' }}>Panduan Lovepay</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Pelajari cara menggunakan setiap fitur platform</p>
      </div>

      {/* Cara Kerja — 3 langkah */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Cara Kerja
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              step: '01',
              title: 'Daftar sebagai Merchant',
              desc: 'Connect wallet, isi nama bisnis dan email. Data tersimpan permanen di blockchain — hanya perlu sekali.',
              color: 'var(--love)',
            },
            {
              step: '02',
              title: 'Buat Payment Link atau Invoice',
              desc: 'Payment Link untuk pembayaran umum yang bisa dibagikan ke siapa saja. Invoice untuk tagihan formal ke pelanggan tertentu dengan rincian item.',
              color: 'var(--accent-hover)',
            },
            {
              step: '03',
              title: 'Bagikan & Terima Pembayaran',
              desc: 'Bagikan link ke pelanggan. Customer connect wallet, approve USDC sekali, lalu bayar. USDC langsung masuk ke wallet kamu.',
              color: 'var(--success)',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-mono text-sm font-bold"
                style={{ background: `${color}18`, color }}>
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fitur-fitur */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Penjelasan Fitur
        </p>
        <div className="space-y-2">
          {[
            {
              icon: Link2,
              title: 'Payment Link',
              color: 'var(--accent-hover)',
              desc: 'Buat link pembayaran yang bisa dibagikan via WhatsApp, email, atau QR code. Bisa single-use (satu kali bayar) atau multi-use (berkali-kali). Opsional set nominal tetap atau biarkan customer isi sendiri.',
            },
            {
              icon: FileText,
              title: 'Invoice',
              color: 'var(--love)',
              desc: 'Tagihan formal dengan nomor invoice, nama pelanggan, rincian item, PPN, dan diskon. Nominal terkunci — customer harus bayar sesuai total. Status invoice otomatis berubah ke Lunas setelah dibayar.',
            },
            {
              icon: QrCode,
              title: 'QR Code',
              color: 'var(--success)',
              desc: 'Setiap payment link punya QR code yang bisa diunduh dan dicetak. Customer scan QR dengan kamera HP → langsung ke halaman pembayaran.',
            },
            {
              icon: History,
              title: 'Riwayat Transaksi',
              color: 'var(--love)',
              desc: 'Semua transaksi masuk (pembayaran dari customer) dan keluar (pembayaran yang kamu kirim). Filter berdasarkan arah, search by ID, dan export ke CSV.',
            },
            {
              icon: UserCircle,
              title: 'Profil Merchant',
              color: 'var(--accent-hover)',
              desc: 'Data bisnis kamu yang tersimpan di blockchain: nama, email, jenis bisnis, wallet address. Bisa diupdate kapan saja — perubahan disimpan onchain.',
            },
          ].map(({ icon: Icon, title, color, desc }) => (
            <div key={title} className="flex gap-4 p-4 rounded-2xl"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kenapa Blockchain */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Kenapa Blockchain?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Shield, title: 'Tidak Bisa Dimanipulasi', desc: 'Semua data tersimpan di smart contract yang immutable — tidak ada yang bisa mengubah atau menghapus riwayat transaksi.' },
            { icon: Zap,    title: 'Instan & Murah', desc: 'Transaksi konfirmasi dalam hitungan detik di Arc Testnet. Gas fee stabil karena Arc menggunakan USDC sebagai gas.' },
            { icon: Globe,  title: 'Tanpa Bank', desc: 'Terima pembayaran dari siapa saja di seluruh dunia tanpa rekening bank, tanpa proses KYC rumit, tanpa biaya transfer internasional.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-4 rounded-2xl text-center"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--love-soft)' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--love)' }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--subtle)' }}>
          Pertanyaan Umum
        </p>
        <div className="space-y-2">
          <Accordion
            q="Apa itu USDC?"
            a="USDC adalah stablecoin yang nilainya selalu setara 1 USD. Diterbitkan oleh Circle dan digunakan sebagai mata uang di Lovepay. Tidak seperti Bitcoin atau ETH, USDC tidak fluktuatif sehingga aman untuk transaksi bisnis."
          />
          <Accordion
            q="Apakah data saya aman?"
            a="Data merchant, payment link, invoice, dan transaksi tersimpan di smart contract yang immutable di blockchain Arc Testnet. Tidak ada server pusat yang bisa diretas atau dimanipulasi. Hanya wallet kamu yang bisa mengubah data bisnismu."
          />
          <Accordion
            q="Bagaimana customer membayar?"
            a="Customer buka link yang kamu bagikan, connect wallet mereka (MetaMask, Rabby, atau wallet lain), approve penggunaan USDC sekali, lalu konfirmasi pembayaran. USDC langsung masuk ke wallet kamu tanpa perantara."
          />
          <Accordion
            q="Apa bedanya Payment Link dan Invoice?"
            a="Payment Link bisa dibagikan ke siapa saja dan bisa multi-use (banyak orang bayar). Invoice ditujukan ke satu pelanggan spesifik dengan rincian item, nomor invoice, dan nominal yang terkunci — lebih formal untuk tagihan bisnis."
          />
          <Accordion
            q="Apakah ada biaya platform?"
            a="Lovepay tidak memungut biaya platform. Kamu hanya perlu membayar gas fee jaringan Arc (sangat kecil, dibayar dalam USDC). Semua pembayaran masuk 100% ke wallet kamu."
          />
          <Accordion
            q="Ini untuk testnet atau mainnet?"
            a="Saat ini Lovepay berjalan di Arc Testnet — semua USDC adalah testnet token tanpa nilai nyata. Ini untuk demonstrasi dan pengembangan. Untuk produksi dengan uang sungguhan, perlu deploy ke Arc Mainnet."
          />
        </div>
      </div>

      {/* Contract info footer */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
          Informasi Teknis
        </p>
        <div className="space-y-2 text-xs">
          {[
            ['Smart Contract', 'LovepayRegistry.sol'],
            ['Network', 'Arc Testnet (Chain ID: 5042002)'],
            ['Currency', 'USDC (6 desimal)'],
            ['Contract Address', `${LOVEPAY_CONTRACT.address.slice(0, 18)}…${LOVEPAY_CONTRACT.address.slice(-6)}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>{k}</span>
              <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mt-1"
          style={{ color: 'var(--love)' }}>
          Lihat Kontrak di Explorer <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
