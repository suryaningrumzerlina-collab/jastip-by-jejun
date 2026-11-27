'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import type { Batch, StatusBatch } from '@/types/database'

interface BatchFormModalProps {
  isOpen: boolean
  initialData: Batch | null
  onClose: () => void
  onSaved: (saved: Batch, isEdit: boolean) => void
}

export function BatchFormModal({
  isOpen,
  initialData,
  onClose,
  onSaved,
}: BatchFormModalProps) {
  const supabase = createClient()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const namaId = useId()
  const tanggalId = useId()
  const statusId = useId()

  const [namaBatch, setNamaBatch] = useState('')
  const [tanggalTutup, setTanggalTutup] = useState('')
  const [status, setStatus] = useState<StatusBatch>('aktif')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNamaBatch(initialData?.nama_batch ?? '')
      setTanggalTutup(initialData?.tanggal_tutup ?? '')
      setStatus(initialData?.status ?? 'aktif')
      setErrorMsg(null)
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setIsSaving(true)

    const payload = {
      nama_batch: namaBatch.trim(),
      tanggal_tutup: tanggalTutup || null,
      status,
    }

    try {
      if (initialData) {
        const { data, error } = await supabase
          .from('batch')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Batch, true)
      } else {
        const { data, error } = await supabase
          .from('batch')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Batch, false)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan batch.'
      setErrorMsg(msg)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        if (!isSaving) onClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isSaving) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-xl text-[#2D3436]">
          {initialData ? 'Edit Batch PO' : 'Buat Batch PO Baru'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Tutup modal"
          className="w-9 h-9 rounded-full bg-[#FAF5EB] text-[#636E72] hover:text-[#FF6B6B] flex items-center justify-center cursor-pointer"
        >
          <Icon icon="solar:close-circle-bold" width={22} height={22} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] rounded-2xl px-4 py-3 text-xs font-bold"
          >
            {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor={namaId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Nama Batch / Trip *
          </label>
          <input
            id={namaId}
            type="text"
            required
            value={namaBatch}
            onChange={(e) => setNamaBatch(e.target.value)}
            placeholder="Cth: PO Jepang Desember 2026"
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor={tanggalId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Tanggal Tutup
            </label>
            <input
              id={tanggalId}
              type="date"
              value={tanggalTutup}
              onChange={(e) => setTanggalTutup(e.target.value)}
              className="w-full h-11 px-3 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-xs font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={statusId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Status
            </label>
            <select
              id={statusId}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusBatch)}
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
            >
              <option value="aktif">Aktif</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="flex-1 h-12 rounded-full bg-white border border-[#EBDCC7] text-[#2D3436] font-bold text-sm hover:bg-[#FAF5EB] cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 h-12 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
            ) : (
              'Simpan Batch'
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}