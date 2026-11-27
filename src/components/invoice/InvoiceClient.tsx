'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { buildWaLink, formatRupiah } from '@/lib/utils'
import { StickyToolbar } from '@/components/ui/StickyToolbar'
import { CreateInvoiceModal } from './CreateInvoiceModal'
import { EditInvoiceModal } from './EditInvoiceModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type {
  InvoiceWithRelations,
  Pemesan,
  PesananWithRelations,
  StatusPembayaran,
  StatusPengiriman,
} from '@/types/database'

interface InvoiceClientProps {
  initialInvoices: InvoiceWithRelations[]
  initialUnbilled: PesananWithRelations[]
  pemesanList: Pemesan[]
}

type InvoiceSort = 'nomor_desc' | 'nomor_asc' | 'nama_asc'

const BAYAR_BADGE: Record<StatusPembayaran, { label: string; style: string }> = {
  belum_lunas: { label: 'Belum Lunas', style: 'bg-[#FF6B6B] text-white' },
  dp: { label: 'DP', style: 'bg-[#FFE66D] text-[#2D3436]' },
  lunas: { label: 'Lunas', style: 'bg-[#4ECDC4] text-white' },
}

const KIRIM_BADGE: Record<StatusPengiriman, string> = {
  pengemasan: 'Pengemasan',
  dalam_pengiriman: 'Dikirim',
  selesai: 'Selesai',
}

