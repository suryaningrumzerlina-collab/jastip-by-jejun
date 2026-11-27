'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { StickyToolbar } from '@/components/ui/StickyToolbar'
import { ProdukFormModal } from './ProdukFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Produk } from '@/types/database'

type ViewMode = 'card' | 'table'

export function ProdukClient({ initialProduk }: { initialProduk: Produk[] }) {
  const supabase = createClient()

  const [produkList, setProdukList] = useState<Produk[]>(initialProduk)
  const [search, setSearch] = useState('')
  const [groupByBrand, setGroupByBrand] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('card')

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

  const brandFolders = useMemo(() => {
    const map = new Map<string, Produk[]>()
    for (const item of filteredProduk) {
      const brandName = item.brand?.trim() || 'Tanpa Brand'
      const list = map.get(brandName) ?? []
      list.push(item)
      map.set(brandName, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'id'))
  }, [filteredProduk])

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

  function renderProdukCard(item: Produk) {
    const varianList = Array.isArray(item.varian) ? item.varian : []
    return (
      <article
        key={item.id}
        className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {!groupByBrand && item.brand && (
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
  }

  return (
    <div className="space-y-4">
      <StickyToolbar
        eyebrow="Master Katalog"
        title="Daftar Produk"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama barang atau brand..."
        actionLabel="Tambah"
        actionIcon="solar:add-circle-bold"
        onActionClick={handleOpenAdd}
      >
        {/* Toggle Folder Brand & Switch Layout Card/Tabel */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={viewMode === 'table'}
            onClick={() => setGroupByBrand((prev) => !prev)}
            aria-pressed={groupByBrand}
            className={`px-3.5 py-1.5 rounded-full border border-[#EBDCC7] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              groupByBrand && viewMode === 'card'
                ? 'bg-white text-[#FF6B6B] shadow-sm'
                : 'bg-white/75 text-[#636E72] hover:bg-white'
            }`}
          >
            <Icon icon="solar:folder-with-files-bold" width={16} height={16} />
            <span>Folder Brand</span>
          </button>

          <div
            role="group"
            aria-label="Tampilan layout"
            className="flex items-center bg-white p-1 rounded-full border border-[#EBDCC7]/70 shadow-xs"
          >
            <button
              type="button"
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
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

      {/* Error Banner */}
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

      {/* Konten Produk */}
      {filteredProduk.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            {search ? 'Produk tidak ditemukan.' : 'Belum ada produk. Klik "+ Tambah" untuk memulai.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TAMPILAN TABEL */
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF5EB]/80 border-b border-[#EBDCC7] text-[10px] font-black uppercase tracking-[0.1em] text-[#636E72]">
                  <th className="py-3 pl-4 pr-2">Produk</th>
                  <th className="py-3 px-2">Brand</th>
                  <th className="py-3 px-2 text-right">Harga Dasar</th>
                  <th className="py-3 px-2 text-center">Varian</th>
                  <th className="py-3 pl-2 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF5EB] text-xs font-bold text-[#2D3436]">
                {filteredProduk.map((item) => {
                  const varianCount = Array.isArray(item.varian) ? item.varian.length : 0
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF5EB]/40">
                      <td className="py-3 pl-4 pr-2 font-black min-w-[140px]">
                        {item.nama_barang}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap text-[#4ECDC4]">
                        {item.brand || '-'}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap font-black text-[#FF6B6B]">
                        {formatRupiah(item.harga_dasar)}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="bg-[#FAF5EB] border border-[#EBDCC7] px-2 py-0.5 rounded-full text-[10px]">
                          {varianCount}
                        </span>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            aria-label={`Edit ${item.nama_barang}`}
                            className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#4ECDC4] flex items-center justify-center cursor-pointer"
                          >
                            <Icon icon="solar:pen-bold" width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduk(item)}
                            aria-label={`Hapus ${item.nama_barang}`}
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
      ) : groupByBrand ? (
        /* TAMPILAN FOLDER BY BRAND */
        <div className="space-y-3">
          {brandFolders.map(([brandName, items]) => (
            <details
              key={brandName}
              className="group bg-[#FAF5EB]/60 rounded-[2rem] border border-[#EBDCC7] overflow-hidden"
            >
              <summary className="list-none cursor-pointer bg-white px-5 py-4 flex items-center justify-between gap-3 select-none shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#FFE66D]/40 text-[#2D3436] flex items-center justify-center shrink-0">
                    <Icon icon="solar:folder-bold" width={22} height={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-black text-base text-[#2D3436] truncate">
                      {brandName}
                    </h2>
                    <p className="text-xs font-bold text-[#636E72]">
                      {items.length} produk
                    </p>
                  </div>
                </div>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  width={20}
                  height={20}
                  className="text-[#636E72] transition-transform group-open:rotate-180 shrink-0"
                />
              </summary>
              <div className="p-3 space-y-3">{items.map(renderProdukCard)}</div>
            </details>
          ))}
        </div>
      ) : (
        /* TAMPILAN CARD STANDAR */
        <div className="space-y-3">{filteredProduk.map(renderProdukCard)}</div>
      )}

      <ProdukFormModal
        isOpen={formOpen}
        initialData={editingProduk}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

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