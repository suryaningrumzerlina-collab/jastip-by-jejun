import { createClient } from '@/lib/supabase/server'
import { BelanjaClient } from '@/components/belanja/BelanjaClient'
import type { Batch, PesananWithRelations } from '@/types/database'

export default async function BelanjaPage() {
  const supabase = await createClient()

  const [pesananRes, batchRes] = await Promise.all([
    supabase
      .from('pesanan')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
        produk:id_produk ( id, nama_barang, brand ),
        batch:id_batch ( id, nama_batch )
      `)
      .eq('status_jastip', 'tercatat')
      .order('order_time', { ascending: true }),
    supabase.from('batch').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <BelanjaClient
      initialPesanan={(pesananRes.data ?? []) as unknown as PesananWithRelations[]}
      batchList={(batchRes.data ?? []) as Batch[]}
    />
  )
}