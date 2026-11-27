'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { buildWaLink, formatRupiah, formatTanggalSingkat } from '@/lib/utils'
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

  const [formOpen, setFormOpen] = useState(false)
  const [editingPesanan, setEditingPesanan] = useState<PesananWithRelations | null>(null)

  const [deletingPesanan, setDeletingPesanan] = useState<PesananWithRelations | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filteredPesanan = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pesananList.filter((item) => {
      const matchStatus = statusFilter === 'semua' || item.status_jastip === statusFilter
      if (!matchStatus) return false
      if (!q) return true
      return (
        (item.pemesan?.nama_jastiper ?? '').toLowerCase().includes(q) ||
        (item.produk?.nama_barang ?? '').toLowerCase().includes(q) ||
        (item.varian_dipilih ?? '').toLowerCase().includes(q)
      )
    })
  }, [pesananList, statusFilter, search])

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
    <div className="space-y-5">
      {/* Header + Tombol Tambah */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Operasional Jastip
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Daftar Pesanan
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Icon icon="solar:add-circle-bold" width={20} height={20} />
          <span>Catat</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50">
        <Icon icon="solar:magnifer-linear" className="text-[#4ECDC4] shrink-0" width={20} height={20} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama jastiper atau barang..."
          aria-label="Cari pesanan"
          className="w-full bg-transparent text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:outline-none"
        />
      </div>

      {/* Filter Chips (Cream Storybook Style: Pulsing Dot Active) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_CHIPS.map((chip) => {
          const active = statusFilter === chip.value
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setStatusFilter(chip.value)}
              className={`shrink-0 px-4 py-2 rounded-full border border-[#EBDCC7] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                active
                  ? 'bg-white text-[#FF6B6B] shadow-sm'
                  : 'bg-white/70 text-[#636E72] hover:bg-white'
              }`}
            >
              {active && <span className="w-2 h-2 rounded-full bg-[#FF6B6B] animate-pulse" />}
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Daftar Kartu Pesanan */}
      {filteredPesanan.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            Tidak ada pesanan pada filter ini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPesanan.map((item) => {
            const st = STATUS_STYLE[item.status_jastip]
            const isBusy = updatingId === item.id

            return (
              <article
                key={item.id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-3"
              >
                {/* Baris Atas: Nama Pemesan, Status, & Total */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-black text-base text-[#2D3436]">
                        {item.pemesan?.nama_jastiper ?? 'Tanpa Nama'}
                      </h2>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${st.badge}`}
                      >
                        {st.label}
                      </span>
                      {item.id_pengiriman && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C3AED6]/30 text-[#2D3436]">
                          Sudah Invoice
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#636E72] mt-1">
                      {item.produk?.nama_barang ?? 'Produk'}
                      {item.varian_dipilih ? ` (${item.varian_dipilih})` : ''} &times; {item.qty}
                    </p>
                    <p className="text-xs font-bold text-[#636E72]/70 mt-0.5">
                      {formatTanggalSingkat(item.order_time)}
                      {item.batch ? ` • ${item.batch.nama_batch}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-black text-base text-[#2D3436]">
                      {formatRupiah(item.harga_total)}
                    </p>
                    <p className="text-[11px] font-bold text-[#636E72]">
                      @{formatRupiah(item.harga_satuan)}
                    </p>
                  </div>
                </div>

                {/* Catatan jika ada */}
                {item.catatan && (
                  <p className="text-xs font-bold text-[#636E72] bg-[#FAF5EB] rounded-xl px-3 py-2">
                    Catatan: {item.catatan}
                  </p>
                )}

                {/* Baris Aksi Cepat */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBDCC7]/50">
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
                        {item.status_jastip === 'terkonfirmasi' ? 'Kirim WA Lagi' : 'Konfirmasi WA'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      aria-label="Edit pesanan"
                      className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon icon="solar:pen-bold" width={18} height={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPesanan(item)}
                      aria-label="Hapus pesanan"
                      className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center transition-colors cursor-pointer"
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

      {/* Modal Tambah / Edit */}
      <PesananFormModal
        isOpen={formOpen}
        initialData={editingPesanan}
        batchList={batchList}
        pemesanList={pemesanList}
        produkList={produkList}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Modal Konfirmasi Hapus */}
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