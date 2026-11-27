'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { buildWaLink, formatRupiah } from '@/lib/utils'
import { generateAndUploadInvoicePdf } from '@/lib/invoicePdf'
import type { InvoiceWithRelations, PesananWithRelations } from '@/types/database'

interface InvoicePrintActionsProps {
  invoice: InvoiceWithRelations
  items: PesananWithRelations[]
}

export function InvoicePrintActions({ invoice, items }: InvoicePrintActionsProps) {
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSendPdfWa() {
    if (!invoice.pemesan?.no_wa) return
    setIsSending(true)
    setErrorMsg(null)

    try {
      const pdfUrl = await generateAndUploadInvoicePdf(invoice, items)
      const sisa =
        invoice.status_pembayaran === 'lunas'
          ? 0
          : Math.max(0, invoice.harga_total - invoice.nominal_dp)

      const pesan = [
        `Halo Kak ${invoice.pemesan.nama_jastiper}, berikut invoice Jastip by Jejun:`,
        ``,
        `No. Invoice: ${invoice.nomor_invoice}`,
        `Total: ${formatRupiah(invoice.harga_total)}`,
        invoice.status_pembayaran === 'lunas'
          ? `Status: LUNAS`
          : `Sisa Tagihan: ${formatRupiah(sisa)}`,
        invoice.resi ? `No. Resi: ${invoice.resi}` : '',
        ``,
        `Download Invoice PDF:`,
        pdfUrl,
      ]
        .filter(Boolean)
        .join('\n')

      window.open(buildWaLink(invoice.pemesan.no_wa, pesan), '_blank', 'noopener,noreferrer')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat & upload PDF.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="print:hidden space-y-2 mb-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Link
          href="/invoice"
          className="h-11 px-4 rounded-full bg-white border border-[#EBDCC7] text-[#2D3436] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#FAF5EB]"
        >
          <Icon icon="solar:arrow-left-bold" width={18} height={18} className="text-[#4ECDC4]" />
          Kembali
        </Link>

        <div className="flex items-center gap-2">
          {invoice.pemesan?.no_wa && (
            <button
              type="button"
              disabled={isSending}
              onClick={handleSendPdfWa}
              className="h-11 px-4 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
            >
              <Icon
                icon={isSending ? 'solar:refresh-bold' : 'solar:chat-round-line-bold'}
                width={18}
                height={18}
                className={isSending ? 'animate-spin' : ''}
              />
              {isSending ? 'Membuat PDF...' : 'Kirim PDF ke WA'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 px-4 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Icon icon="solar:printer-bold" width={18} height={18} />
            Cetak / PDF
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-2xl px-4 py-2.5 text-xs font-bold"
        >
          {errorMsg}
        </div>
      )}
    </div>
  )
}