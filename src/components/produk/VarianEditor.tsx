'use client'

import { Icon } from '@iconify/react'
import type { VarianProduk } from '@/types/database'

interface VarianEditorProps {
  value: VarianProduk[]
  defaultHarga: number
  onChange: (next: VarianProduk[]) => void
}

export function VarianEditor({ value, defaultHarga, onChange }: VarianEditorProps) {
  function handleAdd() {
    onChange([...value, { nama: '', harga: defaultHarga || 0 }])
  }

  function handleUpdate(index: number, field: keyof VarianProduk, raw: string) {
    const updated = value.map((item, i) => {
      if (i !== index) return item
      if (field === 'harga') {
        const numeric = parseInt(raw.replace(/\D/g, ''), 10)
        return { ...item, harga: Number.isNaN(numeric) ? 0 : numeric }
      }
      return { ...item, nama: raw }
    })
    onChange(updated)
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72] pl-2">
          Daftar Varian (Opsional)
        </span>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#4ECDC4] hover:text-[#3ab7ae] cursor-pointer px-2 py-1 rounded-full hover:bg-[#4ECDC4]/10 transition-colors"
        >
          <Icon icon="solar:add-circle-bold" width={18} height={18} />
          Tambah Varian
        </button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl bg-[#FAF5EB]/70 border border-dashed border-[#EBDCC7] p-4 text-center">
          <p className="text-xs font-bold text-[#636E72]">
            Belum ada varian. Produk akan memakai harga dasar.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {value.map((varian, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-[#FAF5EB]/60 p-2 rounded-2xl border border-[#EBDCC7]/80"
            >
              <input
                type="text"
                required
                value={varian.nama}
                onChange={(e) => handleUpdate(idx, 'nama', e.target.value)}
                placeholder="Cth: Size M - Pink"
                aria-label={`Nama varian ${idx + 1}`}
                className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white border border-[#EBDCC7] text-xs font-bold text-[#2D3436] placeholder:text-[#636E72]/50"
              />
              <div className="relative w-28 sm:w-32 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#636E72]">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={varian.harga === 0 ? '' : varian.harga.toString()}
                  onChange={(e) => handleUpdate(idx, 'harga', e.target.value)}
                  placeholder="0"
                  aria-label={`Harga varian ${idx + 1}`}
                  className="w-full h-10 pl-8 pr-2.5 rounded-xl bg-white border border-[#EBDCC7] text-xs font-bold text-[#2D3436] text-right"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`Hapus varian ${idx + 1}`}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors cursor-pointer"
              >
                <Icon icon="solar:trash-bin-minimalistic-bold" width={18} height={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}