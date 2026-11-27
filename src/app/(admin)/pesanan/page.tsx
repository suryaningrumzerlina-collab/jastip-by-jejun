import { createClient } from '@/lib/supabase/server'
import { PesananClient } from '@/components/pesanan/PesananClient'
import type { Batch, Pemesan, PesananWithRelations, Produk } from '@/types/database'

export default async function PesananPage() {
  const supabase = await createClient()

  const [pesananRes, batchRes, pemesanRes, produkRes] = await Promise.all([
    supabase
      .from('pesanan')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
        produk:id_produk ( id, nama_barang, brand ),
        batch:id_batch ( id, nama_batch )
      `)
      .order('order_time', { ascending: false }),
    supabase.from('batch').select('*').order('created_at', { ascending: false }),
    supabase.from('pemesan').select('*').order('nama_jastiper', { ascending: true }),
    supabase.from('produk').select('*').order('nama_barang', { ascending: true }),
  ])

  return (
    <PesananClient
      initialPesanan={(pesananRes.data ?? []) as unknown as PesananWithRelations[]}
      batchList={(batchRes.data ?? []) as Batch[]}
      pemesanList={(pemesanRes.data ?? []) as Pemesan[]}
      produkList={(produkRes.data ?? []) as Produk[]}
    />
  )
}