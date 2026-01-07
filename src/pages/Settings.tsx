import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Shield,
	ChevronRight,
	Check,
	Palette,
	ChevronDown,
	ChevronUp,
	Moon,
	Sun,
	Trash2,
	RefreshCw,
	Edit3,
	MessageSquare,
	Send,
} from 'lucide-react'
import { THEME_COLORS, useTheme } from '@/context/ThemeContext'
import GroupSelectorModal from '@/components/features/GroupSelectorModal'
import Modal from '@/components/ui/Modal'
import { APP_VERSION, CONTACT_EMAIL } from '@/constants/config'

const SettingsPage = () => {
	const [groupData, setGroupData] = useState<any>(null)
	const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false)

	// Contact Modal State
	const [isContactModalOpen, setIsContactModalOpen] = useState(false)
	const [contactType, setContactType] = useState<'bug' | 'idea' | 'collab'>('bug')
	const [contactMessage, setContactMessage] = useState('')
	const [isSending, setIsSending] = useState(false)

	const { currentTheme, setTheme, isDarkMode, toggleDarkMode, nickname, setNickname, avatarSeed, setAvatarSeed } =
		useTheme()

	useEffect(() => {
		const loadGroup = async () => {
			const { getSelectedGroup } = await import('@/services/groupService')
			const group = await getSelectedGroup()
			setGroupData(group)

			// If teacher is selected, update nickname to teacher's name
			if (group && group.type === 'teacher') {
				setNickname(group.name)
			}
		}
		loadGroup()
	}, [])

	const handleGroupSelected = async () => {
		const { getSelectedGroup } = await import('@/services/groupService')
		const group = await getSelectedGroup()
		setGroupData(group)

		// If teacher is selected, update nickname to teacher's name
		if (group && group.type === 'teacher') {
			setNickname(group.name)
		}
	}

	const [isThemeExpanded, setIsThemeExpanded] = useState(false)
	const [isAvatarExpanded, setIsAvatarExpanded] = useState(false)
	const [isEditingName, setIsEditingName] = useState(false)
	const [tempName, setTempName] = useState(nickname)
	const navigate = useNavigate()

	// Sync State
	const [syncStatus, setSyncStatus] = useState<import('@/services/syncService').SyncStatus>({
		isSyncing: false,
		lastSync: null,
		error: null,
		progress: 0
	})

	useEffect(() => {
		const loadSync = async () => {
			const { subscribeToSyncStatus, getSyncStatus } = await import('@/services/syncService')
			setSyncStatus(getSyncStatus())
			const unsubscribe = subscribeToSyncStatus(status => {
				setSyncStatus(status)
			})
			return unsubscribe
		}

		const cleanupPromise = loadSync()
		return () => {
			cleanupPromise.then(unsubscribe => unsubscribe && unsubscribe())
		}
	}, [])

	const handleManualSync = async () => {
		const { syncDatabase } = await import('@/services/syncService')
		syncDatabase(true)
	}

	// Avatar options
	const avatarOptions = ['Alexander', 'Aneka', 'Felix', 'Jake', 'Jocelyn', 'Micah', 'Minia', 'Robert', 'Sorell', 'Zoe']

	// Clear Data Modal State
	const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false)

	const handleClearAppData = () => {
		setIsClearDataModalOpen(true)
	}

	const confirmClearData = async () => {
		try {
			// Wyczyść localStorage
			localStorage.clear()

			// Wyczyść Capacitor Preferences (na mobile)
			try {
				const { storage } = await import('@/services/storage')
				await storage.clear()
			} catch (e) {
				// Ignore if not on mobile
			}

			// Restart aplikacji
			window.location.reload()
		} catch {
			alert('Wystąpił błąd podczas czyszczenia danych.')
		}
	}

	const handleNameSave = () => {
		if (tempName.trim()) {
			setNickname(tempName)
			setIsEditingName(false)
		}
	}

	const handleSendContact = () => {
		if (!contactMessage.trim()) return

		const subject = contactType === 'bug' ? 'Zgłoszenie błędu - UBB Plan' : 'Pomysł na funkcję - UBB Plan'
		const body = encodeURIComponent(contactMessage)
		const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`

		window.location.href = mailtoLink
		setIsContactModalOpen(false)
		setContactMessage('')
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
									className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${avatarSeed === seed ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
										}`}>
									<img
										src={`https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4`}
										alt={seed}
									/>
								</button>
							))}
						</div>
					)}

					<div className="mt-4 flex flex-col items-center gap-2 w-full">
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
									// Only allow editing if not a teacher
									if (groupData?.type !== 'teacher') {
										setTempName(nickname)
										setIsEditingName(true)
									}
								}}
								className={`text-xl font-bold text-main flex items-center gap-2 text-center ${groupData?.type !== 'teacher' ? 'cursor-pointer hover:text-primary transition-colors' : ''
									}`}>
								{nickname}
								{groupData?.type !== 'teacher' && <Edit3 size={14} className="text-muted opacity-50" />}
							</h2>
						)}
						<p className="text-xs text-muted uppercase tracking-wide font-bold">
							{groupData?.type === 'teacher' ? 'Prowadzący' : 'Student'}
						</p>
					</div>
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
								<div className="text-[10px] text-muted">
									{groupData.type === 'teacher' ? 'Wykładowca' : groupData.field}
								</div>
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
							className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${isDarkMode ? 'bg-green-500' : 'bg-slate-300'
								}`}>
							<div
								className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'
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
											className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${currentTheme.id === theme.id
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
											className={`text-[9px] font-medium ${currentTheme.id === theme.id ? 'text-primary' : 'text-muted'
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
					<div
						onClick={() => handleManualSync()}
						className={`p-4 flex items-center justify-between border-b border-border cursor-pointer hover:bg-hover transition-colors group ${syncStatus.isSyncing ? 'pointer-events-none opacity-70' : ''}`}
					>
						<div className="flex items-center gap-3">
							<RefreshCw size={18} className={`text-muted transition-transform ${syncStatus.isSyncing ? 'animate-spin text-primary' : 'group-hover:text-primary'}`} />
							<div>
								<span className="text-main text-sm font-medium block group-hover:text-primary transition-colors">
									{syncStatus.isSyncing ? 'Synchronizacja...' : 'Ostatnia synchronizacja'}
								</span>
								<span className="text-[10px] text-muted">
									{syncStatus.isSyncing
										? `Pobieranie danych (${Math.round(syncStatus.progress)}%)`
										: (syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString('pl-PL', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										}) : 'Nigdy')}
								</span>
							</div>
						</div>
						<div className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${syncStatus.isSyncing
							? 'bg-primary/10 text-primary'
							: (syncStatus.error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500')
							}`}>
							{syncStatus.isSyncing ? 'TRWA' : (syncStatus.error ? 'BŁĄD' : 'AKTUALNA')}
						</div>
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

			{/* Contact / Feedback Button */}
			<button
				onClick={() => setIsContactModalOpen(true)}
				className="w-full py-3.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
				<MessageSquare size={16} />
				Zgłoś błąd / Kontakt
			</button>

			<div className="text-center space-y-4 pt-6 pb-4 border-t border-border">
				<div className="flex justify-center gap-3 text-xs text-muted font-bold tracking-wide uppercase">
					<span>Wersja {APP_VERSION}</span>
					<span>•</span>
					<span className="flex items-center gap-1">
						Źródło:
						<a
							href="https://ubb.edu.pl/"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-primary transition-colors underline decoration-dotted">
							UBB
						</a>
					</span>
				</div>

				<div className="space-y-3">
					<p className="text-xs text-muted">Wszystkie dane są własnością Uniwersytetu Bielsko-Bialskiego.</p>

					<div className="text-xs text-muted font-medium">
						<p className="mb-1.5 uppercase tracking-wider opacity-70">Twórcy aplikacji</p>
						<div className="flex items-center justify-center gap-2">
							<span className="text-main font-bold">Mateusz Gałuszka</span>
							<span className="text-muted/50">•</span>
							<span className="text-main font-bold">Jakub Gałosz</span>
						</div>
					</div>

					<div className="pt-2 border-t border-border/50 w-2/3 mx-auto">
						<p className="text-[10px] text-muted/60 uppercase tracking-widest mb-1">Powered by</p>
						<div className="flex justify-center gap-3 text-[10px] text-muted font-mono">
							<span>React</span>
							<span>•</span>
							<span>Vite</span>
							<span>•</span>
							<span>Supabase</span>
							<span>•</span>
							<span>Capacitor</span>
						</div>
					</div>

					<p className="text-[9px] text-muted/40 pt-1">Assets: DiceBear, Unsplash, Lucide Icons</p>
				</div>
			</div>

			{/* Group Selector Modal */}
			<GroupSelectorModal
				isOpen={isGroupSelectorOpen}
				onClose={() => setIsGroupSelectorOpen(false)}
				onGroupSelected={handleGroupSelected}
			/>

			{/* Clear Data Confirmation Modal */}
			<Modal
				isOpen={isClearDataModalOpen}
				onClose={() => setIsClearDataModalOpen(false)}
				title="Wyczyść dane"
			>
				<div className="space-y-4">
					<div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex gap-3">
						<div className="text-red-500 shrink-0 mt-0.5">
							<Trash2 size={20} />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-bold text-red-500">Czy na pewno?</p>
							<p className="text-xs text-muted">
								Ta operacja jest nieodwracalna. Zostaną usunięte:
							</p>
							<ul className="text-xs text-muted list-disc list-inside ml-1 space-y-0.5 pt-1">
								<li>Zapisana grupa i ustawienia</li>
								<li>Pobrane plany zajęć (cache)</li>
								<li>Twój profil (imię, awatar)</li>
							</ul>
						</div>
					</div>

					<div className="flex gap-3 pt-2">
						<button
							onClick={() => setIsClearDataModalOpen(false)}
							className="flex-1 py-3 rounded-xl bg-surface border border-border text-main font-bold text-sm hover:bg-hover transition-colors"
						>
							Anuluj
						</button>
						<button
							onClick={confirmClearData}
							className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
						>
							Wyczyść wszystko
						</button>
					</div>
				</div>
			</Modal>

			{/* Contact Modal */}
			<Modal
				isOpen={isContactModalOpen}
				onClose={() => setIsContactModalOpen(false)}
				title="Kontakt"
				className="max-h-[600px]"
			>
				<div className="space-y-4">
					<p className="text-sm text-muted">
						Masz pomysł na nową funkcję? Znalazłeś błąd? Napisz do nas!
					</p>

					<div className="grid grid-cols-2 gap-2">
						<button
							onClick={() => setContactType('bug')}
							className={`p-2 rounded-xl text-xs font-bold border transition-all ${contactType === 'bug'
								? 'bg-red-500/10 border-red-500 text-red-500'
								: 'bg-background border-border text-muted hover:border-red-500/50'
								}`}
						>
							Błąd
						</button>
						<button
							onClick={() => setContactType('idea')}
							className={`p-2 rounded-xl text-xs font-bold border transition-all ${contactType === 'idea'
								? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
								: 'bg-background border-border text-muted hover:border-yellow-500/50'
								}`}
						>
							Pomysł
						</button>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-bold text-muted uppercase ml-1">Wiadomość</label>
						<textarea
							value={contactMessage}
							onChange={(e) => setContactMessage(e.target.value)}
							placeholder="Opisz swój problem lub pomysł..."
							className="w-full h-32 bg-background border border-border rounded-xl p-3 text-sm text-main placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
						/>
					</div>

					<button
						onClick={handleSendContact}
						disabled={!contactMessage.trim()}
						className="w-full py-3 rounded-xl bg-primary text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Send size={16} />
						Wyślij
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default SettingsPage
