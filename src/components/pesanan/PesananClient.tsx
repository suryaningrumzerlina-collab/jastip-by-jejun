'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { buildWaLink, formatRupiah, formatTanggalSingkat } from '@/lib/utils'
import { StickyToolbar } from '@/components/ui/StickyToolbar'
import { PesananFormModal } from './PesananFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type {
  Batch,
  Pemesan,
  PesananWithRelations,
  Produk,
  StatusJastip,
} from '@/types/database'

interface PesananClientProps {
  initialPesanan: PesananWithRelations[]
  batchList: Batch[]
  pemesanList: Pemesan[]
  produkList: Produk[]
}

type SortOption = 'waktu_desc' | 'waktu_asc' | 'nama_asc'
type ViewMode = 'card' | 'table'

const FILTER_CHIPS: { value: StatusJastip | 'semua'; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'tercatat', label: 'Tercatat' },
  { value: 'dapat_barang', label: 'Dapat Barang' },
  { value: 'terkonfirmasi', label: 'Terkonfirmasi' },
  { value: 'kosong_batal', label: 'Kosong/Batal' },
]

const STATUS_STYLE: Record<StatusJastip, { label: string; badge: string }> = {
  tercatat: { label: 'Tercatat', badge: 'text-[#636E72] bg-[#F0E6D6]' },
  dapat_barang: { label: 'Dapat Barang', badge: 'text-[#2D3436] bg-[#FFE66D]' },
  terkonfirmasi: { label: 'Terkonfirmasi', badge: 'text-white bg-[#4ECDC4]' },
  kosong_batal: { label: 'Kosong/Batal', badge: 'text-white bg-[#FF6B6B]' },
}

