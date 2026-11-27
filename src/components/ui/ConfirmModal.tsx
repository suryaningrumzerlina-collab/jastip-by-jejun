'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Hapus',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        if (!isLoading) onCancel()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isLoading) onCancel()
      }}
      className="m-auto w-[calc(100%-3rem)] max-w-sm rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center mb-4">
          <Icon icon="solar:trash-bin-trash-bold" width={28} height={28} />
        </div>
        <h2 className="font-black text-xl text-[#2D3436]">{title}</h2>
        <p className="text-sm font-bold text-[#636E72] mt-2">{message}</p>

        <div className="flex gap-3 w-full mt-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="flex-1 h-11 rounded-full bg-white border border-[#EBDCC7] text-[#2D3436] font-bold text-sm hover:bg-[#FAF5EB] transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 h-11 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Icon icon="solar:refresh-bold" width={18} height={18} className="animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  )
}