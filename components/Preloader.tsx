import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PreloaderProps {
	onFinish: () => void
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
	const [lastUpdate, setLastUpdate] = useState('')
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		// Simulate minimum loading time + data check
		const minDuration = 3000
		const startTime = Date.now()

		const loadData = async () => {
			try {
				// Check for cached data to show "Last updated"
				const { getSelectedGroup } = await import('../services/groupService')
				const selectedGroup = await getSelectedGroup()

				if (selectedGroup) {
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
			} catch (e) {
				console.error(e)
			}

			// Ensure minimum duration
			const elapsed = Date.now() - startTime
			const remaining = Math.max(0, minDuration - elapsed)

			setTimeout(() => {
				setIsVisible(false)
				setTimeout(onFinish, 800) // Wait for exit animation
			}, remaining)
		}

		loadData()
	}, [onFinish])

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					key="preloader"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.8, ease: "easeInOut" }}
					className="fixed inset-0 z-[100] bg-[#0f1115] flex flex-col items-center justify-center overflow-hidden font-sans"
				>
					{/* Import Custom Fonts */}
					<style>{`
						@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&family=Outfit:wght@300;500;700&display=swap');
						.font-space { font-family: 'Space Grotesk', sans-serif; }
						.font-outfit { font-family: 'Outfit', sans-serif; }
					`}</style>

					{/* Background Ambient Glow */}
					<motion.div
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.2, 0.4, 0.2],
						}}
						transition={{
							duration: 4,
							repeat: Infinity,
							ease: "easeInOut"
						}}
						className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"
					/>

					{/* Central Content */}
					<div className="relative z-10 flex flex-col items-center gap-12">
						{/* UBB Logo Container */}
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 1, ease: "easeOut" }}
							className="relative w-48 h-24"
						>
							<svg viewBox="0 0 180 80" className="w-full h-full drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]">
								{/* U */}
								<motion.path
									d="M 30 20 V 47.5 A 12.5 12.5 0 0 0 55 47.5 V 20"
									fill="none"
									stroke="white"
									strokeWidth="7"
									strokeLinecap="round"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									transition={{ duration: 1.2, ease: "easeOut" }}
								/>
								{/* B1 */}
								<motion.path
									d="M 75 20 H 95 A 10 10 0 0 1 95 40 H 75 V 20 M 75 40 H 100 A 10 10 0 0 1 100 60 H 75 V 40"
									fill="none"
									stroke="#3b82f6"
									strokeWidth="7"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
								/>
								{/* B2 */}
								<motion.path
									d="M 120 20 H 140 A 10 10 0 0 1 140 40 H 120 V 20 M 120 40 H 145 A 10 10 0 0 1 145 60 H 120 V 40"
									fill="none"
									stroke="white"
									strokeWidth="7"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ pathLength: 0, opacity: 0 }}
									animate={{ pathLength: 1, opacity: 1 }}
									transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }}
								/>
							</svg>
						</motion.div>

						{/* Typography */}
						<div className="text-center space-y-2">
							<motion.h1
								initial={{ y: 20, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								transition={{ delay: 1.0, duration: 0.8 }}
								className="text-4xl font-bold text-white tracking-tight font-space"
							>
								UBB <span className="text-blue-500">Schedule</span>
							</motion.h1>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1.4, duration: 0.8 }}
								className="flex items-center justify-center gap-3"
							>
								<div className="h-[1px] w-8 bg-blue-500/50"></div>
								<p className="text-xs text-gray-400 font-bold tracking-[0.4em] uppercase font-space">
									Plan Zajęć
								</p>
								<div className="h-[1px] w-8 bg-blue-500/50"></div>
							</motion.div>
						</div>

						{/* Loading Line */}
						<motion.div
							initial={{ width: 0, opacity: 0 }}
							animate={{ width: 80, opacity: 1 }}
							transition={{ delay: 1.6, duration: 0.5 }}
							className="h-1 bg-white/10 rounded-full overflow-hidden mt-2"
						>
							<motion.div
								animate={{ x: [-80, 80] }}
								transition={{
									repeat: Infinity,
									duration: 1.2,
									ease: "easeInOut"
								}}
								className="h-full w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"
							/>
						</motion.div>
					</div>

					{/* Footer Info */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 2, duration: 1 }}
						className="absolute bottom-12 text-center space-y-2 font-outfit"
					>
						<span className="text-[10px] font-bold tracking-[0.2em] text-gray-600 uppercase block">
							Wersja 2.5.0
						</span>
						{lastUpdate && (
							<div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
								<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
								<span>Zaktualizowano: {lastUpdate}</span>
							</div>
						)}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default Preloader
