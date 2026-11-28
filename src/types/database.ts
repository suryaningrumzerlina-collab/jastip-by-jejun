export type StatusBatch = 'aktif' | 'selesai'
export type StatusJastip = 'tercatat' | 'dapat_barang' | 'terkonfirmasi' | 'kosong_batal'
export type StatusPembayaran = 'belum_lunas' | 'dp' | 'lunas'
export type StatusPengiriman = 'pengemasan' | 'dalam_pengiriman' | 'selesai'
export type KategoriFee = 'harga' | 'extra_tipe'

export interface VarianProduk {
  nama: string
  harga: number
}

export interface Batch {
  id: string
  nama_batch: string
  tanggal_tutup: string | null
  status: StatusBatch
  created_at: string
}

export interface AturanFee {
  id: string
  id_batch: string
  kategori: KategoriFee
  label: string
  min_harga: number
  max_harga: number | null
  tipe_barang: string | null
  nominal_fee: number
  created_at: string
}

export interface Pemesan {
  id: string
  nama_jastiper: string
  no_wa: string
  alamat: string | null
  created_at: string
}

export interface Produk {
  id: string
  nama_barang: string
  brand: string | null
  deskripsi: string | null
  harga_dasar: number
  varian: VarianProduk[]
  tipe_barang: string
  id_batch: string | null
  created_at: string
}

export interface InvoicePengiriman {
  id: string
  nomor_invoice: string
  id_batch: string | null
  id_pemesan: string
  harga_bundle: number
  total_fee: number
  jasa_pengiriman: string | null
  ongkir: number
  harga_total: number
  nominal_dp: number
  status_pembayaran: StatusPembayaran
  jatuh_tempo: string | null
  resi: string | null
  status_pengiriman: StatusPengiriman
  created_at: string
}

export interface Pesanan {
  id: string
  id_batch: string | null
  id_pemesan: string
  id_produk: string
  id_pengiriman: string | null
  varian_dipilih: string | null
  qty: number
  harga_satuan: number
  harga_total: number
  fee_satuan: number
  fee_total: number
  status_jastip: StatusJastip
  catatan: string | null
  order_time: string
}

export interface PesananWithRelations extends Pesanan {
  pemesan: Pick<Pemesan, 'id' | 'nama_jastiper' | 'no_wa'> | null
  produk: Pick<Produk, 'id' | 'nama_barang' | 'brand' | 'tipe_barang'> | null
  batch: Pick<Batch, 'id' | 'nama_batch'> | null
}

export interface InvoiceWithRelations extends InvoicePengiriman {
  pemesan: Pick<Pemesan, 'id' | 'nama_jastiper' | 'no_wa' | 'alamat'> | null
  pesanan?: (Pick<
    Pesanan,
    'id' | 'varian_dipilih' | 'qty' | 'harga_satuan' | 'harga_total' | 'fee_satuan' | 'fee_total'
  > & {
    produk: Pick<Produk, 'nama_barang' | 'brand' | 'tipe_barang'> | null
  })[]
}