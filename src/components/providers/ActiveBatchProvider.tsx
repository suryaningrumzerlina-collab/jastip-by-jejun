'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useBatch } from '@/hooks/useJastipData'
import type { Batch } from '@/types/database'

interface ActiveBatchContextValue {
  /** 'semua' atau UUID batch */
  activeBatchId: string
  activeBatch: Batch | null
  batchList: Batch[]
  isLoading: boolean
  setActiveBatchId: (id: string) => void
}

const STORAGE_KEY = 'jejun_active_batch_id'

const ActiveBatchContext = createContext<ActiveBatchContextValue | null>(null)

export function ActiveBatchProvider({ children }: { children: React.ReactNode }) {
  const { data: batchList = [], isLoading } = useBatch()
  const [activeBatchId, setActiveBatchIdState] = useState<string>('semua')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (isLoading || initialized) return

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (saved === 'semua' || batchList.some((b) => b.id === saved))) {
      setActiveBatchIdState(saved)
    } else {
      // Default ke batch aktif terbaru jika ada
      const firstActive = batchList.find((b) => b.status === 'aktif')
      setActiveBatchIdState(firstActive?.id ?? 'semua')
    }
    setInitialized(true)
  }, [batchList, isLoading, initialized])

  function setActiveBatchId(id: string) {
    setActiveBatchIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const activeBatch = useMemo(
    () => batchList.find((b) => b.id === activeBatchId) ?? null,
    [batchList, activeBatchId]
  )

  return (
    <ActiveBatchContext.Provider
      value={{
        activeBatchId,
        activeBatch,
        batchList,
        isLoading,
        setActiveBatchId,
      }}
    >
      {children}
    </ActiveBatchContext.Provider>
  )
}

export function useActiveBatch() {
  const ctx = useContext(ActiveBatchContext)
  if (!ctx) {
    throw new Error('useActiveBatch harus dipakai di dalam ActiveBatchProvider')
  }
  return ctx
}