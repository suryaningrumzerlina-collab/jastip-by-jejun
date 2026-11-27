'use client'

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { ProdukFormModal } from './ProdukFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Produk } from '@/types/database'

export function ProdukClient({ initialProduk }: { initialProduk: Produk[] }) {
  const supabase = createClient()

  const [produkList, setProdukList] = useState<Produk[]>(initialProduk)
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null)

  const [deletingProduk, setDeletingProduk] = useState<Produk | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const filteredProduk = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return produkList
    return produkList.filter(
      (p) =>
        p.nama_barang.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    )
  }, [produkList, search])

  function handleOpenAdd() {
    setEditingProduk(null)
    setFormOpen(true)
  }

  function handleOpenEdit(item: Produk) {
    setEditingProduk(item)
    setFormOpen(true)
  }

  function handleSaved(saved: Produk, isEdit: boolean) {
    if (isEdit) {
      setProdukList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } else {
      setProdukList((prev) => [saved, ...prev])
    }
  }

  async function handleConfirmDelete() {
    if (!deletingProduk) return
    setIsDeleting(true)
    setFeedbackError(null)

    try {
      const { error } = await supabase
        .from('produk')
        .delete()
        .eq('id', deletingProduk.id)

      if (error) {
        if (error.code === '23503') {
          setFeedbackError(
            `Produk "${deletingProduk.nama_barang}" tidak bisa dihapus karena sudah tercatat di daftar pesanan.`
          )
        } else {
          setFeedbackError(error.message)
        }
        return
      }

      setProdukList((prev) => prev.filter((p) => p.id !== deletingProduk.id))
    } finally {
      setIsDeleting(false)
      setDeletingProduk(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Tombol Tambah */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Master Katalog
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Daftar Produk
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Icon icon="solar:add-circle-bold" width={20} height={20} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search Bar (Cream Storybook Pill) */}
      <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50">
        <Icon icon="solar:magnifer-linear" className="text-[#4ECDC4] shrink-0" width={20} height={20} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama barang atau brand..."
          aria-label="Cari produk"
          className="w-full bg-transparent text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:outline-none"
        />
      </div>

      {/* Error Banner jika gagal hapus karena relasi */}
      {feedbackError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start justify-between gap-3 bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-2xl px-4 py-3 text-xs font-bold"
        >
          <span>{feedbackError}</span>
          <button
            type="button"
            onClick={() => setFeedbackError(null)}
            aria-label="Tutup pesan error"
            className="shrink-0 cursor-pointer"
          >
            <Icon icon="solar:close-circle-bold" width={18} height={18} />
          </button>
        </div>
      )}

      {/* Daftar Produk */}
      {filteredProduk.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            {search ? 'Produk tidak ditemukan.' : 'Belum ada produk. Klik "+ Tambah" untuk memulai.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProduk.map((item) => {
            const varianList = Array.isArray(item.varian) ? item.varian : []
            return (
              <article
                key={item.id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.brand && (
                      <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] text-[#4ECDC4] mb-1">
                        {item.brand}
                      </span>
                    )}
                    <h2 className="font-black text-lg text-[#2D3436] leading-snug">
                      {item.nama_barang}
                    </h2>
                    <p className="font-black text-base text-[#FF6B6B] mt-0.5">
                      {formatRupiah(item.harga_dasar)}
                    </p>
                  </div>

                  {/* Aksi Edit & Hapus */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      aria-label={`Edit ${item.nama_barang}`}
                      className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon icon="solar:pen-bold" width={20} height={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduk(item)}
                      aria-label={`Hapus ${item.nama_barang}`}
                      className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" width={20} height={20} />
                    </button>
                  </div>
                </div>

                {/* Daftar Chip Varian JSONB */}
                {varianList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {varianList.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-[#FAF5EB] border border-[#EBDCC7] px-3 py-1 rounded-full text-xs font-bold text-[#2D3436]"
                      >
                        <span>{v.nama}</span>
                        <span className="text-[#636E72]">&bull;</span>
                        <span className="text-[#4ECDC4]">{formatRupiah(v.harga)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* Modal Tambah / Edit */}
      <ProdukFormModal
        isOpen={formOpen}
        initialData={editingProduk}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={Boolean(deletingProduk)}
        title="Hapus Produk?"
        message={`Produk "${deletingProduk?.nama_barang ?? ''}" akan dihapus dari katalog.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduk(null)}
      />
    </div>
  )
}