'use client'

import { FeeClient } from '@/components/fee/FeeClient'
import { useAturanFee, useBatch } from '@/hooks/useJastipData'
import AdminLoading from '../loading'

export default function FeePage() {
  const { data: rules, isLoading: l1 } = useAturanFee()
  const { data: batch, isLoading: l2 } = useBatch()

  if ((l1 && !rules) || (l2 && !batch)) {
    return <AdminLoading />
  }

  return <FeeClient initialRules={rules ?? []} batchList={batch ?? []} />
}