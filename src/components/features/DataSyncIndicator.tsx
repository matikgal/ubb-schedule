import React, { useState, useEffect } from 'react'
import { Download, WifiOff, CheckCircle, AlertCircle } from 'lucide-react'
import { getSyncStatus, subscribeToSyncStatus, SyncStatus } from '@/services/syncService'

const DataSyncIndicator: React.FC = () => {
	const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		const unsubscribe = subscribeToSyncStatus((newStatus) => {
			setStatus(newStatus)
			
			// Show if syncing or error
			if (newStatus.isSyncing || newStatus.error) {
				setVisible(true)
			} else if (newStatus.lastSync && !newStatus.isSyncing && !newStatus.error) {
				// Hide after success with a small delay
				setTimeout(() => setVisible(false), 3000)
			}
		})

		return () => unsubscribe()
	}, [])

	if (!visible) return null

	return (
		<div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
			{status.isSyncing && (
				<div className="bg-surface/90 backdrop-blur-md text-main px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-primary/50">
					<Download size={16} className="animate-bounce text-primary" />
					<span className="text-xs font-bold">Pobieranie bazy ({Math.round(status.progress)}%)</span>
				</div>
			)}

			{status.error && (
				<div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-red-400/20">
					<AlertCircle size={16} />
					<span className="text-xs font-bold">Błąd: {status.error}</span>
				</div>
			)}
			
			{!status.isSyncing && !status.error && status.lastSync && (
				<div className="bg-green-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-green-400/20">
					<CheckCircle size={16} />
					<span className="text-xs font-bold">Baza zaktualizowana</span>
				</div>
			)}
		</div>
	)
}

export default DataSyncIndicator
