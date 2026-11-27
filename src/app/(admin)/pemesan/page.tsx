import { createClient } from '@/lib/supabase/server'
import { PemesanClient } from '@/components/pemesan/PemesanClient'
import type { Pemesan } from '@/types/database'

export default async function PemesanPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pemesan')
    .select('*')
    .order('created_at', { ascending: false })

  return <PemesanClient initialPemesan={(data ?? []) as Pemesan[]} />
}