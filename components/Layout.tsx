import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Search, Settings } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import DataSyncIndicator from './DataSyncIndicator'

interface LayoutProps {
	children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	const location = useLocation()
	const [scrolled, setScrolled] = useState(false)
	const [dateStr, setDateStr] = useState('')
	const [isTeacher, setIsTeacher] = useState(false)

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
	}, [nickname]) // Re-check when nickname changes (which happens when group changes)

	// Handle scroll for header effects
	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20)
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Set Date
	useEffect(() => {
		const now = new Date()
		const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
		setDateStr(now.toLocaleDateString('pl-PL', options))
	}, [])

	const navItems = [
		{ icon: Home, label: 'Home', path: '/' },
		{ icon: Calendar, label: 'Plan', path: '/schedule' },
		{ icon: Search, label: 'Szukaj', path: '/search' },
	]

	return (
		<div className="min-h-screen relative overflow-x-hidden text-main font-sans transition-colors duration-300">
			{/* Data Sync Indicator */}
			<DataSyncIndicator />

			{/* Background Noise Texture */}
			<div className="bg-noise"></div>

			{/* Floating Geometric Shapes (Background) */}
			<div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
				{/* Single large soft gradient orb */}
				<div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] animate-float"></div>
			</div>

			{/* Modern Clean Header - z safe area top */}
			<header
				className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 px-6 py-4 flex items-center justify-between border-b ${
					scrolled ? 'bg-background/90 backdrop-blur-md border-border' : 'bg-transparent border-transparent'
				}`}
				style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
				<div className="flex flex-col">
					<span className="text-xs font-bold text-muted uppercase tracking-wide mb-0.5 flex items-center gap-2">
						{dateStr}
					</span>
					<h1 className="text-xl font-display font-bold text-main">
						{nickname === 'Student' || isTeacher ? 'Dzień dobry' : `Cześć, ${nickname}`}
					</h1>
				</div>

				<Link to="/settings" className="relative block">
					{/* Seamless Illustrated Avatar */}
					<div className="w-12 h-12 rounded-full overflow-hidden shadow-lg bg-surface border border-border relative z-10">
						<img
							src={`https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`}
							alt="Profil"
							className="w-full h-full object-cover bg-white"
						/>
					</div>

					{/* Settings Badge - Higher Z-Index ensures it stays on top */}
					<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface rounded-full flex items-center justify-center border border-border shadow-sm z-20">
						<Settings size={10} className="text-main" />
					</div>
				</Link>
			</header>

			{/* Main Content - z większym padding top i bottom safe area */}
			<main
				className="relative z-10 px-5 max-w-lg mx-auto md:max-w-2xl"
				style={{
					paddingTop: 'calc(7rem + env(safe-area-inset-top))',
					paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))',
				}}>
				{children}
			</main>

			{/* Czarny pasek na dole (safe area) */}
			<div
				className="fixed bottom-0 left-0 right-0 bg-background z-40"
				style={{ height: 'env(safe-area-inset-bottom)' }}></div>

			{/* Floating Modern Navigation (Swiss Style) - z safe area bottom */}
			<nav
				className="fixed left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-lg"
				style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
				<div className="glass-nav rounded-2xl p-1.5 flex items-center justify-between shadow-2xl">
					{navItems.map(item => {
						const isActive = location.pathname === item.path
						return (
							<Link key={item.path} to={item.path} className="flex-1 flex justify-center items-center h-12 relative">
								<div
									className={`w-[80%] h-full rounded-xl flex items-center justify-center transition-all duration-300 ${
										isActive
											? 'bg-primary/20 text-primary shadow-sm border border-primary/10'
											: 'text-muted hover:text-main hover:bg-hover opacity-70 hover:opacity-100'
									}`}>
									<item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
								</div>
							</Link>
						)
					})}
				</div>
			</nav>
		</div>
	)
}

export default Layout
