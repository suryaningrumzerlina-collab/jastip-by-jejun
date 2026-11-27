'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { buildWaLink } from '@/lib/utils'
import { StickyToolbar } from '@/components/ui/StickyToolbar'
import { PemesanFormModal } from './PemesanFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Pemesan } from '@/types/database'

export function PemesanClient({ initialPemesan }: { initialPemesan: Pemesan[] }) {
  const supabase = createClient()
  const detailDialogRef = useRef<HTMLDialogElement>(null)

  const [pemesanList, setPemesanList] = useState<Pemesan[]>(initialPemesan)
  const [search, setSearch] = useState('')

  const [selectedContact, setSelectedContact] = useState<Pemesan | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPemesan, setEditingPemesan] = useState<Pemesan | null>(null)

  const [deletingPemesan, setDeletingPemesan] = useState<Pemesan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = detailDialogRef.current
    if (!dialog) return
    if (selectedContact && !dialog.open) {
      dialog.showModal()
    } else if (!selectedContact && dialog.open) {
      dialog.close()
    }
  }, [selectedContact])

  const contactGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = pemesanList.filter((p) => {
      if (!q) return true
      return (
        p.nama_jastiper.toLowerCase().includes(q) ||
        p.no_wa.includes(q) ||
        (p.alamat && p.alamat.toLowerCase().includes(q))
      )
    })

    const sorted = [...filtered].sort((a, b) =>
      a.nama_jastiper.localeCompare(b.nama_jastiper, 'id')
    )

    const map = new Map<string, Pemesan[]>()
    for (const item of sorted) {
      const letter = item.nama_jastiper.trim().charAt(0).toUpperCase() || '#'
      const list = map.get(letter) ?? []
      list.push(item)
      map.set(letter, list)
    }
    return Array.from(map.entries())
  }, [pemesanList, search])

  function handleOpenAdd() {
    setEditingPemesan(null)
    setFormOpen(true)
  }

  function handleOpenEdit(item: Pemesan) {
    setSelectedContact(null)
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
    <div className="space-y-4">
      <StickyToolbar
        eyebrow="Buku Kontak"
        title="Kontak Jastiper"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama, nomor WA, atau alamat..."
        actionLabel="Tambah"
        actionIcon="solar:user-plus-bold"
        onActionClick={handleOpenAdd}
      />

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

      {/* Tampilan Buku Kontak (Grouped A-Z) */}
      {contactGroups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50">
          <p className="font-bold text-sm text-[#636E72]">
            {search ? 'Kontak tidak ditemukan.' : 'Belum ada kontak jastiper tersimpan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contactGroups.map(([letter, contacts]) => (
            <section key={letter} className="space-y-1.5">
              <h2 className="px-3 text-xs font-black uppercase tracking-[0.15em] text-[#FF6B6B]">
                {letter}
              </h2>
              <div className="bg-white rounded-[1.75rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50 divide-y divide-[#FAF5EB] overflow-hidden">
                {contacts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedContact(item)}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAF5EB]/60 active:bg-[#FAF5EB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] font-black text-sm flex items-center justify-center shrink-0">
                        {item.nama_jastiper.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-[#2D3436] truncate">
                          {item.nama_jastiper}
                        </p>
                        <p className="text-xs font-bold text-[#636E72] truncate">
                          +{item.no_wa}
                        </p>
                      </div>
                    </div>
                    <Icon
                      icon="solar:alt-arrow-right-bold"
                      width={18}
                      height={18}
                      className="text-[#636E72]/60 shrink-0"
                    />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal Detail Kartu Jastiper */}
      {selectedContact && (
        <dialog
          ref={detailDialogRef}
          onCancel={(e) => {
            e.preventDefault()
            setSelectedContact(null)
          }}
          onClick={(e) => {
            if (e.target === detailDialogRef.current) setSelectedContact(null)
          }}
          className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFE66D]/50 text-[#2D3436] font-black text-2xl flex items-center justify-center mb-3">
              {selectedContact.nama_jastiper.trim().charAt(0).toUpperCase()}
            </div>
            <h2 className="font-black text-xl text-[#2D3436]">
              {selectedContact.nama_jastiper}
            </h2>
            <p className="text-sm font-bold text-[#4ECDC4] mt-0.5">
              +{selectedContact.no_wa}
            </p>

            <div className="w-full bg-[#FAF5EB] rounded-2xl p-4 mt-4 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#636E72] mb-1">
                Alamat Pengiriman
              </p>
              <p className="text-xs font-bold text-[#2D3436] leading-relaxed">
                {selectedContact.alamat || 'Alamat belum diisi.'}
              </p>
            </div>

            <div className="flex gap-2 w-full mt-5">
              <a
                href={buildWaLink(
                  selectedContact.no_wa,
                  `Halo Kak ${selectedContact.nama_jastiper}, ini dari admin Jastip by Jejun!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Icon icon="solar:chat-round-line-bold" width={18} height={18} />
                Chat WA
              </a>
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedContact)}
                className="w-11 h-11 rounded-full bg-[#FAF5EB] text-[#4ECDC4] hover:bg-[#4ECDC4]/15 flex items-center justify-center cursor-pointer"
                aria-label="Edit kontak"
              >
                <Icon icon="solar:pen-bold" width={18} height={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedContact
                  setSelectedContact(null)
                  setDeletingPemesan(target)
                }}
                className="w-11 h-11 rounded-full bg-[#FAF5EB] text-[#FF6B6B] hover:bg-[#FF6B6B]/15 flex items-center justify-center cursor-pointer"
                aria-label="Hapus kontak"
              >
                <Icon icon="solar:trash-bin-trash-bold" width={18} height={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedContact(null)}
              className="mt-3 text-xs font-bold text-[#636E72] hover:text-[#2D3436] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </dialog>
      )}

      <PemesanFormModal
        isOpen={formOpen}
        initialData={editingPemesan}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

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