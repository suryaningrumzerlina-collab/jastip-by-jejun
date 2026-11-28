'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_TIPE_BARANG } from '@/lib/feeCalculator'
import type { AturanFee, Batch, KategoriFee } from '@/types/database'

interface FeeFormModalProps {
  isOpen: boolean
  initialData: AturanFee | null
  defaultBatchId: string
  batchList: Batch[]
  onClose: () => void
  onSaved: (saved: AturanFee, isEdit: boolean) => void
}

export function FeeFormModal({
  isOpen,
  initialData,
  defaultBatchId,
  batchList,
  onClose,
  onSaved,
}: FeeFormModalProps) {
  const supabase = createClient()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const batchId = useId()
  const kategoriId = useId()
  const labelId = useId()
  const minId = useId()
  const maxId = useId()
  const tipeId = useId()
  const tipeListId = useId()
  const nominalId = useId()

  const [idBatch, setIdBatch] = useState('')
  const [kategori, setKategori] = useState<KategoriFee>('harga')
  const [label, setLabel] = useState('')
  const [minHarga, setMinHarga] = useState('0')
  const [maxHarga, setMaxHarga] = useState('')
  const [tipeBarang, setTipeBarang] = useState('')
  const [nominalFee, setNominalFee] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIdBatch(initialData?.id_batch ?? defaultBatchId ?? batchList[0]?.id ?? '')
      setKategori(initialData?.kategori ?? 'harga')
      setLabel(initialData?.label ?? '')
      setMinHarga(initialData ? String(initialData.min_harga) : '0')
      setMaxHarga(
        initialData?.max_harga !== null && initialData?.max_harga !== undefined
          ? String(initialData.max_harga)
          : ''
      )
      setTipeBarang(initialData?.tipe_barang ?? '')
      setNominalFee(initialData ? String(initialData.nominal_fee) : '')
      setErrorMsg(null)
    }
  }, [isOpen, initialData, defaultBatchId, batchList])

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

    if (!idBatch) {
      setErrorMsg('Pilih Batch / Event terlebih dahulu.')
      return
    }

    const parsedMin = parseInt(minHarga.replace(/\D/g, ''), 10) || 0
    const parsedMax = maxHarga.trim()
      ? parseInt(maxHarga.replace(/\D/g, ''), 10)
      : null
    const parsedNominal = parseInt(nominalFee.replace(/\D/g, ''), 10) || 0

    if (kategori === 'harga' && parsedMax !== null && parsedMax < parsedMin) {
      setErrorMsg('Harga maksimal tidak boleh lebih kecil dari harga minimal.')
      return
    }

    const payload = {
      id_batch: idBatch,
      kategori,
      label: label.trim(),
      min_harga: kategori === 'harga' ? parsedMin : 0,
      max_harga: kategori === 'harga' ? parsedMax : null,
      tipe_barang: kategori === 'extra_tipe' ? tipeBarang.trim() || null : null,
      nominal_fee: parsedNominal,
    }

    setIsSaving(true)
    try {
      if (initialData) {
        const { data, error } = await supabase
          .from('aturan_fee')
          .update(payload)
          .eq('id', initialData.id)
          .select()
          .single()

        if (error) throw error
        onSaved(data as AturanFee, true)
      } else {
        const { data, error } = await supabase
          .from('aturan_fee')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        onSaved(data as AturanFee, false)
      }
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan aturan fee.')
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
          {initialData ? 'Edit Aturan Fee' : 'Tambah Aturan Fee'}
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
            htmlFor={batchId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Batch / Event *
          </label>
          <select
            id={batchId}
            required
            value={idBatch}
            onChange={(e) => setIdBatch(e.target.value)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          >
            {batchList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama_batch}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={kategoriId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Kategori Fee *
          </label>
          <select
            id={kategoriId}
            value={kategori}
            onChange={(e) => setKategori(e.target.value as KategoriFee)}
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          >
            <option value="harga">Rentang Harga (Base Fee)</option>
            <option value="extra_tipe">Extra Fee Tipe Barang</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={labelId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Label Aturan *
          </label>
          <input
            id={labelId}
            type="text"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={
              kategori === 'harga'
                ? 'Cth: 101.000 - 200.000'
                : 'Cth: Electronic (any electronic)'
            }
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436] focus:bg-white focus:border-[#4ECDC4]"
          />
        </div>

        {kategori === 'harga' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor={minId}
                className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
              >
                Min Harga (Rp) *
              </label>
              <input
                id={minId}
                type="text"
                inputMode="numeric"
                required
                value={minHarga}
                onChange={(e) => setMinHarga(e.target.value.replace(/\D/g, ''))}
                className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={maxId}
                className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
              >
                Max Harga (Opsional)
              </label>
              <input
                id={maxId}
                type="text"
                inputMode="numeric"
                value={maxHarga}
                onChange={(e) => setMaxHarga(e.target.value.replace(/\D/g, ''))}
                placeholder="Kosong = ke atas"
                className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label
              htmlFor={tipeId}
              className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
            >
              Tipe Barang *
            </label>
            <input
              id={tipeId}
              list={tipeListId}
              type="text"
              required
              value={tipeBarang}
              onChange={(e) => setTipeBarang(e.target.value)}
              placeholder="Cth: Electronic / Bulky Matras"
              className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
            />
            <datalist id={tipeListId}>
              {DEFAULT_TIPE_BARANG.filter((t) => t !== 'Reguler').map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor={nominalId}
            className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2"
          >
            Nominal Fee per Item (Rp) *
          </label>
          <input
            id={nominalId}
            type="text"
            inputMode="numeric"
            required
            value={nominalFee}
            onChange={(e) => setNominalFee(e.target.value.replace(/\D/g, ''))}
            placeholder="15000"
            className="w-full h-11 px-4 rounded-full bg-[#FAF5EB]/60 border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
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
              <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
            ) : (
              'Simpan Aturan'
            )}
          </button>
        </div>
      </form>
    </dialog>
  )
}