export function InvoiceClient({
  initialInvoices,
  initialUnbilled,
  pemesanList,
}: InvoiceClientProps) {
  const supabase = createClient()

  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>(initialInvoices)
  const [unbilled, setUnbilled] = useState<PesananWithRelations[]>(initialUnbilled)
  const [filterBayar, setFilterBayar] = useState<StatusPembayaran | 'semua'>('semua')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<InvoiceSort>('nomor_desc')

  const [createOpen, setCreateOpen] = useState(false)
  const [editingInv, setEditingInv] = useState<InvoiceWithRelations | null>(null)
  const [deletingInv, setDeletingInv] = useState<InvoiceWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = invoices.filter((inv) => {
      const matchStatus = filterBayar === 'semua' || inv.status_pembayaran === filterBayar
      if (!matchStatus) return false
      if (!q) return true
      return (
        inv.nomor_invoice.toLowerCase().includes(q) ||
        (inv.pemesan?.nama_jastiper ?? '').toLowerCase().includes(q) ||
        (inv.resi ?? '').toLowerCase().includes(q)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'nama_asc') {
        return (a.pemesan?.nama_jastiper ?? '').localeCompare(
          b.pemesan?.nama_jastiper ?? '',
          'id'
        )
      }
      if (sortBy === 'nomor_asc') {
        return a.nomor_invoice.localeCompare(b.nomor_invoice)
      }
      return b.nomor_invoice.localeCompare(a.nomor_invoice)
    })
  }, [invoices, filterBayar, search, sortBy])

  function handleCreated(newInv: InvoiceWithRelations, bundledIds: string[]) {
    setInvoices((prev) => [newInv, ...prev])
    setUnbilled((prev) => prev.filter((p) => !bundledIds.includes(p.id)))
  }

  function handleUpdated(updated: InvoiceWithRelations) {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
  }

  async function handleConfirmDelete() {
    if (!deletingInv) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('invoice_pengiriman')
        .delete()
        .eq('id', deletingInv.id)

      if (!error) {
        setInvoices((prev) => prev.filter((inv) => inv.id !== deletingInv.id))
      }
    } finally {
      setIsDeleting(false)
      setDeletingInv(null)
    }
  }

  function buildInvoiceWaUrl(inv: InvoiceWithRelations) {
    const nama = inv.pemesan?.nama_jastiper ?? 'Kak'
    const noWa = inv.pemesan?.no_wa ?? ''
    const sisa =
      inv.status_pembayaran === 'lunas'
        ? 0
        : Math.max(0, inv.harga_total - inv.nominal_dp)

    const lines = [
      `Halo Kak ${nama}, berikut info invoice Jastip by Jejun:`,
      ``,
      `No. Invoice: ${inv.nomor_invoice}`,
      `Subtotal Barang: ${formatRupiah(inv.harga_bundle)}`,
      `Ongkir (${inv.jasa_pengiriman || 'Kurir'}): ${formatRupiah(inv.ongkir)}`,
      `Total: ${formatRupiah(inv.harga_total)}`,
    ]

    if (inv.status_pembayaran === 'dp') {
      lines.push(`DP Masuk: ${formatRupiah(inv.nominal_dp)}`)
      lines.push(`Sisa Tagihan: ${formatRupiah(sisa)}`)
    } else if (inv.status_pembayaran === 'lunas') {
      lines.push(`Status: LUNAS`)
    }

    if (inv.resi) {
      lines.push(`No. Resi: ${inv.resi}`)
    }
    if (inv.jatuh_tempo && inv.status_pembayaran !== 'lunas') {
      lines.push(`Jatuh Tempo: ${inv.jatuh_tempo}`)
    }

    lines.push(``, `Terima kasih sudah jastip di Jastip by Jejun!`)
    return buildWaLink(noWa, lines.join('\n'))
  }

  return (
    <div className="space-y-4">
      <StickyToolbar
        eyebrow="Tagihan & Kurir"
        title="Invoice & Kirim"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nomor invoice, nama, atau resi..."
        actionLabel="Buat"
        actionIcon="solar:bill-check-bold"
        onActionClick={() => setCreateOpen(true)}
        actionBadge={unbilled.length}
      >
        {/* Filter Pembayaran & Sort */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {(
              [
                { value: 'semua', label: 'Semua' },
                { value: 'belum_lunas', label: 'Belum Lunas' },
                { value: 'dp', label: 'DP' },
                { value: 'lunas', label: 'Lunas' },
              ] as const
            ).map((chip) => {
              const active = filterBayar === chip.value
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFilterBayar(chip.value)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border border-[#EBDCC7] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#FF6B6B] shadow-sm'
                      : 'bg-white/75 text-[#636E72] hover:bg-white'
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />}
                  {chip.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#EBDCC7]/70 shadow-xs shrink-0">
            <Icon icon="solar:sort-vertical-bold" width={15} height={15} className="text-[#4ECDC4]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as InvoiceSort)}
              aria-label="Urutkan invoice"
              className="bg-transparent text-xs font-bold text-[#2D3436] focus:outline-none cursor-pointer"
            >
              <option value="nomor_desc">No. Invoice (Terbaru)</option>
              <option value="nomor_asc">No. Invoice (Terlama)</option>
              <option value="nama_asc">Nama (A–Z)</option>
            </select>
          </div>
        </div>
      </StickyToolbar>

      {/* Daftar Invoice */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            Belum ada invoice pada filter ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const bayar = BAYAR_BADGE[inv.status_pembayaran]
            return (
              <article
                key={inv.id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#4ECDC4]">
                        {inv.nomor_invoice}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${bayar.style}`}
                      >
                        {bayar.label}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF5EB] text-[#636E72] border border-[#EBDCC7]">
                        {KIRIM_BADGE[inv.status_pengiriman]}
                      </span>
                    </div>

                    <h2 className="font-black text-lg text-[#2D3436] mt-1">
                      {inv.pemesan?.nama_jastiper ?? 'Tanpa Nama'}
                    </h2>

                    <p className="text-xs font-bold text-[#636E72] mt-0.5">
                      {inv.jasa_pengiriman || 'Kurir belum diisi'}
                      {inv.resi ? ` • Resi: ${inv.resi}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-lg text-[#2D3436]">
                      {formatRupiah(inv.harga_total)}
                    </p>
                    {inv.status_pembayaran === 'dp' && (
                      <p className="text-[11px] font-bold text-[#FF6B6B]">
                        Sisa {formatRupiah(Math.max(0, inv.harga_total - inv.nominal_dp))}
                      </p>
                    )}
                  </div>
                </div>

                {/* Baris Aksi */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#EBDCC7]/50">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/invoice/${inv.id}`}
                      className="h-9 px-3.5 rounded-full bg-[#FAF5EB] hover:bg-[#F0E6D6] text-[#2D3436] font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Icon icon="solar:printer-bold" width={16} height={16} className="text-[#FF6B6B]" />
                      Detail / PDF
                    </Link>

                    {inv.pemesan?.no_wa && (
                      <a
                        href={buildInvoiceWaUrl(inv)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3.5 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Icon icon="solar:chat-round-line-bold" width={16} height={16} />
                        WA
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingInv(inv)}
                      aria-label={`Update ${inv.nomor_invoice}`}
                      className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center cursor-pointer"
                    >
                      <Icon icon="solar:pen-bold" width={18} height={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingInv(inv)}
                      aria-label={`Hapus ${inv.nomor_invoice}`}
                      className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center cursor-pointer"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" width={18} height={18} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={createOpen}
        pemesanList={pemesanList}
        unbilledPesanan={unbilled}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditInvoiceModal
        invoice={editingInv}
        onClose={() => setEditingInv(null)}
        onUpdated={handleUpdated}
      />

      <ConfirmModal
        isOpen={Boolean(deletingInv)}
        title="Hapus Invoice?"
        message={`Invoice ${deletingInv?.nomor_invoice ?? ''} akan dihapus. Pesanan di dalamnya akan otomatis kembali berstatus belum ditagih.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingInv(null)}
      />
    </div>
  )
}