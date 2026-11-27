'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { buildWaLink } from '@/lib/utils'
import { PemesanFormModal } from './PemesanFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Pemesan } from '@/types/database'

export function PemesanClient({ initialPemesan }: { initialPemesan: Pemesan[] }) {
  const supabase = createClient()

  const [pemesanList, setPemesanList] = useState<Pemesan[]>(initialPemesan)
  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingPemesan, setEditingPemesan] = useState<Pemesan | null>(null)

  const [deletingPemesan, setDeletingPemesan] = useState<Pemesan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const filteredPemesan = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pemesanList
    return pemesanList.filter(
      (p) =>
        p.nama_jastiper.toLowerCase().includes(q) ||
        p.no_wa.includes(q) ||
        (p.alamat && p.alamat.toLowerCase().includes(q))
    )
  }, [pemesanList, search])

  function handleOpenAdd() {
    setEditingPemesan(null)
    setFormOpen(true)
  }

  function handleOpenEdit(item: Pemesan) {
    setEditingPemesan(item)
    setFormOpen(true)
  }

  function handleSaved(saved: Pemesan, isEdit: boolean) {
    if (isEdit) {
      setPemesanList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    } else {
      setPemesanList((prev) => [saved, ...prev])
    }
  }

  async function handleConfirmDelete() {
    if (!deletingPemesan) return
    setIsDeleting(true)
    setFeedbackError(null)

    try {
      const { error } = await supabase
        .from('pemesan')
        .delete()
        .eq('id', deletingPemesan.id)

      if (error) {
        if (error.code === '23503') {
          setFeedbackError(
            `Kontak "${deletingPemesan.nama_jastiper}" tidak bisa dihapus karena sudah memiliki riwayat pesanan atau invoice.`
          )
        } else {
          setFeedbackError(error.message)
        }
        return
      }

      setPemesanList((prev) => prev.filter((p) => p.id !== deletingPemesan.id))
    } finally {
      setIsDeleting(false)
      setDeletingPemesan(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Tombol Tambah */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Master Kontak
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Kontak Jastiper
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Icon icon="solar:user-plus-bold" width={20} height={20} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50">
        <Icon icon="solar:magnifer-linear" className="text-[#4ECDC4] shrink-0" width={20} height={20} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, nomor WA, atau alamat..."
          aria-label="Cari kontak jastiper"
          className="w-full bg-transparent text-sm font-bold text-[#2D3436] placeholder:text-[#636E72]/60 focus:outline-none"
        />
      </div>

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

      {/* Daftar Kontak */}
      {filteredPemesan.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            {search ? 'Kontak tidak ditemukan.' : 'Belum ada kontak jastiper tersimpan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPemesan.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-black text-lg text-[#2D3436] leading-snug">
                    {item.nama_jastiper}
                  </h2>
                  <p className="text-xs font-bold text-[#4ECDC4] mt-0.5">
                    +{item.no_wa}
                  </p>
                </div>

                {/* Aksi WA, Edit, Hapus */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={buildWaLink(
                      item.no_wa,
                      `Halo Kak ${item.nama_jastiper}, ini dari admin Jastip by Jejun!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Chat WhatsApp ${item.nama_jastiper}`}
                    className="w-10 h-10 rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] hover:bg-[#4ECDC4] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Icon icon="solar:chat-round-line-bold" width={20} height={20} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    aria-label={`Edit ${item.nama_jastiper}`}
                    className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon icon="solar:pen-bold" width={20} height={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingPemesan(item)}
                    aria-label={`Hapus ${item.nama_jastiper}`}
                    className="w-10 h-10 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={20} height={20} />
                  </button>
                </div>
              </div>

              {item.alamat && (
                <div className="flex items-start gap-2 pt-1 text-xs font-bold text-[#636E72]">
                  <Icon
                    icon="solar:map-point-bold"
                    width={16}
                    height={16}
                    className="text-[#FF6B6B] shrink-0 mt-0.5"
                  />
                  <p className="leading-relaxed">{item.alamat}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit */}
      <PemesanFormModal
        isOpen={formOpen}
        initialData={editingPemesan}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        isOpen={Boolean(deletingPemesan)}
        title="Hapus Kontak?"
        message={`Kontak "${deletingPemesan?.nama_jastiper ?? ''}" akan dihapus dari daftar.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPemesan(null)}
      />
    </div>
  )
}