'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import type { Pemesan } from '@/types/database'

interface PemesanFormModalProps {
  isOpen: boolean
  initialData: Pemesan | null
  onClose: () => void
  onSaved: (saved: Pemesan, isEdit: boolean) => void
}

function normalizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`
  }
  return digits
}

export function PemesanFormModal({
  isOpen,
  initialData,
  onClose,
  onSaved,
}: PemesanFormModalProps) {
  const supabase = createClient()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const namaId = useId()
  const waId = useId()
  const alamatId = useId()

  const [namaJastiper, setNamaJastiper] = useState('')
  const [noWa, setNoWa] = useState('')
  const [alamat, setAlamat] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNamaJastiper(initialData?.nama_jastiper ?? '')
      setNoWa(initialData?.no_wa ?? '')
      setAlamat(initialData?.alamat ?? '')
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

    const formattedWa = normalizeWaNumber(noWa)
    if (formattedWa.length < 9) {
      setErrorMsg('Nomor WhatsApp tidak valid. Masukkan minimal 9 digit angka.')
      return
    }

    const payload = {
      nama_jastiper: namaJastiper.trim(),
      no_wa: formattedWa,
      alamat: alamat.trim() || null,
    }

    setIsSaving(true)
    try {
      if (initialData) {
        const { data, error } = await supabase
          .from('pemesan')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Pemesan, true)
      } else {
        const { data, error } = await supabase
          .from('pemesan')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        onSaved(data as Pemesan, false)
      }
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kontak.'
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
      className="m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-xl text-[#2D3436]">
          {initialData ? 'Edit Kontak Jastiper' : 'Tambah Jastiper Baru'}
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
            Nama Lengkap *
          </label>
          <input
            id={namaId}
            type="text"
            autoComplete="name"
            required
            value={namaJastiper}
            onChange={(e) => setNamaJastiper(e.target.value)}
            placeholder="Cth: Mama Kinara"
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={waId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Nomor WhatsApp *
          </label>
          <input
            id={waId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="081234567890 atau 62812..."
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          />
          <p className="text-[11px] font-bold text-[#636E72]/80 pl-2">
            Awalan 0 otomatis diubah ke 62 saat disimpan.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={alamatId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Alamat Pengiriman
          </label>
          <textarea
            id={alamatId}
            rows={3}
            autoComplete="street-address"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Alamat lengkap beserta kecamatan & kode pos..."
            className="w-full p-4 rounded-2xl bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4] resize-none"
          />
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
              <>
                <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-bold" width={18} height={18} />
                Simpan Kontak
              </>
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}