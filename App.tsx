import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SearchPage from './pages/Search'
import SchedulePage from './pages/Schedule'
import CalculatorPage from './pages/Calculator'
import Preloader from './components/Preloader'
import GroupSelectorModal from './components/GroupSelectorModal'
import {
	Shield,
	LogOut,
	ChevronRight,
	Bell,
	Check,
	Palette,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	Moon,
	Sun,
	Trash2,
	RefreshCw,
	Info,
	Edit3,
	X,
} from 'lucide-react'
import { THEME_COLORS, useTheme } from './context/ThemeContext'

const PrivacyPage = () => {
	const navigate = useNavigate()
	return (
		<div className="space-y-6 animate-fade-in pt-6">
			<div className="flex items-center gap-4 mb-2">
				<button
					onClick={() => navigate(-1)}
					className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-main transition-colors">
					<ChevronLeft size={20} />
				</button>
				<h1 className="text-2xl font-display font-bold text-main">Prywatność</h1>
			</div>

			<div className="bg-surface rounded-2xl p-6 border border-border space-y-4 text-muted text-sm leading-relaxed shadow-sm">
				<p>
					Twoja prywatność jest dla nas priorytetem. Aplikacja <strong className="text-main">UniSchedule</strong>{' '}
					przechowuje Twoje preferencje (wybrana grupa, motyw) wyłącznie lokalnie na Twoim urządzeniu (Local Storage).
				</p>
				<p>
					Żadne dane osobowe nie są przesyłane na zewnętrzne serwery. Dane o planie zajęć są pobierane z publicznie
					dostępnych źródeł uczelni lub wprowadzane ręcznie.
				</p>
				<p>Aplikacja nie śledzi Twojej lokalizacji ani nie wykorzystuje plików cookies w celach reklamowych.</p>
			</div>
		</div>
	)
}

