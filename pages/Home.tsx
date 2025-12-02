import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ClassEvent } from '../types'
import { getCurrentTimeMinutes, getMinutesFromMidnight, getDayName, isSameDay } from '../utils'
import GroupSelectorModal from '../components/GroupSelectorModal'
import {
	MapPin,
	GraduationCap,
	ArrowRight,
	User,
	Plus,
	X,
	Calculator,
	Timer,
	Trash2,
	AlertCircle,
	Check,
	Archive,
	RotateCcw,
	CalendarRange,
	ExternalLink,
	ChevronLeft,
	ChevronRight,
	Calendar,
	Clock,
} from 'lucide-react'
import { fetchScheduleForWeek } from '../services/scheduleService'
import { getSelectedGroup } from '../services/groupService'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import './Home.css'

// --- Types ---
interface Deadline {
	id: string
	title: string
	date: string // YYYY-MM-DD
}

interface ToastState {
	show: boolean
	message: string
	type: 'success' | 'error'
}

interface ConfirmState {
	isOpen: boolean
	itemId?: string
	title: string
	message: string
}

const Home: React.FC = () => {
	// --- Existing State ---
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [todaysEvents, setTodaysEvents] = useState<ClassEvent[]>([])
	const [activeIndex, setActiveIndex] = useState<number>(0)
	const [progress, setProgress] = useState(0)
	const [currentClassIndex, setCurrentClassIndex] = useState<number>(0) // Separate state for actual current class
	const swiperRef = useRef<any>(null)
	const dateInputRef = useRef<HTMLInputElement>(null) // Ref for date picker
	const [isDemo, setIsDemo] = useState(false)
	const [minutesNow, setMinutesNow] = useState(getCurrentTimeMinutes())

	// --- New Features State ---
	const [deadlines, setDeadlines] = useState<Deadline[]>([])
	const [archivedDeadlines, setArchivedDeadlines] = useState<Deadline[]>([])

	// Modals & UI States
	const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false)
	const [isArchiveOpen, setIsArchiveOpen] = useState(false)
	const [newDeadlineTitle, setNewDeadlineTitle] = useState('')
	const [newDeadlineDate, setNewDeadlineDate] = useState('')

	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
	const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({ isOpen: false, title: '', message: '' })
	const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false)

	// Cache all events to avoid re-fetching
	const [allEventsCache, setAllEventsCache] = useState<ClassEvent[]>([])
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
	const [isTransitioning, setIsTransitioning] = useState(false)

	// --- Load Initial Data (only once) ---
	useEffect(() => {
		const loadScheduleData = async () => {
			const selectedGroup = await getSelectedGroup()

			if (!selectedGroup) {
				setIsDemo(true)
				setTodaysEvents([])
				setIsLoadingSchedule(false)
				return
			}

			setIsDemo(false)

			try {
				// Pobierz wszystkie zajęcia dla grupy (tylko raz)
				const allEvents = await fetchScheduleForWeek(selectedGroup.id)
				setAllEventsCache(allEvents)
				setIsLoadingSchedule(false)
			} catch (error) {
				console.error('Error loading schedule:', error)
				setAllEventsCache([])
				setIsLoadingSchedule(false)
			}
		}

		loadScheduleData()

		// Load Deadlines & Archive (only once)
		const savedDeadlines = JSON.parse(localStorage.getItem('user-deadlines') || '[]')
		const savedArchive = JSON.parse(localStorage.getItem('user-deadlines-archive') || '[]')

		// Check for expiration (Auto-Archive)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const active: Deadline[] = []
		const expired: Deadline[] = []

		savedDeadlines.forEach((d: Deadline) => {
			const dDate = new Date(d.date)
			dDate.setHours(0, 0, 0, 0)
			// If date is before yesterday (allow "today" to stay visible)
			if (dDate.getTime() < today.getTime() - 86400000) {
				expired.push(d)
			} else {
				active.push(d)
			}
		})

		// Update states if anything expired
		if (expired.length > 0) {
			const newArchive = [...savedArchive, ...expired]
			setDeadlines(active)
			setArchivedDeadlines(newArchive)
			localStorage.setItem('user-deadlines', JSON.stringify(active))
			localStorage.setItem('user-deadlines-archive', JSON.stringify(newArchive))
		} else {
			setDeadlines(savedDeadlines)
			setArchivedDeadlines(savedArchive)
		}
	}, []) // Load only once on mount

	// --- Filter events for selected date ---
	useEffect(() => {
		if (isLoadingSchedule || allEventsCache.length === 0) {
			setTodaysEvents([])
			return
		}

		// Calculate API Day (1=Mon ... 7=Sun) based on selectedDate
		const dayIndex = selectedDate.getDay()
		const apiDay = dayIndex === 0 ? 7 : dayIndex

		// Filtruj zajęcia dla wybranego dnia z cache
		const eventsToProcess = allEventsCache.filter(e => e.dayOfWeek === apiDay)

		const sortedEvents = eventsToProcess.sort(
			(a, b) => getMinutesFromMidnight(a.startTime) - getMinutesFromMidnight(b.startTime)
		)

		setTodaysEvents(sortedEvents)

		// Reset progress if changing days
		if (!isSameDay(selectedDate, new Date())) {
			setProgress(0)
			setActiveIndex(0)
		}
	}, [selectedDate, allEventsCache, isLoadingSchedule])

	// Calculate current class index immediately
	const calculateCurrentClass = () => {
		const now = getCurrentTimeMinutes()
		let calculatedIdx = 0
		let foundActive = false

		todaysEvents.forEach((evt, idx) => {
			const start = getMinutesFromMidnight(evt.startTime)
			const end = getMinutesFromMidnight(evt.endTime)

			if (now >= start && now < end) {
				calculatedIdx = idx
				foundActive = true
				const totalDuration = end - start
				const elapsed = now - start
				setProgress((elapsed / totalDuration) * 100)
			} else if (now < start && !foundActive) {
				if (!foundActive) calculatedIdx = idx
			}
		})

		if (
			now > getMinutesFromMidnight(todaysEvents[todaysEvents.length - 1]?.endTime || '00:00') &&
			todaysEvents.length > 0
		) {
			calculatedIdx = todaysEvents.length - 1
			setProgress(100)
		}

		return calculatedIdx
	}

	// --- Timer & Progress Logic ---
	useEffect(() => {
		// Only run live timer if looking at TODAY
		const isToday = isSameDay(selectedDate, new Date())

		if (!isToday) {
			setMinutesNow(0) // Reset or stop updating
			setCurrentClassIndex(0)
			return
		}

		if (todaysEvents.length === 0) {
			return
		}

		// Immediate update on mount
		setMinutesNow(getCurrentTimeMinutes())
		const initialIdx = calculateCurrentClass()
		setCurrentClassIndex(initialIdx)

		const interval = setInterval(() => {
			const now = getCurrentTimeMinutes()
			setMinutesNow(now)
			const calculatedIdx = calculateCurrentClass()
			setCurrentClassIndex(calculatedIdx)
		}, 1000 * 30)

		return () => clearInterval(interval)
	}, [todaysEvents, selectedDate])

	// Initial slide positioning - immediate, no delay
	useEffect(() => {
		if (swiperRef.current && todaysEvents.length > 0 && !isLoadingSchedule && !isTransitioning) {
			// Only scroll to active on initial load or date change
			const isToday = isSameDay(selectedDate, new Date())
			const targetIndex = isToday ? currentClassIndex : 0

			// Immediate positioning without animation
			swiperRef.current?.slideTo(targetIndex, 0)
			setActiveIndex(targetIndex)
		}
	}, [todaysEvents.length, selectedDate, currentClassIndex, isLoadingSchedule, isTransitioning])

	// --- Handlers ---

	const handleDayChange = (offset: number) => {
		setIsTransitioning(true)
		setTimeout(() => {
			const newDate = new Date(selectedDate)
			newDate.setDate(selectedDate.getDate() + offset)
			setSelectedDate(newDate)
			setTimeout(() => setIsTransitioning(false), 50)
		}, 150)
	}

	const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value) {
			setIsTransitioning(true)
			setTimeout(() => {
				setSelectedDate(new Date(e.target.value))
				setTimeout(() => setIsTransitioning(false), 50)
			}, 150)
		}
	}

	const openDatePicker = () => {
		if (dateInputRef.current) {
			if ('showPicker' in HTMLInputElement.prototype) {
				try {
					dateInputRef.current.showPicker()
				} catch (error) {
					dateInputRef.current.click()
				}
			} else {
				dateInputRef.current.click()
			}
		}
	}

	const getDayTitle = () => {
		const dayIndex = selectedDate.getDay()
		const apiDay = dayIndex === 0 ? 7 : dayIndex
		return getDayName(apiDay)
	}

	const showToast = (message: string, type: 'success' | 'error' = 'success') => {
		setToast({ show: true, message, type })
		setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000)
	}

	const handleAddDeadline = () => {
		if (!newDeadlineTitle || !newDeadlineDate) {
			showToast('Uzupełnij nazwę i datę', 'error')
			return
		}

		const newDeadline: Deadline = {
			id: Date.now().toString(),
			title: newDeadlineTitle,
			date: newDeadlineDate,
		}

		const updated = [...deadlines, newDeadline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		setDeadlines(updated)
		localStorage.setItem('user-deadlines', JSON.stringify(updated))

		setNewDeadlineTitle('')
		setNewDeadlineDate('')
		setIsDeadlineModalOpen(false)
		showToast('Dodano deadline')
	}

	const initiateDeleteDeadline = (id: string) => {
		setConfirmDialog({
			isOpen: true,
			itemId: id,
			title: 'Archiwizuj',
			message: 'Czy przenieść ten termin do archiwum?',
		})
	}

	const confirmDelete = () => {
		if (!confirmDialog.itemId) return

		const itemToArchive = deadlines.find(d => d.id === confirmDialog.itemId)
		if (itemToArchive) {
			const updatedDeadlines = deadlines.filter(d => d.id !== confirmDialog.itemId)
			const updatedArchive = [...archivedDeadlines, itemToArchive]

			setDeadlines(updatedDeadlines)
			setArchivedDeadlines(updatedArchive)

			localStorage.setItem('user-deadlines', JSON.stringify(updatedDeadlines))
			localStorage.setItem('user-deadlines-archive', JSON.stringify(updatedArchive))
			showToast('Przeniesiono do archiwum')
		}

		setConfirmDialog({ isOpen: false, title: '', message: '' })
	}

	const deleteFromArchive = (id: string) => {
		const updated = archivedDeadlines.filter(d => d.id !== id)
		setArchivedDeadlines(updated)
		localStorage.setItem('user-deadlines-archive', JSON.stringify(updated))
	}

	const restoreFromArchive = (id: string) => {
		const item = archivedDeadlines.find(d => d.id === id)
		if (item) {
			const updatedArchive = archivedDeadlines.filter(d => d.id !== id)
			const updatedDeadlines = [...deadlines, item].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
			)

			setArchivedDeadlines(updatedArchive)
			setDeadlines(updatedDeadlines)

			localStorage.setItem('user-deadlines', JSON.stringify(updatedDeadlines))
			localStorage.setItem('user-deadlines-archive', JSON.stringify(updatedArchive))
			showToast('Przywrócono deadline')
		}
	}

	const getDeadlineColor = (dateStr: string) => {
		const diffTime = new Date(dateStr).getTime() - new Date().getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		if (diffDays < 0) return 'bg-slate-500/10 text-muted border-slate-500/20' // Past
		if (diffDays <= 3) return 'bg-red-500/10 text-red-500 border-red-500/20' // Critical
		if (diffDays <= 7) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' // Warning
		return 'bg-green-500/10 text-green-500 border-green-500/20' // Safe
	}

	const getDaysLeft = (dateStr: string) => {
		const diffTime = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		if (diffDays < 0) return 'Po terminie'
		if (diffDays === 0) return 'Dziś'
		if (diffDays === 1) return 'Jutro'
		return `${diffDays} dni`
	}

	const isTodayView = isSameDay(selectedDate, new Date())

	// Format selected date for input value (YYYY-MM-DD)
	const dateInputValue = selectedDate.toISOString().split('T')[0]

	// Helper function to get next class info
	const getNextClassInfo = () => {
		if (!isTodayView || todaysEvents.length === 0) return null

		const now = new Date()
		const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

		// Check if currently in a class
		const currentClass = todaysEvents.find(evt => evt.startTime <= currentTime && evt.endTime > currentTime)
		if (currentClass) return null // Don't show if in class

		// Check for next class
		const nextClass = todaysEvents.find(evt => evt.startTime > currentTime)
		if (nextClass) {
			// Calculate time until next class
			const [nextHour, nextMin] = nextClass.startTime.split(':').map(Number)
			const nextTime = new Date(now)
			nextTime.setHours(nextHour, nextMin, 0)
			const diffMs = nextTime.getTime() - now.getTime()
			const diffMins = Math.floor(diffMs / 60000)
			const diffHours = Math.floor(diffMins / 60)
			const remainingMins = diffMins % 60

			return {
				event: nextClass,
				minutesUntil: diffMins,
				hoursUntil: diffHours,
				remainingMinutes: remainingMins,
			}
		}

		// All classes finished for today
		return { finished: true }
	}

	const nextClassInfo = getNextClassInfo()

	// Get time range for today's classes
	const getClassTimeRange = () => {
		if (todaysEvents.length === 0) return null
		const sortedEvents = [...todaysEvents].sort((a, b) => a.startTime.localeCompare(b.startTime))
		return {
			start: sortedEvents[0].startTime,
			end: sortedEvents[sortedEvents.length - 1].endTime,
		}
	}

	const timeRange = getClassTimeRange()

	return (
		<div className="space-y-6 animate-fade-in relative">
			{/* --- Header --- */}
			<div className="px-1 flex items-start justify-between">
				<div
					className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
					key={`header-${selectedDate.toISOString()}`}>
					<h2 className="text-3xl font-display font-bold text-primary tracking-tight">{getDayTitle()}</h2>
					<span className="text-xs font-medium text-muted block mt-0.5">
						{selectedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
					</span>
				</div>
				{/* Badge with class info or "Brak zajęć" */}
				<div
					className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
						isTransitioning ? 'opacity-0' : 'opacity-100'
					} ${
						timeRange
							? 'bg-primary/10 text-primary border border-primary/20'
							: 'bg-muted/10 text-muted border border-muted/20'
					}`}
					key={`badge-${selectedDate.toISOString()}`}>
					{timeRange ? `${timeRange.start} - ${timeRange.end}` : 'Brak zajęć'}
				</div>
			</div>

			{/* Status Card - only show if today and no current class */}
			{isTodayView && nextClassInfo && !isDemo && (
				<section className="animate-fade-in">
					{nextClassInfo.finished ? (
						<div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 mx-1 shadow-lg">
							<div className="text-xs font-bold text-green-500 uppercase tracking-wide mb-1">Dzisiaj</div>
							<div className="text-base font-bold text-main">Brak więcej zajęć</div>
						</div>
					) : nextClassInfo.event ? (
						<div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mx-1 shadow-lg">
							<div className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
								Następne zajęcia za{' '}
								{nextClassInfo.hoursUntil > 0
									? `${nextClassInfo.hoursUntil}h ${nextClassInfo.remainingMinutes}min`
									: `${nextClassInfo.minutesUntil} min`}
							</div>
							<div className="text-base font-bold text-main mb-1">{nextClassInfo.event.subject}</div>
							<div className="text-xs text-muted">
								{nextClassInfo.event.startTime} - {nextClassInfo.event.endTime} • {nextClassInfo.event.room}
							</div>
						</div>
					) : null}
				</section>
			)}

			{/* --- Carousel --- */}
			<section className="-mx-5 h-[280px] flex items-center">
				<div
					className={`w-full transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
					key={selectedDate.toISOString()}>
					{isDemo ? (
						<div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-border rounded-3xl mx-6 bg-surface/30 w-full">
							<h3 className="text-xl font-bold text-main mb-2">Nie masz jeszcze wybranej grupy</h3>
							<p className="text-sm text-muted mb-6 max-w-[280px]">
								Wybierz swoją grupę zajęciową, aby zobaczyć plan zajęć i korzystać z pełni funkcji aplikacji.
							</p>
							<button
								onClick={() => setIsGroupSelectorOpen(true)}
								className="bg-primary text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">
								Wybierz grupę
							</button>
						</div>
					) : todaysEvents.length === 0 ? (
						<div className="mx-6 w-full">
							<div className="text-center py-8">
								<h3 className="text-lg font-bold text-main mb-1">Brak zajęć</h3>
								<p className="text-sm text-muted mb-4">W tym dniu nie masz zaplanowanych zajęć</p>
								{!isTodayView && (
									<button
										onClick={() => setSelectedDate(new Date())}
										className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
										Wróć do dzisiaj
									</button>
								)}
							</div>
						</div>
					) : (
						<div className="relative w-full">
							<Swiper
								onSwiper={swiper => {
									swiperRef.current = swiper
									// Set initial position immediately
									const isToday = isSameDay(selectedDate, new Date())
									const targetIndex = isToday ? currentClassIndex : 0
									if (targetIndex > 0) {
										setTimeout(() => {
											swiper.slideTo(targetIndex, 0)
											setActiveIndex(targetIndex)
										}, 0)
									}
								}}
								effect="coverflow"
								grabCursor={true}
								centeredSlides={true}
								slidesPerView="auto"
								spaceBetween={0}
								coverflowEffect={{
									rotate: 0,
									stretch: -20,
									depth: 120,
									modifier: 1,
									slideShadows: false,
								}}
								speed={400}
								touchRatio={1}
								threshold={10}
								longSwipesRatio={0.3}
								modules={[EffectCoverflow]}
								className="pb-8"
								initialSlide={isSameDay(selectedDate, new Date()) ? currentClassIndex : 0}
								onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}>
								{todaysEvents.map((evt, idx) => {
									// Logic: If looking at today, calculate active. If looking at another day, show all as standard.
									const isActive = idx === activeIndex
									const isCurrentClass = isTodayView && idx === currentClassIndex
									const isPast = isTodayView && idx < currentClassIndex
									const endTimeMins = getMinutesFromMidnight(evt.endTime)
									const minutesLeft = endTimeMins - minutesNow

									return (
										<SwiperSlide key={evt.id} style={{ width: '78vw', maxWidth: '340px' }}>
											<div className="w-full px-1 mb-2">
												<div
													className={`bg-surface rounded-2xl p-5 border transition-all duration-300 flex flex-col relative overflow-hidden shadow-lg ${
														isActive ? 'border-primary/20 shadow-2xl' : 'border-border/50 shadow-md'
													}`}>
													{/* Decorative quarter circle */}
													<div
														className={`absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 pointer-events-none transition-opacity duration-300 ${
															isActive ? 'opacity-10' : 'opacity-5'
														}`}
														style={{ backgroundColor: 'var(--color-primary)' }}></div>

													{/* Status badge if today */}
													{isTodayView && (
														<div className="mb-3">
															<span
																className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
																	isCurrentClass ? 'bg-primary text-black' : 'bg-slate-500/10 text-muted'
																}`}>
																{isCurrentClass ? 'Teraz' : isPast ? 'Koniec' : 'Wkrótce'}
															</span>
														</div>
													)}

													{/* Subject title and type on same line */}
													<div className="flex items-start gap-2 mb-3">
														<h3
															className={`text-lg font-display font-bold leading-tight flex-1 ${
																isActive ? 'text-primary' : 'text-main'
															}`}>
															{evt.subject}
														</h3>
														<span
															className={`text-[10px] font-bold border border-border px-2 py-1 rounded-md uppercase tracking-wide flex-shrink-0 ${
																isActive ? 'text-main bg-background/50' : 'text-muted'
															}`}>
															{evt.type}
														</span>
													</div>

													{/* Details */}
													<div className="flex flex-col gap-1.5 text-sm text-muted mb-4">
														<div className="flex items-center gap-2">
															<MapPin size={13} className="opacity-70 flex-shrink-0" />
															<span className="text-xs">{evt.room}</span>
														</div>
														<div className="flex items-center gap-2">
															<User size={13} className="opacity-70 flex-shrink-0" />
															<span className="text-xs opacity-80 line-clamp-1">{evt.teacher}</span>
														</div>
													</div>

													{/* Time display */}
													<div className="flex justify-between items-center text-xs font-medium text-muted mb-2">
														<span>{evt.startTime}</span>
														{isCurrentClass && minutesLeft > 0 && (
															<span className="text-primary font-bold animate-pulse text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
																{minutesLeft} min
															</span>
														)}
														<span>{evt.endTime}</span>
													</div>

													{/* Progress Bar - only show when class is currently happening */}
													{isCurrentClass && (
														<div className="h-1 w-full bg-slate-500/10 rounded-full overflow-hidden">
															<div
																className="h-full bg-primary transition-all duration-1000 ease-linear"
																style={{ width: `${progress}%` }}></div>
														</div>
													)}
												</div>
											</div>
										</SwiperSlide>
									)
								})}
							</Swiper>

							{/* Navigation Dots */}
							{todaysEvents.length > 1 && (
								<div className="flex justify-center gap-2 mt-4">
									{todaysEvents.map((_, idx) => (
										<button
											key={idx}
											onClick={() => swiperRef.current?.slideTo(idx)}
											className={`transition-all duration-300 rounded-full ${
												idx === activeIndex ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-slate-500/50 hover:bg-primary/50'
											}`}
											aria-label={`Przejdź do zajęć ${idx + 1}`}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			{/* Day Navigator - moved to bottom of schedule section */}
			{!isDemo && (
				<div className="flex items-center gap-3 px-1">
					{/* Hidden Date Input */}
					<input
						ref={dateInputRef}
						type="date"
						value={dateInputValue}
						onChange={handleDateSelect}
						className="absolute opacity-0 pointer-events-none"
					/>

					<button
						onClick={() => handleDayChange(-1)}
						className="flex-1 h-12 flex items-center justify-center gap-2 bg-surface hover:bg-hover rounded-xl border border-border text-main transition-colors font-medium text-sm">
						<ChevronLeft size={18} />
						<span>Poprzedni</span>
					</button>

					<button
						onClick={openDatePicker}
						className="h-12 px-4 flex items-center justify-center bg-surface hover:bg-hover rounded-xl border border-border text-main transition-colors">
						<Calendar size={18} className={isTodayView ? 'text-primary' : 'text-muted'} />
					</button>

					<button
						onClick={() => handleDayChange(1)}
						className="flex-1 h-12 flex items-center justify-center gap-2 bg-surface hover:bg-hover rounded-xl border border-border text-main transition-colors font-medium text-sm">
						<span>Następny</span>
						<ChevronRight size={18} />
					</button>
				</div>
			)}

			{/* --- Deadlines Section --- */}
			<section className="space-y-4">
				<div className="flex items-center justify-between px-1">
					<h3 className="text-lg font-display font-bold text-main">Deadline'y</h3>
					<button
						onClick={() => setIsArchiveOpen(true)}
						className="flex items-center gap-2 text-[10px] font-bold text-muted bg-surface px-3 py-1.5 rounded-full border border-border hover:bg-hover transition-colors">
						<Archive size={12} />
						<span>ARCHIWUM</span>
					</button>
				</div>

				<div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
					{deadlines.map(dl => {
						const colorClass = getDeadlineColor(dl.date)
						return (
							<div
								key={dl.id}
								className={`shrink-0 w-32 aspect-square rounded-2xl p-3 flex flex-col justify-between border ${colorClass} relative group transition-transform active:scale-95`}>
								<div className="flex justify-between items-start">
									<span className="text-[10px] font-bold uppercase opacity-70">
										{new Date(dl.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
									</span>
								</div>
								<div>
									<h4 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{dl.title}</h4>
									<p className="text-[10px] font-medium opacity-80">{getDaysLeft(dl.date)}</p>
								</div>

								{/* Bigger Delete Button */}
								<button
									onClick={e => {
										e.stopPropagation()
										initiateDeleteDeadline(dl.id)
									}}
									className="absolute bottom-2 right-2 p-2 text-current opacity-70 hover:opacity-100 hover:scale-110 transition-all rounded-full hover:bg-background/10">
									<Trash2 size={16} />
								</button>
							</div>
						)
					})}

					{/* BIG ADD BUTTON */}
					<button
						onClick={() => setIsDeadlineModalOpen(true)}
						className="shrink-0 w-32 aspect-square rounded-2xl bg-surface border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-all group">
						<div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:scale-110 transition-all">
							<Plus size={20} />
						</div>
						<span className="text-xs font-bold">Dodaj</span>
					</button>
				</div>
			</section>

			{/* --- Shortcuts --- */}
			<section className="space-y-6">
				<div className="flex items-center justify-between px-1">
					<h3 className="text-lg font-display font-bold text-main">Na skróty</h3>
					<div className="w-8 h-1 bg-primary/20 rounded-full"></div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<Link
						to="/calculator"
						className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all group">
						<Calculator size={24} className="text-orange-400 mb-3 group-hover:scale-110 transition-transform" />
						<h4 className="text-main font-bold text-sm">Średnia</h4>
						<p className="text-[11px] text-muted mt-1">Kalkulator ocen</p>
					</Link>

					{/* Academic Calendar - PDF Link */}
					<a
						href="https://studia.ubb.edu.pl/informacje-dla-studenta/harmonogram-studiow-2025-2026"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all">
						<CalendarRange size={24} className="text-blue-400 mb-3" />
						<h4 className="text-main font-bold text-sm">Harmonogram</h4>
						<p className="text-[11px] text-muted mt-1">Kalendarz (PDF)</p>
					</a>

					<a
						href="https://ubb.edu.pl/"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-surface p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-hover transition-all col-span-2 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<GraduationCap size={24} className="text-muted-green" />
							<div>
								<h4 className="text-main font-bold text-sm">Strona UBB</h4>
								<p className="text-[11px] text-muted mt-0.5">ubb.edu.pl</p>
							</div>
						</div>
						<ArrowRight size={16} className="text-muted" />
					</a>
				</div>

				{/* Map Preview with Click-To-Open (Solves Mobile Issues) */}
				<div className="bg-surface rounded-2xl overflow-hidden border border-border relative group">
					<div className="p-4 border-b border-border flex justify-between items-center bg-surface z-10 relative">
						<span className="text-xs font-bold uppercase tracking-wide text-muted">Kampus</span>
					</div>

					{/* The Map Visual */}
					{/* Oversized container to ensure no gaps, with overlay INSIDE relative to it */}
					<div className="w-full h-[300px] relative bg-surface overflow-hidden group-hover:grayscale-0 transition-all duration-500 grayscale-[0.2]">
						{/* Interactive Map Overlay Button - MOVED INSIDE to avoid gaps */}
						<a
							href="https://www.google.com/maps/d/u/0/viewer?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&ehbc=2E312F&z=17"
							target="_blank"
							rel="noopener noreferrer"
							className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors cursor-pointer">
							<div className="bg-surface/90 backdrop-blur-md px-4 py-2.5 rounded-full flex items-center gap-2 border border-border shadow-xl transform transition-transform group-hover:scale-105">
								<ExternalLink size={16} className="text-primary" />
								<span className="text-xs font-bold text-main">Otwórz mapę</span>
							</div>
						</a>

						{/* Iframe */}
						<iframe
							src="https://www.google.com/maps/d/u/0/embed?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&ehbc=2E312F&z=17"
							style={{
								border: 0,
								position: 'absolute',
								top: '-65px',
								left: '0',
								width: '100%',
								height: 'calc(100% + 250px)', // Heavily oversized height to push google controls out of view
							}}
							allowFullScreen={false}
							loading="lazy"
							title="Mapa Kampusu"
							className="opacity-90 relative z-0"></iframe>
					</div>
				</div>
			</section>

			{/* --- MODALS --- */}

			{/* Add Deadline Modal */}
			{isDeadlineModalOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-surface border border-border rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-slide-up">
						<div className="flex justify-between items-center mb-6">
							<h3 className="font-display font-bold text-lg text-main">Dodaj termin</h3>
							<button onClick={() => setIsDeadlineModalOpen(false)}>
								<X size={20} className="text-muted" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-xs font-bold text-muted uppercase ml-1">Nazwa</label>
								<input
									type="text"
									className="w-full bg-background border border-border rounded-xl p-3 text-main outline-none focus:border-primary mt-1"
									placeholder="np. Kolokwium Analiza"
									value={newDeadlineTitle}
									onChange={e => setNewDeadlineTitle(e.target.value)}
								/>
							</div>
							<div>
								<label className="text-xs font-bold text-muted uppercase ml-1">Data</label>
								<input
									type="date"
									className="w-full bg-background border border-border rounded-xl p-3 text-main outline-none focus:border-primary mt-1"
									value={newDeadlineDate}
									onChange={e => setNewDeadlineDate(e.target.value)}
								/>
							</div>
							<button
								onClick={handleAddDeadline}
								className="w-full bg-primary text-black font-bold py-3 rounded-xl mt-2 hover:opacity-90 transition-opacity">
								Dodaj
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Archive Modal */}
			{isArchiveOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center gap-2">
								<Archive size={20} className="text-primary" />
								<h3 className="font-display font-bold text-lg text-main">Archiwum</h3>
							</div>
							<button onClick={() => setIsArchiveOpen(false)}>
								<X size={20} className="text-muted" />
							</button>
						</div>

						<div className="overflow-y-auto flex-1 space-y-2 pr-2">
							{archivedDeadlines.length === 0 ? (
								<div className="text-center py-10 text-muted opacity-60 text-sm">Puste archiwum</div>
							) : (
								archivedDeadlines.map(item => (
									<div
										key={item.id}
										className="bg-background border border-border rounded-xl p-3 flex items-center justify-between">
										<div>
											<h4 className="text-sm font-bold text-main line-clamp-1 opacity-70">{item.title}</h4>
											<p className="text-[10px] text-muted">{item.date}</p>
										</div>
										<div className="flex items-center gap-2">
											<button
												onClick={() => restoreFromArchive(item.id)}
												className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20">
												<RotateCcw size={14} />
											</button>
											<button
												onClick={() => deleteFromArchive(item.id)}
												className="p-2 text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20">
												<Trash2 size={14} />
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{confirmDialog.isOpen && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
					<div className="bg-surface border border-border rounded-2xl w-full max-w-xs p-6 shadow-2xl animate-slide-up">
						<div className="flex flex-col items-center text-center space-y-4">
							<div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
								<AlertCircle size={24} />
							</div>
							<div>
								<h3 className="text-lg font-bold text-main">{confirmDialog.title}</h3>
								<p className="text-sm text-muted mt-1">{confirmDialog.message}</p>
							</div>
							<div className="grid grid-cols-2 gap-3 w-full mt-2">
								<button
									onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '' })}
									className="py-2.5 rounded-xl border border-border text-main font-bold text-sm hover:bg-hover transition-colors">
									Anuluj
								</button>
								<button
									onClick={confirmDelete}
									className="py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
									Archiwizuj
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Toast */}
			{toast.show && (
				<div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] animate-fade-in-up w-auto whitespace-nowrap">
					<div
						className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${
							toast.type === 'success'
								? 'bg-surface border-green-500/30 text-green-500'
								: 'bg-surface border-red-500/30 text-red-500'
						}`}>
						{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
						<span className="text-sm font-bold">{toast.message}</span>
					</div>
				</div>
			)}

			{/* Group Selector Modal */}
			<GroupSelectorModal
				isOpen={isGroupSelectorOpen}
				onClose={() => setIsGroupSelectorOpen(false)}
				onGroupSelected={() => window.location.reload()}
			/>
		</div>
	)
}

export default Home