export function PesananClient({
  initialPesanan,
  batchList,
  pemesanList,
  produkList,
}: PesananClientProps) {
  const supabase = createClient()

  const [pesananList, setPesananList] = useState<PesananWithRelations[]>(initialPesanan)
  const [statusFilter, setStatusFilter] = useState<StatusJastip | 'semua'>('semua')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('waktu_desc')
  const [viewMode, setViewMode] = useState<ViewMode>('card')

  const [formOpen, setFormOpen] = useState(false)
  const [editingPesanan, setEditingPesanan] = useState<PesananWithRelations | null>(null)

  const [deletingPesanan, setDeletingPesanan] = useState<PesananWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filteredPesanan = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = pesananList.filter((item) => {
      const matchStatus = statusFilter === 'semua' || item.status_jastip === statusFilter
      if (!matchStatus) return false
      if (!q) return true
      return (
        (item.pemesan?.nama_jastiper ?? '').toLowerCase().includes(q) ||
        (item.produk?.nama_barang ?? '').toLowerCase().includes(q) ||
        (item.varian_dipilih ?? '').toLowerCase().includes(q)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'nama_asc') {
        return (a.pemesan?.nama_jastiper ?? '').localeCompare(
          b.pemesan?.nama_jastiper ?? '',
          'id'
        )
      }
      const timeA = new Date(a.order_time).getTime()
      const timeB = new Date(b.order_time).getTime()
      return sortBy === 'waktu_asc' ? timeA - timeB : timeB - timeA
    })
  }, [pesananList, statusFilter, search, sortBy])

  function handleOpenAdd() {
    setEditingPesanan(null)
    setFormOpen(true)
  }

  function handleOpenEdit(item: PesananWithRelations) {
    setEditingPesanan(item)
    setFormOpen(true)
  }

  function handleSaved(saved: PesananWithRelations, isEdit: boolean) {
    if (isEdit) {
      setPesananList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } else {
      setPesananList((prev) => [saved, ...prev])
    }
  }

  async function handleQuickStatus(item: PesananWithRelations, nextStatus: StatusJastip) {
    setUpdatingId(item.id)
    try {
      const { error } = await supabase
        .from('pesanan')
        .update({ status_jastip: nextStatus })
        .eq('id', item.id)

      if (!error) {
        setPesananList((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status_jastip: nextStatus } : p))
        )
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleConfirmWa(item: PesananWithRelations) {
    const nama = item.pemesan?.nama_jastiper ?? 'Kak'
    const noWa = item.pemesan?.no_wa
    const barang = item.produk?.nama_barang ?? 'barang pesanan'
    const varianText = item.varian_dipilih ? ` (${item.varian_dipilih})` : ''

    const pesan = `Halo Kak ${nama}, kabar baik dari Jastip by Jejun! Barang titipan Kakak:\n\n• ${barang}${varianText} x${item.qty}\n• Total: ${formatRupiah(item.harga_total)}\n\nSudah berhasil kami dapatkan ya! Mohon ditunggu rekap invoice & ongkirnya.`

    if (noWa) {
      window.open(buildWaLink(noWa, pesan), '_blank', 'noopener,noreferrer')
    }

    if (item.status_jastip !== 'terkonfirmasi') {
      await handleQuickStatus(item, 'terkonfirmasi')
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPesanan) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('pesanan')
        .delete()
        .eq('id', deletingPesanan.id)

      if (!error) {
        setPesananList((prev) => prev.filter((p) => p.id !== deletingPesanan.id))
      }
    } finally {
      setIsDeleting(false)
      setDeletingPesanan(null)
    }
  }

  return (
    <div className="space-y-4">
      <StickyToolbar
        eyebrow="Operasional Jastip"
        title="Daftar Pesanan"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama jastiper atau barang..."
        actionLabel="Catat"
        actionIcon="solar:add-circle-bold"
        onActionClick={handleOpenAdd}
      >
        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {FILTER_CHIPS.map((chip) => {
            const active = statusFilter === chip.value
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
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

        {/* Baris Sort & Switch Layout (Card / Table) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#EBDCC7]/70 shadow-xs">
            <Icon icon="solar:sort-vertical-bold" width={15} height={15} className="text-[#4ECDC4]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Urutkan pesanan"
              className="bg-transparent text-xs font-bold text-[#2D3436] focus:outline-none cursor-pointer"
            >
              <option value="waktu_desc">Terbaru</option>
              <option value="waktu_asc">Terlama</option>
              <option value="nama_asc">Nama (A–Z)</option>
            </select>
          </div>

          <div
            role="group"
            aria-label="Tampilan layout"
            className="flex items-center bg-white p-1 rounded-full border border-[#EBDCC7]/70 shadow-xs"
          >
            <button
              type="button"
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
              aria-label="Tampilan kartu"
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-[#4ECDC4]/15 text-[#4ECDC4]'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              <Icon icon="solar:widget-2-bold" width={15} height={15} />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="Tampilan tabel"
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#4ECDC4]/15 text-[#4ECDC4]'
                  : 'text-[#636E72] hover:text-[#2D3436]'
              }`}
            >
              <Icon icon="solar:list-bold" width={15} height={15} />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </StickyToolbar>

      {/* Konten Pesanan */}
      {filteredPesanan.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            Tidak ada pesanan pada filter ini.
          </p>
        </div>
      ) : viewMode === 'card' ? (
        /* TAMPILAN COLLAPSIBLE CARD */
        <div className="space-y-3">
          {filteredPesanan.map((item) => {
            const st = STATUS_STYLE[item.status_jastip]
            const isBusy = updatingId === item.id

            return (
              <details
                key={item.id}
                className="group bg-white rounded-[1.75rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 overflow-hidden"
              >
                {/* Summary Ringkas (Default Collapsed agar hemat scroll) */}
                <summary className="list-none cursor-pointer p-4 flex items-center justify-between gap-3 select-none">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-[#2D3436] truncate">
                        {item.pemesan?.nama_jastiper ?? 'Tanpa Nama'}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      {item.id_pengiriman && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C3AED6]/30 text-[#2D3436]">
                          Invoice
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[#636E72] truncate mt-1">
                      {item.produk?.nama_barang ?? 'Produk'}
                      {item.varian_dipilih ? ` (${item.varian_dipilih})` : ''} &times; {item.qty}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-sm text-[#2D3436]">
                      {formatRupiah(item.harga_total)}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      width={18}
                      height={18}
                      className="text-[#636E72] transition-transform group-open:rotate-180"
                    />
                  </div>
                </summary>

                {/* Detail & Tombol Aksi saat Dibuka */}
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-[#EBDCC7]/40 bg-[#FAF5EB]/30">
                  <div className="flex items-center justify-between text-xs font-bold text-[#636E72]">
                    <span>
                      {formatTanggalSingkat(item.order_time)}
                      {item.batch ? ` • ${item.batch.nama_batch}` : ''}
                    </span>
                    <span>@{formatRupiah(item.harga_satuan)}</span>
                  </div>

                  {item.catatan && (
                    <p className="text-xs font-bold text-[#636E72] bg-white rounded-xl px-3 py-2 border border-[#EBDCC7]/50">
                      Catatan: {item.catatan}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status_jastip === 'tercatat' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleQuickStatus(item, 'dapat_barang')}
                          className="h-9 px-3.5 rounded-full bg-[#FFE66D] hover:bg-[#ffd93d] text-[#2D3436] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Icon icon="solar:check-circle-bold" width={16} height={16} />
                          Dapat Barang
                        </button>
                      )}

                      {(item.status_jastip === 'dapat_barang' ||
                        item.status_jastip === 'terkonfirmasi') && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleConfirmWa(item)}
                          className="h-9 px-3.5 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Icon icon="solar:chat-round-check-bold" width={16} height={16} />
                          {item.status_jastip === 'terkonfirmasi' ? 'WA Lagi' : 'Konfirmasi WA'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        aria-label="Edit pesanan"
                        className="w-9 h-9 rounded-full bg-white border border-[#EBDCC7]/70 text-[#4ECDC4] hover:bg-[#4ECDC4]/10 flex items-center justify-center cursor-pointer"
                      >
                        <Icon icon="solar:pen-bold" width={17} height={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPesanan(item)}
                        aria-label="Hapus pesanan"
                        className="w-9 h-9 rounded-full bg-white border border-[#EBDCC7]/70 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 flex items-center justify-center cursor-pointer"
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={17} height={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      ) : (
        /* TAMPILAN TABEL */
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF5EB]/80 border-b border-[#EBDCC7] text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72]">
                  <th className="py-3 pl-4 pr-2">Pemesan</th>
                  <th className="py-3 px-2">Barang</th>
                  <th className="py-3 px-2 text-center">Qty</th>
                  <th className="py-3 px-2 text-right">Total</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 pl-2 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5EB] text-xs font-bold text-[#2D3436]">
                {filteredPesanan.map((item) => {
                  const st = STATUS_STYLE[item.status_jastip]
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF5EB]/40">
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                        <p className="font-black">{item.pemesan?.nama_jastiper ?? '-'}</p>
                        <p className="text-[10px] text-[#636E72]">
                          {formatTanggalSingkat(item.order_time)}
                        </p>
                      </td>
                      <td className="py-3 px-2 min-w-[140px]">
                        <p className="font-black leading-snug">
                          {item.produk?.nama_barang ?? '-'}
                        </p>
                        {item.varian_dipilih && (
                          <p className="text-[10px] text-[#636E72]">{item.varian_dipilih}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">{item.qty}</td>
                      <td className="py-3 px-2 text-right whitespace-nowrap font-black">
                        {formatRupiah(item.harga_total)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${st.badge}`}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1">
                          {(item.status_jastip === 'dapat_barang' ||
                            item.status_jastip === 'terkonfirmasi') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmWa(item)}
                              aria-label="Konfirmasi WA"
                              className="w-8 h-8 rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] hover:bg-[#4ECDC4] hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              <Icon icon="solar:chat-round-check-bold" width={15} height={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            aria-label="Edit pesanan"
                            className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#4ECDC4] flex items-center justify-center cursor-pointer"
                          >
                            <Icon icon="solar:pen-bold" width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPesanan(item)}
                            aria-label="Hapus pesanan"
                            className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#FF6B6B] flex items-center justify-center cursor-pointer"
                          >
                            <Icon icon="solar:trash-bin-trash-bold" width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PesananFormModal
        isOpen={formOpen}
        initialData={editingPesanan}
        batchList={batchList}
        pemesanList={pemesanList}
        produkList={produkList}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmModal
        isOpen={Boolean(deletingPesanan)}
        title="Hapus Pesanan?"
        message={`Pesanan "${deletingPesanan?.produk?.nama_barang ?? ''}" milik ${deletingPesanan?.pemesan?.nama_jastiper ?? ''} akan dihapus.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPesanan(null)}
      />
    </div>
  )
}