const SettingsPage = () => {
	const [groupData, setGroupData] = useState<any>(null)
	const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false)

	useEffect(() => {
		const loadGroup = async () => {
			const { getSelectedGroup } = await import('./services/groupService')
			const group = await getSelectedGroup()
			setGroupData(group)
		}
		loadGroup()
	}, [])

	const handleGroupSelected = async () => {
		const { getSelectedGroup } = await import('./services/groupService')
		const group = await getSelectedGroup()
		setGroupData(group)
	}

	const { currentTheme, setTheme, isDarkMode, toggleDarkMode, nickname, setNickname, avatarSeed, setAvatarSeed } =
		useTheme()

	const [isThemeExpanded, setIsThemeExpanded] = useState(false)
	const [isAvatarExpanded, setIsAvatarExpanded] = useState(false)
	const [isEditingName, setIsEditingName] = useState(false)
	const [tempName, setTempName] = useState(nickname)
	const navigate = useNavigate()

	// Mock Data
	const appVersion = '2.4.1'
	const lastSyncDate = '15 Paź 2023, 04:30'
	const avatarOptions = ['Alexander', 'Aneka', 'Felix', 'Jake', 'Jocelyn', 'Micah', 'Minia', 'Robert', 'Sorell', 'Zoe']

	const handleClearAppData = async () => {
		if (
			!confirm(
				'Czy na pewno chcesz wyczyścić wszystkie dane aplikacji? To usunie:\n\n• Zapisaną grupę\n• Nazwę użytkownika i awatar\n• Cache planów zajęć\n• Wszystkie ustawienia\n\nAplikacja zostanie zrestartowana.'
			)
		) {
			return
		}

		try {
			// Wyczyść localStorage
			localStorage.clear()

			// Wyczyść Capacitor Preferences (na mobile)
			try {
				const { storage } = await import('./services/storage')
				await storage.clear()
			} catch (e) {
				// Ignore if not on mobile
			}

			// Restart aplikacji
			alert('Dane zostały wyczyszczone. Aplikacja zostanie zrestartowana.')
			window.location.reload()
		} catch (error) {
			console.error('Error clearing data:', error)
			alert('Wystąpił błąd podczas czyszczenia danych.')
		}
	}

	const handleNameSave = () => {
		if (tempName.trim()) {
			setNickname(tempName)
			setIsEditingName(false)
		}
	}

	return (
		<div className="space-y-8 animate-fade-in pt-4 pb-24">
			<div>
				<h1 className="text-2xl font-display font-bold text-main">Ustawienia</h1>
				<p className="text-muted text-sm">Personalizacja i dane</p>
			</div>

			{/* Profile Section */}
			<section className="bg-surface rounded-3xl p-6 border border-border shadow-sm flex flex-col items-center relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent"></div>

				<div className="relative z-10 flex flex-col items-center">
					<button onClick={() => setIsAvatarExpanded(!isAvatarExpanded)} className="relative group">
						<div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl">
							<img
								src={`https://api.dicebear.com/9.x/notionists/svg?seed=${avatarSeed}&backgroundColor=b6e3f4`}
								alt="Profil"
								className="w-full h-full object-cover bg-white"
							/>
						</div>
						<div className="absolute bottom-0 right-0 bg-primary text-black p-1.5 rounded-full shadow-md transform scale-90 group-hover:scale-100 transition-transform">
							<Edit3 size={14} />
						</div>
					</button>

					{isAvatarExpanded && (
						<div className="mt-6 mb-2 grid grid-cols-5 gap-3 animate-slide-down bg-background/50 p-4 rounded-2xl">
							{avatarOptions.map(seed => (
								<button
									key={seed}
									onClick={() => {
										setAvatarSeed(seed)
										setIsAvatarExpanded(false)
									}}
									className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
										avatarSeed === seed ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
									}`}>
									<img
										src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4`}
										alt={seed}
									/>
								</button>
							))}
						</div>
					)}

					<div className="mt-4 flex items-center gap-2">
						{isEditingName ? (
							<div className="flex items-center gap-2 bg-background rounded-lg px-2 py-1 border border-primary/50">
								<input
									type="text"
									value={tempName}
									onChange={e => setTempName(e.target.value)}
									className="bg-transparent text-main font-bold text-lg text-center w-32 outline-none"
									autoFocus
								/>
								<button onClick={handleNameSave}>
									<Check size={18} className="text-green-500" />
								</button>
							</div>
						) : (
							<h2
								onClick={() => {
									setTempName(nickname)
									setIsEditingName(true)
								}}
								className="text-xl font-bold text-main cursor-pointer hover:text-primary transition-colors flex items-center gap-2">
								{nickname}
								<Edit3 size={14} className="text-muted opacity-50" />
							</h2>
						)}
					</div>
					<p className="text-xs text-muted uppercase tracking-wide font-bold mt-1">Student</p>
				</div>
			</section>

			{/* Your Group Info (Moved to Top) */}
			<section className="space-y-3">
				<h2 className="text-xs font-bold uppercase tracking-wide text-muted ml-1">Twoja Grupa</h2>
				<div className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
					{groupData ? (
						<div className="flex justify-between items-center">
							<div>
								<div className="text-main text-sm font-bold">{groupData.name}</div>
								<div className="text-[10px] text-muted">{groupData.type === 'teacher' ? 'Wykładowca' : groupData.field}</div>
							</div>
							<button
								onClick={() => setIsGroupSelectorOpen(true)}
								className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
								ZMIEŃ
							</button>
						</div>
					) : (
						<div className="flex justify-between items-center text-muted text-sm">
							<span>Nie wybrano grupy.</span>
							<button onClick={() => setIsGroupSelectorOpen(true)} className="text-primary text-xs font-bold">
								Wybierz
							</button>
						</div>
					)}
				</div>
			</section>

			{/* Appearance */}
			<section className="space-y-3">
				<h2 className="text-xs font-bold uppercase tracking-wide text-muted ml-1">Wygląd</h2>
				<div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm">
					{/* Dark Mode Toggle */}
					<div
						onClick={toggleDarkMode}
						className="p-4 flex items-center justify-between border-b border-border cursor-pointer hover:bg-hover transition-colors">
						<div className="flex items-center gap-3">
							{isDarkMode ? <Moon size={18} className="text-muted" /> : <Sun size={18} className="text-muted" />}
							<span className="text-main text-sm font-medium">Tryb Ciemny</span>
						</div>
						<button
							className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${
								isDarkMode ? 'bg-green-500' : 'bg-slate-300'
							}`}>
							<div
								className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
									isDarkMode ? 'translate-x-6' : 'translate-x-0'
								}`}></div>
						</button>
					</div>

					{/* Theme Accordion */}
					<div className="transition-all">
						<div
							onClick={() => setIsThemeExpanded(!isThemeExpanded)}
							className="p-4 flex items-center justify-between hover:bg-hover transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<Palette size={18} className="text-muted" />
								<span className="text-main text-sm font-medium">Motyw kolorystyczny</span>
							</div>
							<div className="flex items-center gap-3">
								<div
									className="w-3 h-3 rounded-full shadow-sm border border-white/10"
									style={{ backgroundColor: currentTheme.hex }}></div>
								{isThemeExpanded ? (
									<ChevronUp size={16} className="text-muted" />
								) : (
									<ChevronDown size={16} className="text-muted" />
								)}
							</div>
						</div>

						{isThemeExpanded && (
							<div className="p-4 bg-background/30 flex gap-4 overflow-x-auto no-scrollbar animate-slide-down border-t border-border">
								{THEME_COLORS.map(theme => (
									<button
										key={theme.id}
										onClick={() => setTheme(theme.id)}
										className="flex flex-col items-center gap-2 group min-w-[50px]">
										<div
											className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
												currentTheme.id === theme.id
													? 'ring-2 ring-primary scale-110'
													: 'opacity-70 group-hover:opacity-100'
											}`}
											style={{ backgroundColor: theme.hex }}>
											{currentTheme.id === theme.id && (
												<Check
													size={14}
													className={theme.id === 'white' && !isDarkMode ? 'text-white' : 'text-black'}
												/>
											)}
										</div>
										<span
											className={`text-[9px] font-medium ${
												currentTheme.id === theme.id ? 'text-primary' : 'text-muted'
											}`}>
											{theme.name}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			</section>

			{/* Data & System */}
			<section className="space-y-3">
				<h2 className="text-xs font-bold uppercase tracking-wide text-muted ml-1">Dane i System</h2>
				<div className="bg-surface rounded-2xl overflow-hidden border border-border shadow-sm">
					<div className="p-4 flex items-center justify-between border-b border-border">
						<div className="flex items-center gap-3">
							<RefreshCw size={18} className="text-muted" />
							<div>
								<span className="text-main text-sm font-medium block">Ostatnia synchronizacja</span>
								<span className="text-[10px] text-muted">{lastSyncDate}</span>
							</div>
						</div>
						<div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded">OK</div>
					</div>

					<div
						onClick={handleClearAppData}
						className="p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors cursor-pointer group">
						<div className="flex items-center gap-3">
							<Trash2 size={18} className="text-muted group-hover:text-red-400 transition-colors" />
							<div>
								<span className="text-main text-sm font-medium group-hover:text-red-400 transition-colors block">
									Wyczyść dane aplikacji
								</span>
								<span className="text-[10px] text-muted">Usuwa grupę, cache i ustawienia</span>
							</div>
						</div>
					</div>

					<div
						onClick={() => navigate('/privacy')}
						className="p-4 flex items-center justify-between hover:bg-hover transition-colors cursor-pointer border-t border-border">
						<div className="flex items-center gap-3">
							<Shield size={18} className="text-muted" />
							<span className="text-main text-sm font-medium">Prywatność</span>
						</div>
						<ChevronRight size={16} className="text-muted" />
					</div>
				</div>
			</section>

			<button
				onClick={async () => {
					const { storage } = await import('./services/storage')
					await storage.removeItem('selectedGroup')
					window.location.href = '#/'
					window.location.reload()
				}}
				className="w-full py-3.5 rounded-xl border border-red-500/10 text-red-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/5 transition-colors">
				<LogOut size={16} />
				Wyloguj
			</button>

			<div className="text-center space-y-4 pt-4 border-t border-border">
				<div className="flex justify-center gap-4 text-[10px] text-muted font-bold tracking-wide uppercase">
					<span>Wersja {appVersion}</span>
					<span>•</span>
					<span className="flex items-center gap-1">
						Źródło:
						<a
							href="https://plany.ubb.edu.pl/"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-primary transition-colors underline decoration-dotted">
							UBB
						</a>
					</span>
				</div>

				<div className="space-y-1">
					<p className="text-[10px] text-muted">Dane planu są własnością Uniwersytetu Bielsko-Bialskiego.</p>
					<div className="text-[10px] text-muted font-medium pt-1 space-y-0.5">
						<p>
							Aplikacja: <span className="text-main font-bold">Mateusz Gałuszka</span>
						</p>
						<p>
							Pobieranie danych (Scraper): <span className="text-main font-bold">Jakub Gałosz</span>
						</p>
					</div>
					<p className="text-[9px] text-muted/50 pt-2">Assets: DiceBear (Avatars), Unsplash, Lucide Icons</p>
				</div>
			</div>

			{/* Group Selector Modal */}
			<GroupSelectorModal
				isOpen={isGroupSelectorOpen}
				onClose={() => setIsGroupSelectorOpen(false)}
				onGroupSelected={handleGroupSelected}
			/>
		</div>
	)
}

const App: React.FC = () => {
	const [loading, setLoading] = useState(true)

	const handlePreloaderFinish = async () => {
		// Force navigation to Home (root) when app starts
		window.location.hash = '/'
		setLoading(false)

		// Ukryj natywny splash screen po zakończeniu animacji
		try {
			const { SplashScreen } = await import('@capacitor/splash-screen')
			await SplashScreen.hide()
		} catch (e) {
			// Ignore if not on mobile
		}
	}

	// Initialize data on first load
	useEffect(() => {
		const initData = async () => {
			const { initializeAllData } = await import('./services/dataInitializer')
			await initializeAllData()
		}

		initData()
	}, [])

	if (loading) {
		return <Preloader onFinish={handlePreloaderFinish} />
	}

	return (
		<Router>
			<Layout>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/schedule" element={<SchedulePage />} />
					<Route path="/search" element={<SearchPage />} />
					<Route path="/calculator" element={<CalculatorPage />} />
					<Route path="/settings" element={<SettingsPage />} />
					<Route path="/privacy" element={<PrivacyPage />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Layout>
		</Router>
	)
}

export default App
