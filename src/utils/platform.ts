/**
 * Platform detection utilities
 * Centralized platform detection logic to avoid code duplication
 */

/**
 * Check if the current platform is Android
 * Uses multiple detection methods for reliability
 * @returns true if running on Android platform
 */
export const isAndroidPlatform = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check Tauri platform if available
    const tauriPlatform = (window as any).__TAURI__?.platform
    if (tauriPlatform === 'android') return true

    // Check user agent
    if (navigator.userAgent.includes('Android')) return true
    if (/Android/i.test(navigator.userAgent)) return true
  }
  return false
}

/**
 * Check if the current platform is mobile (Android, iOS, or other mobile devices)
 * Uses multiple detection methods for reliability
 * @returns true if running on mobile platform
 */
export const isMobilePlatform = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check Tauri platform if available
    const tauriPlatform = (window as any).__TAURI__?.platform
    if (tauriPlatform === 'android' || tauriPlatform === 'ios') return true

    // Check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase()
    if (
      userAgent.includes('android') ||
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod') ||
      userAgent.includes('mobile') ||
      userAgent.includes('tablet')
    ) {
      return true
    }

    // Check screen size as fallback
    if (window.innerWidth <= 768) return true
  }
  return false
}
