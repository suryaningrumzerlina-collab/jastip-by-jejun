import { createClient } from '@/lib/supabase/server'
import { InvoiceClient } from '@/components/invoice/InvoiceClient'
import type {
  InvoiceWithRelations,
  Pemesan,
  PesananWithRelations,
} from '@/types/database'

export default async function InvoicePage() {
  const supabase = await createClient()

  const [invRes, unbilledRes, pemesanRes] = await Promise.all([
    supabase
      .from('invoice_pengiriman')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa, alamat )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('pesanan')
      .select(`
        *,
        pemesan:id_pemesan ( id, nama_jastiper, no_wa ),
        produk:id_produk ( id, nama_barang, brand ),
        batch:id_batch ( id, nama_batch )
      `)
      .eq('status_jastip', 'terkonfirmasi')
      .is('id_pengiriman', null)
      .order('order_time', { ascending: true }),
    supabase.from('pemesan').select('*').order('nama_jastiper', { ascending: true }),
  ])

  return (
    <InvoiceClient
      initialInvoices={(invRes.data ?? []) as unknown as InvoiceWithRelations[]}
      initialUnbilled={(unbilledRes.data ?? []) as unknown as PesananWithRelations[]}
      pemesanList={(pemesanRes.data ?? []) as Pemesan[]}
    />
  )
}