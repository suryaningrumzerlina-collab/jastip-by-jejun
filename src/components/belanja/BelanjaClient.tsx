'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils'
import { StickyToolbar } from '@/components/ui/StickyToolbar'
import type { Batch, PesananWithRelations, StatusJastip } from '@/types/database'

interface BelanjaClientProps {
  initialPesanan: PesananWithRelations[]
  batchList: Batch[]
}

interface ShoppingGroup {
  key: string
  namaBarang: string
  brand: string | null
  varian: string | null
  totalQty: number
  items: PesananWithRelations[]
}

interface LastAction {
  items: PesananWithRelations[]
  newStatus: StatusJastip
  label: string
}

export function BelanjaClient({ initialPesanan, batchList }: BelanjaClientProps) {
  const supabase = createClient()

  const defaultBatchId = useMemo(
    () => batchList.find((b) => b.status === 'aktif')?.id ?? 'semua',
    [batchList]
  )

  const [pesananList, setPesananList] = useState<PesananWithRelations[]>(initialPesanan)
  const [selectedBatch, setSelectedBatch] = useState<string>(defaultBatchId)
  const [search, setSearch] = useState('')
  const [groupByBrand, setGroupByBrand] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<LastAction | null>(null)

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pesananList.filter((item) => {
      const matchBatch = selectedBatch === 'semua' || item.id_batch === selectedBatch
      if (!matchBatch) return false
      if (!q) return true
      return (
        (item.produk?.nama_barang ?? '').toLowerCase().includes(q) ||
        (item.produk?.brand ?? '').toLowerCase().includes(q) ||
        (item.varian_dipilih ?? '').toLowerCase().includes(q) ||
        (item.pemesan?.nama_jastiper ?? '').toLowerCase().includes(q)
      )
    })
  }, [pesananList, selectedBatch, search])

  const groups = useMemo<ShoppingGroup[]>(() => {
    const map = new Map<string, ShoppingGroup>()

    for (const item of filteredItems) {
      const key = `${item.id_produk}__${item.varian_dipilih ?? ''}`
      const existing = map.get(key)
      if (existing) {
        existing.totalQty += item.qty
        existing.items.push(item)
      } else {
        map.set(key, {
          key,
          namaBarang: item.produk?.nama_barang ?? 'Produk',
          brand: item.produk?.brand ?? null,
          varian: item.varian_dipilih ?? null,
          totalQty: item.qty,
          items: [item],
        })
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.namaBarang.localeCompare(b.namaBarang, 'id')
    )
  }, [filteredItems])

  const brandFolders = useMemo(() => {
    const map = new Map<string, { totalQty: number; groups: ShoppingGroup[] }>()
    for (const g of groups) {
      const brandName = g.brand?.trim() || 'Tanpa Brand'
      const entry = map.get(brandName)
      if (entry) {
        entry.totalQty += g.totalQty
        entry.groups.push(g)
      } else {
        map.set(brandName, { totalQty: g.totalQty, groups: [g] })
      }
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'id'))
  }, [groups])

  const totalPcsToBuy = useMemo(
    () => filteredItems.reduce((sum, item) => sum + item.qty, 0),
    [filteredItems]
  )

  async function updateItemsStatus(
    items: PesananWithRelations[],
    nextStatus: StatusJastip,
    actionKey: string,
    label: string
  ) {
    setBusyKey(actionKey)
    try {
      const ids = items.map((i) => i.id)
      const { error } = await supabase
        .from('pesanan')
        .update({ status_jastip: nextStatus })
        .in('id', ids)

      if (!error) {
        setPesananList((prev) => prev.filter((p) => !ids.includes(p.id)))
        setLastAction({ items, newStatus: nextStatus, label })
      }
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUndo() {
    if (!lastAction) return
    setBusyKey('undo')
    try {
      const ids = lastAction.items.map((i) => i.id)
      const { error } = await supabase
        .from('pesanan')
        .update({ status_jastip: 'tercatat' })
        .in('id', ids)

      if (!error) {
        setPesananList((prev) => [...lastAction.items, ...prev])
        setLastAction(null)
      }
    } finally {
      setBusyKey(null)
    }
  }

  function renderShoppingGroup(group: ShoppingGroup) {
    const isGroupBusy = busyKey === group.key
    return (
      <details
        key={group.key}
        open
        className="group bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-[#EBDCC7]/50 overflow-hidden"
      >
        <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-3 select-none">
          <div className="min-w-0">
            {!groupByBrand && group.brand && (
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.12em] text-[#4ECDC4] mb-0.5">
                {group.brand}
              </span>
            )}
            <h2 className="font-black text-lg text-[#2D3436] leading-snug">
              {group.namaBarang}
            </h2>
            {group.varian && (
              <span className="inline-block mt-1 bg-[#FAF5EB] border border-[#EBDCC7] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#636E72]">
                {group.varian}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-[#FF6B6B] text-white font-black px-3.5 py-1.5 rounded-full text-sm border-2 border-white shadow-sm">
              {group.totalQty} pcs
            </div>
            <Icon
              icon="solar:alt-arrow-down-bold"
              width={20}
              height={20}
              className="text-[#636E72] transition-transform group-open:rotate-180"
            />
          </div>
        </summary>

        <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#EBDCC7]/40">
          {group.items.map((item) => {
            const isItemBusy = busyKey === item.id || isGroupBusy
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 bg-[#FAF5EB]/70 rounded-2xl p-3.5"
              >
                <div className="min-w-0">
                  <p className="font-black text-sm text-[#2D3436] truncate">
                    {item.pemesan?.nama_jastiper ?? 'Tanpa Nama'}{' '}
                    <span className="text-[#FF6B6B]">(&times;{item.qty})</span>
                  </p>
                  <p className="text-xs font-bold text-[#636E72]">
                    {formatRupiah(item.harga_total)}
                  </p>
                  {item.catatan && (
                    <p className="text-[11px] font-bold text-[#636E72] mt-1 italic">
                      &ldquo;{item.catatan}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isItemBusy}
                    onClick={() =>
                      updateItemsStatus(
                        [item],
                        'kosong_batal',
                        item.id,
                        `${group.namaBarang} (${item.pemesan?.nama_jastiper}) ditandai kosong`
                      )
                    }
                    className="h-9 px-3 rounded-full bg-white border border-[#EBDCC7] text-[#FF6B6B] hover:bg-[#FF6B6B]/10 font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    Kosong
                  </button>
                  <button
                    type="button"
                    disabled={isItemBusy}
                    onClick={() =>
                      updateItemsStatus(
                        [item],
                        'dapat_barang',
                        item.id,
                        `${group.namaBarang} (${item.pemesan?.nama_jastiper}) sudah didapat`
                      )
                    }
                    className="h-9 px-3.5 rounded-full bg-[#4ECDC4] hover:bg-[#3dbdb4] text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Icon icon="solar:check-circle-bold" width={16} height={16} />
                    Dapat
                  </button>
                </div>
              </div>
            )
          })}

          {group.items.length > 1 && (
            <button
              type="button"
              disabled={isGroupBusy}
              onClick={() =>
                updateItemsStatus(
                  group.items,
                  'dapat_barang',
                  group.key,
                  `Semua ${group.namaBarang} (${group.totalQty} pcs) sudah didapat`
                )
              }
              className="w-full h-11 rounded-full bg-[#FFE66D] hover:bg-[#ffd93d] text-[#2D3436] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Icon icon="solar:check-read-bold" width={18} height={18} />
              <span>Tandai Semua Dapat ({group.totalQty} pcs)</span>
            </button>
          )}
        </div>
      </details>
    )
  }

  return (
    <div className="space-y-4">
      <StickyToolbar
        eyebrow="Mode Lapangan"
        title="Daftar Belanja"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari barang, brand, atau pemesan..."
        headerRightSlot={
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#EBDCC7] text-right shrink-0">
            <span className="font-black text-lg text-[#FF6B6B]">{totalPcsToBuy}</span>
            <span className="text-xs font-bold text-[#636E72] ml-1">pcs</span>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-2">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            aria-label="Filter Batch PO"
            className="flex-1 min-w-0 h-9 px-3.5 rounded-full bg-white border border-[#EBDCC7]/70 text-xs font-bold text-[#2D3436] focus:border-[#4ECDC4]"
          >
            <option value="semua">Semua Batch PO</option>
            {batchList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nama_batch} {b.status === 'aktif' ? '(Aktif)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setGroupByBrand((prev) => !prev)}
            aria-pressed={groupByBrand}
            className={`shrink-0 h-9 px-3.5 rounded-full border border-[#EBDCC7] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              groupByBrand
                ? 'bg-white text-[#FF6B6B] shadow-sm'
                : 'bg-white/75 text-[#636E72] hover:bg-white'
            }`}
          >
            <Icon icon="solar:folder-with-files-bold" width={16} height={16} />
            <span>Folder Brand</span>
          </button>
        </div>
      </StickyToolbar>

      {/* Banner Undo */}
      {lastAction && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#4ECDC4]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon
              icon={
                lastAction.newStatus === 'dapat_barang'
                  ? 'solar:check-circle-bold'
                  : 'solar:close-circle-bold'
              }
              width={20}
              height={20}
              className={
                lastAction.newStatus === 'dapat_barang'
                  ? 'text-[#4ECDC4] shrink-0'
                  : 'text-[#FF6B6B] shrink-0'
              }
            />
            <span className="text-xs font-bold text-[#2D3436] truncate">
              {lastAction.label}
            </span>
          </div>
          <button
            type="button"
            disabled={busyKey === 'undo'}
            onClick={handleUndo}
            className="shrink-0 text-xs font-black uppercase tracking-wider text-[#FF6B6B] hover:underline cursor-pointer disabled:opacity-50"
          >
            Batal (Undo)
          </button>
        </div>
      )}

      {/* Daftar Belanja */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBDCC7]/50 space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] flex items-center justify-center">
            <Icon icon="solar:check-read-bold" width={30} height={30} />
          </div>
          <h2 className="font-black text-lg text-[#2D3436]">Semua Beres!</h2>
          <p className="font-bold text-sm text-[#636E72]">
            Tidak ada barang berstatus &ldquo;Tercatat&rdquo; yang perlu dibeli saat ini.
          </p>
        </div>
      ) : groupByBrand ? (
        <div className="space-y-3">
          {brandFolders.map(([brandName, folder]) => (
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
                      {folder.groups.length} item &bull; {folder.totalQty} pcs
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
              <div className="p-3 space-y-3">
                {folder.groups.map(renderShoppingGroup)}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-3">{groups.map(renderShoppingGroup)}</div>
      )}
    </div>
  )
}