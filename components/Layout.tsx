import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, Search, Settings, User } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import DataSyncIndicator from './DataSyncIndicator'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { fetchSemesterInfo } from '../services/scheduleService'
import { syncDatabase } from '../services/syncService'
import { SemesterInfo } from '../types'

interface LayoutProps {
	children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const location = useLocation()
	const navigate = useNavigate()
	const [scrolled, setScrolled] = useState(false)
	const [dateStr, setDateStr] = useState('')
	const [isTeacher, setIsTeacher] = useState(false)
	const [showHeader, setShowHeader] = useState(true)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
	const [semesterInfo, setSemesterInfo] = useState<SemesterInfo | null>(null)

	// Get data from context to ensure live updates
	const { nickname, avatarSeed } = useTheme()

	// Check if selected group is a teacher
	useEffect(() => {
		const checkGroupType = async () => {
			try {
				const { getSelectedGroup } = await import('../services/groupService')
				const group = await getSelectedGroup()
				setIsTeacher(group?.type === 'teacher')
			} catch (error) {
				console.error('Error checking group type:', error)
			}
		}
		checkGroupType()
	}, [nickname])

	// Fetch Semester Info and Sync DB
	useEffect(() => {
		const initApp = async () => {
			// Start sync in background
			syncDatabase()

			// Init notifications
			try {
				const { initNotifications } = await import('../services/notificationService')
				await initNotifications()
			} catch (e) {
				console.error('Failed to init notifications', e)
			}

			// Fetch semester info (will wait for DB init inside service)
			const info = await fetchSemesterInfo()
			setSemesterInfo(info)
		}
		initApp()
	}, [])


	// Handle scroll for header effects (Glass on scroll)
	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY
			setScrolled(currentScrollY > 20)
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Parallax Effect for Background
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth) * 2 - 1
			const y = (e.clientY / window.innerHeight) * 2 - 1
			setMousePos({ x, y })
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => window.removeEventListener('mousemove', handleMouseMove)
	}, [])

	// Set Date
	useEffect(() => {
		const now = new Date()
		const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
		setDateStr(now.toLocaleDateString('pl-PL', options))
	}, [])

	const handleNavClick = (path: string) => {
		if (navigator.vibrate) {
			navigator.vibrate(10)
		}
		navigate(path)
	}

	const navItems = [
		{ icon: Home, label: 'Home', path: '/' },
		{ icon: Calendar, label: 'Plan', path: '/schedule' },
		{ icon: Search, label: 'Szukaj', path: '/search' },
		{ icon: Settings, label: 'Ustawienia', path: '/settings' },
	]

	return (
		<div className="min-h-screen relative overflow-x-hidden text-main font-sans transition-colors duration-300">
			{/* Data Sync Indicator */}
			<DataSyncIndicator />

			{/* Background Noise Texture */}
			<div className="bg-noise"></div>

			{/* Floating Geometric Shapes (Background) - Parallax */}
			<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
				{/* Large Orb */}
				<div
					className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] transition-transform duration-100 ease-out will-change-transform"
					style={{
						transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)`
					}}
				></div>

				{/* Secondary Orb (Opposite movement) */}
				<div
					className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[100px] transition-transform duration-100 ease-out will-change-transform"
					style={{
						transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`
					}}
				></div>
			</div>

			{/* Modern Clean Header - Glass on Scroll */}
			<header
				className={clsx(
					"fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-6 py-4 flex items-center justify-between border-b",
					scrolled ? 'bg-background/80 backdrop-blur-md border-border shadow-sm' : 'bg-transparent border-transparent',
				)}
				style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
				<div className="flex flex-col">
					<span className="text-xs font-bold text-muted uppercase tracking-wide mb-0.5 flex items-center gap-2">
						{dateStr}
					</span>
					{semesterInfo && (
						<span className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mb-1 block">
							{semesterInfo.semester} {semesterInfo.academic_year}
						</span>
					)}
					<h1 className="text-xl font-display font-bold text-main">
						{nickname === 'Student' || isTeacher ? 'Dzień dobry' : `Cześć, ${nickname}`}
					</h1>
				</div>

				<Link to="/settings" className="relative block group">
					{/* Seamless Illustrated Avatar */}
					<div className="w-12 h-12 rounded-full overflow-hidden shadow-lg bg-surface border border-border relative z-10 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
						<img
							src={`https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`}
							alt="Profil"
							className="w-full h-full object-cover bg-white"
						/>
					</div>
				</Link>
			</header>

			{/* Main Content */}
			<main
				className="relative z-10 px-5 max-w-lg mx-auto md:max-w-2xl"
				style={{
					paddingTop: 'calc(7rem + env(safe-area-inset-top))',
					paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))',
				}}>
				{children}
			</main>

			{/* Safe Area Bottom Background */}
			<div
				className="fixed bottom-0 left-0 right-0 bg-background z-40"
				style={{ height: 'env(safe-area-inset-bottom)' }}></div>

			{/* Floating Modern Navigation (Stable) */}
			<nav
				className="fixed bottom-6 left-0 right-0 mx-auto z-50 w-[96%] max-w-lg"
				style={{
					paddingBottom: 'env(safe-area-inset-bottom)'
				}}>
				<div className="bg-[#1a1d24]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex items-center justify-between shadow-2xl shadow-black/50 relative overflow-hidden">
					{navItems.map(item => {
						const isActive = location.pathname === item.path
						return (
							<button
								key={item.path}
								onClick={() => handleNavClick(item.path)}
								className="relative flex-1 h-14 flex flex-col items-center justify-center outline-none group"
							>
								{/* Active Indicator (Sliding Pill) */}
								{isActive && (
									<motion.div
										layoutId="nav-pill"
										className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_15px_rgba(var(--primary),0.2)]"
										transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
									/>
								)}

								{/* Icon */}
								<span className="relative z-10 flex items-center justify-center">
									<item.icon
										size={26}
										strokeWidth={isActive ? 2.5 : 2}
										className={clsx(
											"transition-all duration-300",
											isActive
												? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] scale-110'
												: 'text-muted group-hover:text-white'
										)}
									/>
								</span>
							</button>
						)
					})}
				</div>
			</nav>
		</div>
	)
}

export default Layout
