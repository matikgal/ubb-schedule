import React, { useEffect, useState } from 'react'
import { Logo } from './Logo'

interface PreloaderProps {
	onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
	const [fadeOut, setFadeOut] = useState(false)
	const [dataLoaded, setDataLoaded] = useState(false)
	const [lastUpdate, setLastUpdate] = useState('')

	// Timeline:
	// 0.0s - 1.5s: Logo Draw
	// 1.0s - 2.5s: Text Draw
	// Minimum 3.5s OR until data loads
	const minDuration = 3500

	useEffect(() => {
		let animationFinished = false
		let dataFinished = false

		// Check cache and get last update date (no fetch)
		const loadData = async () => {
			try {
				const { getSelectedGroup } = await import('../services/groupService')

				const selectedGroup = await getSelectedGroup()

				if (selectedGroup) {
					// Get last update date from cache
					const cacheKey = `schedule_${selectedGroup.id}`
					const cached = localStorage.getItem(cacheKey)
					if (cached) {
						const parsedCache = JSON.parse(cached)
						if (parsedCache.lastUpdate) {
							const date = new Date(parsedCache.lastUpdate)
							setLastUpdate(date.toLocaleDateString('pl-PL', { 
								day: 'numeric', 
								month: 'long',
								hour: '2-digit',
								minute: '2-digit'
							}))
						}
					}
				}
			} catch (error) {
				console.error('Error checking cache:', error)
			} finally {
				dataFinished = true
				checkIfReady()
			}
		}

		// Wait for minimum animation duration
		const animationTimer = setTimeout(() => {
			animationFinished = true
			checkIfReady()
		}, minDuration)

		const checkIfReady = () => {
			if (animationFinished && dataFinished) {
				setDataLoaded(true)
				setFadeOut(true)
				setTimeout(onFinish, 800)
			}
		}

		loadData()

		return () => clearTimeout(animationTimer)
	}, [onFinish])

	return (
		<div
			className={`fixed inset-0 z-[100] bg-[#0f1115] flex flex-col items-center justify-center transition-opacity duration-1000 ${
				fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
			}`}>
			<div className="relative flex flex-col items-center justify-center w-full max-w-md mb-12">
				{/* Neon Glow Background */}
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full opacity-0 animate-[fadeIn_2s_ease-out_0.5s_forwards]"></div>

				{/* 1. Custom 3D Logo */}
				<div className="mb-8 scale-150">
					<Logo />
				</div>

				{/* 2. Handwritten Text Draw */}
				<div className="relative z-10 mt-4">
					<svg width="300" height="120" viewBox="0 0 300 120">
						{/* Line 1: Plan zajęć (Handwritten) */}
						<text
							x="50%"
							y="45%"
							textAnchor="middle"
							className="font-cursive text-5xl fill-transparent stroke-white"
							strokeWidth="1"
							style={{
								strokeDasharray: 500,
								strokeDashoffset: 500,
								animation: 'draw-path 2s ease-in-out 1.5s forwards',
								fontFamily: '"Dancing Script", cursive',
								fontWeight: 100
							}}>
							Plan zajęć
						</text>
						<text
							x="50%"
							y="45%"
							textAnchor="middle"
							className="font-cursive text-5xl fill-white stroke-none opacity-0"
							style={{
								animation: 'fadeIn 0.5s ease-out 3s forwards',
								fontFamily: '"Dancing Script", cursive',
								fontWeight: 100
							}}>
							Plan zajęć
						</text>

						{/* Line 2: UBB (Bold Block) */}
						<text
							x="50%"
							y="85%"
							textAnchor="middle"
							className="text-4xl fill-transparent stroke-white"
							strokeWidth="1"
							style={{
								strokeDasharray: 500,
								strokeDashoffset: 500,
								animation: 'draw-path 2s ease-in-out 2.0s forwards',
								fontFamily: 'Arial, sans-serif',
								fontWeight: 'bold',
								letterSpacing: '0.1em'
							}}>
							UBB
						</text>
						<text
							x="50%"
							y="85%"
							textAnchor="middle"
							className="text-4xl fill-white stroke-none opacity-0"
							style={{
								animation: 'fadeIn 0.5s ease-out 3.5s forwards',
								fontFamily: 'Arial, sans-serif',
								fontWeight: 'bold',
								letterSpacing: '0.1em'
							}}>
							UBB
						</text>
					</svg>
				</div>
			</div>

			{/* Footer: Version & Last Update */}
			<div className="absolute bottom-10 w-full px-6 text-center space-y-2">
				<div className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase">
					Wersja 2.5.0
				</div>
				{lastUpdate && (
					<div className="text-[10px] font-medium text-gray-700 flex items-center justify-center gap-2">
						<span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse"></span>
						Ostatnia synchronizacja: {lastUpdate}
					</div>
				)}
			</div>
			
			<style>{`
				@keyframes draw-path {
					to { stroke-dashoffset: 0; }
				}
				@keyframes fadeIn {
					to { opacity: 1; }
				}
			`}</style>
		</div>
	)
}

export default Preloader
