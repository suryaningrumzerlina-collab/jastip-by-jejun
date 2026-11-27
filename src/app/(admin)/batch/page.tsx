import { createClient } from '@/lib/supabase/server'
import { BatchClient } from '@/components/batch/BatchClient'
import type { Batch } from '@/types/database'

export default async function BatchPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('batch')
    .select('*')
    .order('created_at', { ascending: false })

  return <BatchClient initialBatch={(data ?? []) as Batch[]} />
}