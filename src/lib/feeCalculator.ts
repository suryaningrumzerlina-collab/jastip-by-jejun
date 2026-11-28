import type { AturanFee } from '@/types/database'

export const DEFAULT_TIPE_BARANG = [
  'Reguler',
  'Electronic',
  'Bulky Matras',
  'Bulky Besar',
] as const

export interface FeeBreakdown {
  baseFee: number
  extraFee: number
  totalFeeSatuan: number
}

export function hitungFeeSatuan(
  hargaSatuan: number,
  tipeBarang: string | null | undefined,
  idBatch: string | null | undefined,
  aturanList: AturanFee[]
): FeeBreakdown {
  if (!idBatch || hargaSatuan < 0) {
    return { baseFee: 0, extraFee: 0, totalFeeSatuan: 0 }
  }

  const batchRules = aturanList.filter((r) => r.id_batch === idBatch)

  // 1. Cari base fee berdasarkan rentang harga (diurutkan dari min_harga terkecil)
  const priceRules = batchRules
    .filter((r) => r.kategori === 'harga')
    .sort((a, b) => a.min_harga - b.min_harga)

  let baseFee = 0
  for (const rule of priceRules) {
    if (rule.max_harga === null || hargaSatuan <= rule.max_harga) {
      baseFee = rule.nominal_fee
      break
    }
  }

  // 2. Cari extra fee berdasarkan tipe barang (case-insensitive)
  let extraFee = 0
  const normalizedTipe = (tipeBarang ?? '').trim().toLowerCase()
  if (normalizedTipe && normalizedTipe !== 'reguler') {
    const matchedExtra = batchRules.find(
      (r) =>
        r.kategori === 'extra_tipe' &&
        (r.tipe_barang ?? '').trim().toLowerCase() === normalizedTipe
    )
    if (matchedExtra) {
      extraFee = matchedExtra.nominal_fee
    }
  }

  return {
    baseFee,
    extraFee,
    totalFeeSatuan: baseFee + extraFee,
  }
}