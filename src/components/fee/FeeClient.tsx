'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { useActiveBatch } from '@/components/providers/ActiveBatchProvider'
import { FeeFormModal } from './FeeFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { AturanFee, Batch } from '@/types/database'

interface FeeClientProps {
  initialRules: AturanFee[]
  batchList: Batch[]
}

export function FeeClient({ initialRules, batchList }: FeeClientProps) {
  const supabase = createClient()
  const { activeBatchId } = useActiveBatch()

  const defaultBatch =
    activeBatchId !== 'semua'
      ? activeBatchId
      : batchList.find((b) => b.status === 'aktif')?.id ?? batchList[0]?.id ?? ''

  const [rules, setRules] = useState<AturanFee[]>(initialRules)
  const [selectedBatch, setSelectedBatch] = useState<string>(defaultBatch)

  const [formOpen, setFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AturanFee | null>(null)
  const [deletingRule, setDeletingRule] = useState<AturanFee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredRules = useMemo(
    () => rules.filter((r) => r.id_batch === selectedBatch),
    [rules, selectedBatch]
  )

  const hargaRules = useMemo(
    () =>
      filteredRules
        .filter((r) => r.kategori === 'harga')
        .sort((a, b) => a.min_harga - b.min_harga),
    [filteredRules]
  )

  const extraRules = useMemo(
    () => filteredRules.filter((r) => r.kategori === 'extra_tipe'),
    [filteredRules]
  )

  function handleSaved(saved: AturanFee, isEdit: boolean) {
    if (isEdit) {
      setRules((prev) => prev.map((r) => (r.id === saved.id ? saved : r)))
    } else {
      setRules((prev) => [...prev, saved])
    }
    mutate('aturan_fee')
  }

  async function handleConfirmDelete() {
    if (!deletingRule) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('aturan_fee')
        .delete()
        .eq('id', deletingRule.id)

      if (!error) {
        setRules((prev) => prev.filter((r) => r.id !== deletingRule.id))
        mutate('aturan_fee')
      }
    } finally {
      setIsDeleting(false)
      setDeletingRule(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#636E72]">
            Master Biaya Jasa
          </p>
          <h1 className="font-black text-3xl tracking-[-0.02em] text-[#2D3436]">
            Aturan Fee
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingRule(null)
            setFormOpen(true)
          }}
          className="h-12 px-5 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] active:scale-95 text-white font-bold text-[13px] flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Icon icon="solar:add-circle-bold" width={20} height={20} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Pilih Batch/Event */}
      <div className="bg-white rounded-[2rem] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#EBDCC7]/50 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.1em] text-[#636E72] pl-2 shrink-0">
          Event / Batch
        </span>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          aria-label="Pilih batch untuk aturan fee"
          className="flex-1 max-w-xs h-10 px-4 rounded-full bg-[#FAF5EB] border border-[#EBDCC7] text-sm font-bold text-[#2D3436]"
        >
          {batchList.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nama_batch}
            </option>
          ))}
        </select>
      </div>

      {/* Bagian 1: Rentang Harga */}
      <section className="space-y-3">
        <h2 className="font-black text-lg text-[#2D3436] px-1">
          Fee Berdasarkan Rentang Harga
        </h2>
        {hargaRules.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-6 text-center border border-[#EBDCC7]/50">
            <p className="text-xs font-bold text-[#636E72]">
              Belum ada aturan rentang harga untuk event ini.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 divide-y divide-[#FAF5EB] overflow-hidden">
            {hargaRules.map((rule) => (
              <div
                key={rule.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-black text-sm text-[#2D3436]">{rule.label}</p>
                  <p className="text-[11px] font-bold text-[#636E72]">
                    {formatRupiah(rule.min_harga)} &ndash;{' '}
                    {rule.max_harga !== null ? formatRupiah(rule.max_harga) : 'ke atas'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-[#FF6B6B]">
                    {formatRupiah(rule.nominal_fee)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(rule)
                      setFormOpen(true)
                    }}
                    aria-label={`Edit ${rule.label}`}
                    className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#4ECDC4] flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:pen-bold" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingRule(rule)}
                    aria-label={`Hapus ${rule.label}`}
                    className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#FF6B6B] flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bagian 2: Extra Fee Tipe Barang */}
      <section className="space-y-3">
        <h2 className="font-black text-lg text-[#2D3436] px-1">
          Extra Fee per Tipe Barang
        </h2>
        {extraRules.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-6 text-center border border-[#EBDCC7]/50">
            <p className="text-xs font-bold text-[#636E72]">
              Belum ada extra fee tipe barang untuk event ini.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 divide-y divide-[#FAF5EB] overflow-hidden">
            {extraRules.map((rule) => (
              <div
                key={rule.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFE66D] text-[#2D3436] mb-1">
                    {rule.tipe_barang}
                  </span>
                  <p className="font-black text-sm text-[#2D3436]">{rule.label}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-sm text-[#4ECDC4]">
                    +{formatRupiah(rule.nominal_fee)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(rule)
                      setFormOpen(true)
                    }}
                    aria-label={`Edit ${rule.label}`}
                    className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#4ECDC4] flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:pen-bold" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingRule(rule)}
                    aria-label={`Hapus ${rule.label}`}
                    className="w-8 h-8 rounded-full bg-[#FAF5EB] text-[#FF6B6B] flex items-center justify-center cursor-pointer"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <FeeFormModal
        isOpen={formOpen}
        initialData={editingRule}
        defaultBatchId={selectedBatch}
        batchList={batchList}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmModal
        isOpen={Boolean(deletingRule)}
        title="Hapus Aturan Fee?"
        message={`Aturan "${deletingRule?.label ?? ''}" akan dihapus.`}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRule(null)}
      />
    </div>
  )
}