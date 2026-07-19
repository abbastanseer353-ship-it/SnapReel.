import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    window.dispatchEvent(new Event('pwa-installable'))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event('pwa-installed'))
  })
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Exposes install state for the "Add to Home screen" button.
 * `canInstall` is true when the browser fired beforeinstallprompt (Android/desktop Chrome).
 * On iOS Safari there is no such event, so the UI shows manual instructions instead.
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(deferredPrompt !== null)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onInstallable = () => setCanInstall(true)
    const onInstalled = () => {
      setCanInstall(false)
      setInstalled(true)
    }
    window.addEventListener('pwa-installable', onInstallable)
    window.addEventListener('pwa-installed', onInstalled)
    return () => {
      window.removeEventListener('pwa-installable', onInstallable)
      window.removeEventListener('pwa-installed', onInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable'
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    deferredPrompt = null
    setCanInstall(false)
    return choice.outcome
  }

  const isIos =
    typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  return { canInstall, installed, promptInstall, isIos }
}
