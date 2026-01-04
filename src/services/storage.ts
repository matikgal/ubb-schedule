import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

/**
 * Uniwersalny storage adapter - używa Capacitor Preferences na mobile, localStorage na web
 */

const isNative = Capacitor.isNativePlatform()

export const storage = {
	/**
	 * Zapisz wartość
	 */
	async setItem(key: string, value: string): Promise<void> {
		if (isNative) {
			await Preferences.set({ key, value })
		} else {
			try {
				localStorage.setItem(key, value)
			} catch (e) {
				if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
					console.warn('⚠️ LocalStorage quota exceeded. Clearing cache and retrying...')
					try {
						// Clear only cache items, preserve settings if possible (or just clear all for simplicity)
						// For now, let's try to clear everything to recover
						localStorage.clear()
						localStorage.setItem(key, value)
					} catch (retryError) {
						console.error('❌ Failed to save item even after clearing storage:', retryError)
					}
				} else {
					console.error('Error saving to localStorage:', e)
				}
			}
		}
	},

	/**
	 * Pobierz wartość
	 */
	async getItem(key: string): Promise<string | null> {
		if (isNative) {
			const { value } = await Preferences.get({ key })
			return value
		} else {
			return localStorage.getItem(key)
		}
	},

	/**
	 * Usuń wartość
	 */
	async removeItem(key: string): Promise<void> {
		if (isNative) {
			await Preferences.remove({ key })
		} else {
			localStorage.removeItem(key)
		}
	},

	/**
	 * Wyczyść wszystko
	 */
	async clear(): Promise<void> {
		if (isNative) {
			await Preferences.clear()
		} else {
			localStorage.clear()
		}
	},

	/**
	 * Pobierz wszystkie klucze
	 */
	async keys(): Promise<string[]> {
		if (isNative) {
			const { keys } = await Preferences.keys()
			return keys
		} else {
			return Object.keys(localStorage)
		}
	},
}

/**
 * Helper do zapisywania obiektów JSON
 */
export async function setJSON(key: string, value: any): Promise<void> {
	await storage.setItem(key, JSON.stringify(value))
}

/**
 * Helper do odczytywania obiektów JSON
 */
export async function getJSON<T>(key: string): Promise<T | null> {
	const value = await storage.getItem(key)
	if (!value) return null
	try {
		return JSON.parse(value) as T
	} catch {
		return null
	}
}
