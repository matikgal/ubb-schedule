import React, { useState, useEffect } from 'react'
import { Download, WifiOff } from 'lucide-react'
import { isDataInitialized } from '../services/dataInitializer'

const DataSyncIndicator: React.FC = () => {
	const [isInitialized, setIsInitialized] = useState(false)
	const [isOnline, setIsOnline] = useState(navigator.onLine)

	useEffect(() => {
		// Sprawdź początkowy stan
		isDataInitialized().then(setIsInitialized)

		// Sprawdzaj co 2 sekundy czy dane zostały zainicjalizowane
		const interval = setInterval(async () => {
			const initialized = await isDataInitialized()
			setIsInitialized(initialized)
		}, 2000)

		// Nasłuchuj zmian statusu online/offline
		const handleOnline = () => setIsOnline(true)
		const handleOffline = () => setIsOnline(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		// Force hide after 15 seconds to prevent stuck badge
		const forceHideTimeout = setTimeout(() => {
			setIsInitialized(true)
		}, 15000)

		return () => {
			clearInterval(interval)
			clearTimeout(forceHideTimeout)
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	// Jeśli dane są zainicjalizowane, nie pokazuj nic
	if (isInitialized) {
		return null
	}

	// Jeśli nie ma internetu i dane nie są zainicjalizowane
	if (!isOnline) {
		return (
			<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
				<div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-red-400/20">
					<WifiOff size={16} />
					<span className="text-xs font-bold">Brak internetu - dane nie pobrane</span>
				</div>
			</div>
		)
	}

	// Jeśli jest internet ale dane się pobierają
	return (
		<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
			<div className="bg-primary/90 backdrop-blur-md text-black px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-primary/20">
				<Download size={16} className="animate-bounce" />
				<span className="text-xs font-bold">Pobieranie danych...</span>
			</div>
		</div>
	)
}

export default DataSyncIndicator
