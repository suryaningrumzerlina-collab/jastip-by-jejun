'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'

export function InvoicePrintActions({ waUrl }: { waUrl: string | null }) {
  return (
    <div className="print:hidden flex items-center justify-between gap-3 mb-5">
      <Link
        href="/invoice"
        className="h-11 px-4 rounded-full bg-white border border-[#EBDCC7] text-[#2D3436] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#FAF5EB]"
      >
        <Icon icon="solar:arrow-left-bold" width={18} height={18} className="text-[#4ECDC4]" />
        Kembali
      </Link>

      <div className="flex items-center gap-2">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Icon icon="solar:chat-round-line-bold" width={18} height={18} />
            Kirim WA
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="h-11 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Icon icon="solar:printer-bold" width={18} height={18} />
          Cetak / PDF
        </button>
      </div>
    </div>
  )
}