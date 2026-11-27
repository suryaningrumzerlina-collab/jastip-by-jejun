'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { BatchFormModal } from './BatchFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Batch, StatusBatch } from '@/types/database'

export function BatchClient({ initialBatch }: { initialBatch: Batch[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [batchList, setBatchList] = useState<Batch[]>(initialBatch)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  function handleSaved(saved: Batch, isEdit: boolean) {
    if (isEdit) {
      setBatchList((prev) => prev.map((b) => (b.id === saved.id ? saved : b)))
    } else {
      setBatchList((prev) => [saved, ...prev])
    }
    router.refresh() // Perbarui pill Batch Aktif di Top Bar
  }

  async function handleToggleStatus(item: Batch) {
    const nextStatus: StatusBatch = item.status === 'aktif' ? 'selesai' : 'aktif'
    setTogglingId(item.id)
    try {
      const { error } = await supabase
        .from('batch')
        .update({ status: nextStatus })
        .eq('id', item.id)

      if (!error) {
        setBatchList((prev) =>
          prev.map((b) => (b.id === item.id ? { ...b, status: nextStatus } : b))
        )
        router.refresh()
      }
    } finally {
      setTogglingId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBatch) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('batch')
        .delete()
        .eq('id', deletingBatch.id)

      if (!error) {
        setBatchList((prev) => prev.filter((b) => b.id !== deletingBatch.id))
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
      setDeletingBatch(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Kloter &amp; Trip
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Kelola Batch PO
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBatch(null)
            setFormOpen(true)
          }}
          className="h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Icon icon="solar:calendar-add-bold" width={20} height={20} />
          <span>Tambah</span>
        </button>
      </div>

      {batchList.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            Belum ada Batch PO. Klik &ldquo;+ Tambah&rdquo; untuk membuka kloter baru.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchList.map((item) => {
            const isAktif = item.status === 'aktif'
            return (
              <article
                key={item.id}
                className="bg-white rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isAktif
                          ? 'bg-[#4ECDC4] text-white'
                          : 'bg-[#F0E6D6] text-[#636E72]'
                      }`}
                    >
                      {isAktif ? 'Aktif' : 'Selesai'}
                    </span>
                    {item.tanggal_tutup && (
                      <span className="text-xs font-bold text-[#636E72]">
                        Tutup: {item.tanggal_tutup}
                      </span>
                    )}
                  </div>
                  <h2 className="font-black text-lg text-[#2D3436] mt-1 truncate">
                    {item.nama_batch}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={togglingId === item.id}
                    onClick={() => handleToggleStatus(item)}
                    className="h-9 px-3 rounded-full bg-[#FAF5EB] hover:bg-[#F0E6D6] text-xs font-bold text-[#2D3436] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAktif ? 'Tutup PO' : 'Aktifkan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBatch(item)
                      setFormOpen(true)
                    }}
                    aria-label={`Edit ${item.nama_batch}`}
                    className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:pen-bold" width={18} height={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingBatch(item)}
                    aria-label={`Hapus ${item.nama_batch}`}
                    className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={18} height={18} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <BatchFormModal
        isOpen={formOpen}
        initialData={editingBatch}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmModal
        isOpen={Boolean(deletingBatch)}
        title="Hapus Batch PO?"
        message={`Batch "${deletingBatch?.nama_batch ?? ''}" akan dihapus. Pesanan di dalam batch ini tidak akan ikut terhapus.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingBatch(null)}
      />
    </div>
  )
}