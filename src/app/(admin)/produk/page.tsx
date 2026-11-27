import { createClient } from '@/lib/supabase/server'
import { ProdukClient } from '@/components/produk/ProdukClient'
import type { Produk } from '@/types/database'

export default async function ProdukPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('produk')
    .select('*')
    .order('created_at', { ascending: false })

  return <ProdukClient initialProduk={(data ?? []) as Produk[]} />
}