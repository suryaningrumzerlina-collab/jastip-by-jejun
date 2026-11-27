'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const STORAGE_KEY = 'jejun_pwa_collapsed'

export function PwaInstallBanner() {
  const iosDialogRef = useRef<HTMLDialogElement>(null)

  const [isInstalled, setIsInstalled] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // 1. Daftarkan Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // 2. Cek apakah sudah berjalan sebagai aplikasi ter-install (standalone)
    const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches
    const iosStandalone =
      'standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (standaloneMatch || iosStandalone) {
      setIsInstalled(true)
      return
    }

    setIsInstalled(false)

    // 3. Cek preferensi hide/show sebelumnya
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setIsCollapsed(true)
    }

    // 4. Deteksi perangkat iOS (iPhone/iPad)
    const ua = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIos(iosDevice)

    // 5. Tangkap event install bawaan Android/Chrome/Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Kontrol native <dialog> untuk panduan iOS
  useEffect(() => {
    const dialog = iosDialogRef.current
    if (!dialog) return
    if (showIosGuide && !dialog.open) {
      dialog.showModal()
    } else if (!showIosGuide && dialog.open) {
      dialog.close()
    }
  }, [showIosGuide])

  function handleToggleCollapse(next: boolean) {
    setIsCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
  }

  async function handleInstallClick() {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Jangan tampilkan apa pun jika sudah ter-install, atau browser tidak mendukung install
  if (isInstalled || (!deferredPrompt && !isIos)) {
    return null
  }

  return (
    <>
      <aside
        aria-label="Instalasi aplikasi"
        className="print:hidden fixed bottom-28 right-5 z-40"
      >
        {isCollapsed ? (
          /* Mode Hide: Tombol ikon mungil semi-transparan */
          <button
            type="button"
            onClick={() => handleToggleCollapse(false)}
            aria-label="Tampilkan opsi install aplikasi"
            title="Install Aplikasi"
            className="w-9 h-9 rounded-full bg-white/85 backdrop-blur-md border border-[#EBDCC7] shadow-sm text-[#FF6B6B] opacity-75 hover:opacity-100 hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
          >
            <Icon icon="solar:download-minimalistic-bold" width={18} height={18} />
          </button>
        ) : (
          /* Mode Show: Pill notifikasi mini & tidak mendistract */
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md pl-3 pr-1.5 py-1.5 rounded-full shadow-[0_8px_24px_rgb(0,0,0,0.08)] border border-[#EBDCC7]">
            <Icon
              icon="solar:smartphone-bold"
              width={16}
              height={16}
              className="text-[#4ECDC4] shrink-0"
            />
            <span className="text-[11px] font-bold text-[#2D3436] whitespace-nowrap">
              Install App
            </span>
            <button
              type="button"
              onClick={handleInstallClick}
              className="h-7 px-3 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={() => handleToggleCollapse(true)}
              aria-label="Sembunyikan notifikasi install"
              title="Sembunyikan"
              className="w-7 h-7 rounded-full text-[#636E72] hover:bg-[#FAF5EB] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icon icon="solar:alt-arrow-right-bold" width={14} height={14} />
            </button>
          </div>
        )}
      </aside>

      {/* Modal Panduan Khusus iOS Safari */}
      {showIosGuide && (
        <dialog
          ref={iosDialogRef}
          onCancel={(e) => {
            e.preventDefault()
            setShowIosGuide(false)
          }}
          onClick={(e) => {
            if (e.target === iosDialogRef.current) setShowIosGuide(false)
          }}
          className="m-auto w-[calc(100%-3rem)] max-w-xs rounded-[2rem] bg-white p-6 shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-[#EBDCC7] backdrop:bg-[#2D3436]/40 backdrop:backdrop-blur-xs"
        >
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#4ECDC4]/15 text-[#4ECDC4] flex items-center justify-center">
              <Icon icon="solar:smartphone-bold" width={24} height={24} />
            </div>
            <div>
              <h2 className="font-black text-lg text-[#2D3436]">
                Pasang di iPhone / iPad
              </h2>
              <p className="text-xs font-bold text-[#636E72] mt-1">
                Ikuti 2 langkah mudah di Safari:
              </p>
            </div>

            <ol className="text-left text-xs font-bold text-[#2D3436] bg-[#FAF5EB] rounded-2xl p-4 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bagian bawah Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#4ECDC4] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Gulir ke bawah lalu pilih <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full h-11 rounded-full bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold text-xs cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </dialog>
      )}
    </>
  )
}