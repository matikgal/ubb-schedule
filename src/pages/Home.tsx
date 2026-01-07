import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ClassEvent } from '@/types'
import { getCurrentTimeMinutes, getMinutesFromMidnight, getDayName, isSameDay } from '@/lib/utils'
import GroupSelectorModal from '@/components/features/GroupSelectorModal'
import Modal from '@/components/ui/Modal'
import {
	MapPin,
	User,
	Plus,
	Trash2,
	AlertCircle,
	Check,
	Archive,
	ChevronLeft,
	ChevronRight,
	Calendar,
	Grid,
	RefreshCw,
	ExternalLink,
	StickyNote,
} from 'lucide-react'
import { fetchScheduleForWeek, getAvailableWeeks } from '@/services/scheduleService'
import { getSelectedGroup } from '@/services/groupService'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import './Home.css'
import clsx from 'clsx'

// Widgets
import CampusMapWidget from '@/components/features/widgets/CampusMapWidget'
import DeansOfficeWidget from '@/components/features/widgets/DeansOfficeWidget'
import DeansOfficeModal from '@/components/features/DeansOfficeModal'
import NotesModal from '@/components/features/NotesModal'


// --- Types ---
interface Deadline {
	id: string
	title: string
	date: string // YYYY-MM-DD
	description?: string
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
	const [currentClassIndex, setCurrentClassIndex] = useState<number>(0)
	const swiperRef = useRef<any>(null)
	const dateInputRef = useRef<HTMLInputElement>(null)
	const deadlineInputRef = useRef<HTMLInputElement>(null)
	const [isDemo, setIsDemo] = useState(false)
	const [minutesNow, setMinutesNow] = useState(getCurrentTimeMinutes())

	// Countdown State
	const [countdownString, setCountdownString] = useState<string>('')

	// --- New Features State ---
	const [deadlines, setDeadlines] = useState<Deadline[]>([])
	const [archivedDeadlines, setArchivedDeadlines] = useState<Deadline[]>([])

	// Modals & UI States
	const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false)
	const [isAllDeadlinesOpen, setIsAllDeadlinesOpen] = useState(false)
	const [isArchiveOpen, setIsArchiveOpen] = useState(false)
	const [newDeadlineTitle, setNewDeadlineTitle] = useState('')
	const [newDeadlineDate, setNewDeadlineDate] = useState('')
	const [newDeadlineDescription, setNewDeadlineDescription] = useState('')
	const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
	const [isDeansOfficeModalOpen, setIsDeansOfficeModalOpen] = useState(false)

	// Notes State
	const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
	const [selectedNoteSubject, setSelectedNoteSubject] = useState('')

	const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
	const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({ isOpen: false, title: '', message: '' })
	const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false)

	// Cache all events to avoid re-fetching
	const [allEventsCache, setAllEventsCache] = useState<ClassEvent[]>([])
	const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
	const [isTransitioning, setIsTransitioning] = useState(false)
	const [isRefreshing, setIsRefreshing] = useState(false)

	// Week handling
	const [availableWeeks, setAvailableWeeks] = useState<Array<{ id: string; label: string; start: Date; end: Date }>>([])
	const [loadedWeekId, setLoadedWeekId] = useState<string | null>(null)
	const [isTeacherView, setIsTeacherView] = useState(false)

	// --- Load Initial Data (only once) ---
	const loadScheduleData = async (forceRefresh = false) => {
		const selectedGroup = await getSelectedGroup()

		if (!selectedGroup) {
			setIsDemo(true)
			setTodaysEvents([])
			setIsLoadingSchedule(false)
			return
		}

		setIsDemo(false)
		const isTeacher = selectedGroup.type === 'teacher'
		setIsTeacherView(isTeacher)

		// 1. Load available weeks if not loaded
		let weeks = availableWeeks
		if (weeks.length === 0 || forceRefresh) {
			try {
				weeks = await getAvailableWeeks(selectedGroup.id, isTeacher)
				setAvailableWeeks(weeks)
			} catch {
				// Silent fail
			}
		}

		// 2. Find week for selectedDate
		// Reset hours for comparison
		const targetDate = new Date(selectedDate)
		targetDate.setHours(12, 0, 0, 0) // Middle of day to avoid timezone edge cases

		const matchingWeek = weeks.find(w => targetDate >= w.start && targetDate <= w.end)
		const weekId = matchingWeek ? matchingWeek.id : weeks[0]?.id

		// 3. Fetch schedule if week changed or forced
		if (weekId && (weekId !== loadedWeekId || forceRefresh)) {
			setIsLoadingSchedule(true)
			try {
				const allEvents = await fetchScheduleForWeek(selectedGroup.id, weekId, false, isTeacher)
				setAllEventsCache(allEvents)
				setLoadedWeekId(weekId)

				// Schedule notifications for deadlines
				// Removed automatic scanning as per user request (manual list only)
			} catch {
				setAllEventsCache([])
			} finally {
				setIsLoadingSchedule(false)
			}

		} else if (!weekId) {
			// No weeks available
			setAllEventsCache([])
			setIsLoadingSchedule(false)
		} else {
			// Same week, just stop loading indicators
		}
	}

	// Initial load and date change handler
	useEffect(() => {
		loadScheduleData()
	}, [selectedDate])

	// Deadlines management
	useEffect(() => {
		const savedDeadlines = JSON.parse(localStorage.getItem('user-deadlines') || '[]')
		const savedArchive = JSON.parse(localStorage.getItem('user-deadlines-archive') || '[]')

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const active: Deadline[] = []
		const expired: Deadline[] = []

		savedDeadlines.forEach((d: Deadline) => {
			const dDate = new Date(d.date)
			dDate.setHours(0, 0, 0, 0)
			if (dDate.getTime() < today.getTime()) {
				expired.push(d)
			} else {
				active.push(d)
			}
		})

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
	}, [])

	// Pull to Refresh Logic
	useEffect(() => {
		let startY = 0

		const handleTouchStart = (e: TouchEvent) => {
			if (window.scrollY === 0) {
				startY = e.touches[0].clientY
			}
		}

		const handleTouchMove = (e: TouchEvent) => {
			if (startY > 0 && e.touches[0].clientY > startY + 100 && window.scrollY === 0 && !isRefreshing) {
				setIsRefreshing(true)
				if (navigator.vibrate) navigator.vibrate(20)
				loadScheduleData(true)
				// Safety timeout to ensure spinner disappears even if load hangs
				setTimeout(() => {
					setIsRefreshing(false)
				}, 1500)
				startY = 0 // Reset
			}
		}

		window.addEventListener('touchstart', handleTouchStart)
		window.addEventListener('touchmove', handleTouchMove)

		return () => {
			window.removeEventListener('touchstart', handleTouchStart)
			window.removeEventListener('touchmove', handleTouchMove)
		}
	}, [isRefreshing])

	// --- Filter events for selected date ---
	useEffect(() => {
		if (isLoadingSchedule && !isRefreshing) {
			// Don't clear events if just refreshing
			if (allEventsCache.length === 0) setTodaysEvents([])
			return
		}

		const dayIndex = selectedDate.getDay()
		const apiDay = dayIndex === 0 ? 7 : dayIndex

		const eventsToProcess = allEventsCache.filter(e => e.dayOfWeek === apiDay)

		const sortedEvents = eventsToProcess.sort(
			(a, b) => getMinutesFromMidnight(a.startTime) - getMinutesFromMidnight(b.startTime)
		)

		setTodaysEvents(sortedEvents)

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

		for (let idx = 0; idx < todaysEvents.length; idx++) {
			const evt = todaysEvents[idx]
			const start = getMinutesFromMidnight(evt.startTime)
			const end = getMinutesFromMidnight(evt.endTime)

			// If current time is BEFORE this event
			if (now < start) {
				if (!foundActive) {
					calculatedIdx = idx
					setProgress(0) // Reset progress for upcoming class
				}
				break // Stop checking, this is the upcoming one
			}

			// If current time is WITHIN this event
			if (now >= start && now < end) {
				calculatedIdx = idx
				foundActive = true
				const totalDuration = end - start
				const elapsed = now - start
				setProgress((elapsed / totalDuration) * 100)
				break
			}
		}

		if (
			now > getMinutesFromMidnight(todaysEvents[todaysEvents.length - 1]?.endTime || '00:00') &&
			todaysEvents.length > 0
		) {
			calculatedIdx = todaysEvents.length
			setProgress(100)
		}

		return calculatedIdx
	}

	// --- Timer & Progress Logic (Minutes) ---
	useEffect(() => {
		const isToday = isSameDay(selectedDate, new Date())

		if (!isToday) {
			setMinutesNow(0)
			setCurrentClassIndex(0)
			return
		}

		if (todaysEvents.length === 0) {
			return
		}

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

	// --- Precise Countdown Logic (Seconds) ---
	useEffect(() => {
		const isToday = isSameDay(selectedDate, new Date())
		if (!isToday || todaysEvents.length === 0) return

		const updateCountdown = () => {
			const now = new Date()
			const currentEvent = todaysEvents[currentClassIndex]

			if (currentEvent && currentClassIndex < todaysEvents.length) {
				const [startHour, startMin] = currentEvent.startTime.split(':').map(Number)
				const [endHour, endMin] = currentEvent.endTime.split(':').map(Number)

				const startTime = new Date()
				startTime.setHours(startHour, startMin, 0, 0)

				const endTime = new Date()
				endTime.setHours(endHour, endMin, 0, 0)

				// Check if class hasn't started yet
				if (now < startTime) {
					const diff = startTime.getTime() - now.getTime()
					if (diff > 0) {
						const minutes = Math.floor((diff / 1000 / 60) % 60)
						const seconds = Math.floor((diff / 1000) % 60)
						const hours = Math.floor(diff / (1000 * 60 * 60))

						if (hours > 0) {
							setCountdownString(`${hours}h ${minutes}m`)
						} else {
							setCountdownString(`${minutes}:${seconds.toString().padStart(2, '0')}`)
						}
					}
				} else {
					// Class is running
					const diff = endTime.getTime() - now.getTime()
					if (diff > 0) {
						const minutes = Math.floor((diff / 1000 / 60) % 60)
						const seconds = Math.floor((diff / 1000) % 60)
						setCountdownString(`${minutes}:${seconds.toString().padStart(2, '0')}`)
					} else {
						setCountdownString('')
					}
				}
			} else {
				setCountdownString('')
			}
		}

		// Update immediately and then every second
		updateCountdown()
		const interval = setInterval(updateCountdown, 1000)

		return () => clearInterval(interval)
	}, [todaysEvents, currentClassIndex, selectedDate])


	// Initial slide positioning
	useEffect(() => {
		if (swiperRef.current && todaysEvents.length > 0 && !isLoadingSchedule && !isTransitioning) {
			const isToday = isSameDay(selectedDate, new Date())
			const targetIndex = isToday ? currentClassIndex : 0

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

	const openNotes = (subject: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setSelectedNoteSubject(subject)
		setIsNotesModalOpen(true)
	}

	const handleAddDeadline = () => {
		if (!newDeadlineTitle || !newDeadlineDate) {
			showToast('Uzupełnij nazwę i datę', 'error')
			return
		}

		// Validate date is not in the past
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		const selectedDateObj = new Date(newDeadlineDate)
		selectedDateObj.setHours(0, 0, 0, 0)

		if (selectedDateObj.getTime() < today.getTime()) {
			showToast('Nie można dodać deadline w przeszłości', 'error')
			return
		}

		const newDeadline: Deadline = {
			id: Date.now().toString(),
			title: newDeadlineTitle,
			date: newDeadlineDate,
			description: newDeadlineDescription.trim() || undefined,
		}

		const updated = [...deadlines, newDeadline].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		setDeadlines(updated)
		localStorage.setItem('user-deadlines', JSON.stringify(updated))

		setNewDeadlineTitle('')
		setNewDeadlineDate('')
		setNewDeadlineDescription('')
		setIsDeadlineModalOpen(false)
		showToast('Dodano deadline')

		// Schedule notification
		import('@/services/notificationService').then(({ scheduleManualDeadline }) => {
			scheduleManualDeadline(newDeadline.id, newDeadline.title, newDeadline.date, newDeadline.description)
		})
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
			localStorage.setItem('user-deadlines-archive', JSON.stringify(updatedArchive))
			showToast('Przeniesiono do archiwum')

			// Cancel notification
			import('@/services/notificationService').then(({ cancelDeadlineNotification }) => {
				cancelDeadlineNotification(itemToArchive.id)
			})
		}

		setConfirmDialog({ isOpen: false, title: '', message: '' })
	}

	const deleteFromArchive = (id: string) => {
		const updated = archivedDeadlines.filter(d => d.id !== id)
		setArchivedDeadlines(updated)
		localStorage.setItem('user-deadlines-archive', JSON.stringify(updated))
	}

	const getDeadlineColor = (dateStr: string) => {
		const target = new Date(dateStr)
		target.setHours(0, 0, 0, 0)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const diffTime = target.getTime() - today.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays < 0) return 'bg-slate-500/10 text-muted border-slate-500/20'
		if (diffDays <= 3) return 'bg-red-500/10 text-red-500 border-red-500/20'
		if (diffDays <= 7) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
		return 'bg-green-500/10 text-green-500 border-green-500/20'
	}

	const getDaysLeft = (dateStr: string) => {
		const target = new Date(dateStr)
		target.setHours(0, 0, 0, 0)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const diffTime = target.getTime() - today.getTime()
		const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays < 0) return 'Po terminie'
		if (diffDays === 0) return 'Dziś'
		if (diffDays === 1) return 'Jutro'
		return `${diffDays} dni`
	}

	const getClassColor = (type: string) => {
		const t = type.toLowerCase()
		if (t.includes('wykład')) return 'border-lecture/30 shadow-lecture/10'
		if (t.includes('lab')) return 'border-lab/30 shadow-lab/10'
		if (t.includes('proj')) return 'border-project/30 shadow-project/10'
		if (t.includes('sem')) return 'border-seminar/30 shadow-seminar/10'
		return 'border-border/50'
	}

	const getClassBadgeColor = (type: string) => {
		return 'text-white/90 bg-white/10 border-white/20'
	}

	const isTodayView = isSameDay(selectedDate, new Date())
	const dateInputValue = selectedDate.toISOString().split('T')[0]

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
			{/* Refresh Indicator */}
			{/* Refresh Indicator */}
			<div
				className={`flex justify-center overflow-hidden transition-all duration-300 ease-in-out ${isRefreshing ? 'max-h-12 py-2 opacity-100' : 'max-h-0 py-0 opacity-0'
					}`}>
				<RefreshCw className="animate-spin text-primary" size={20} />
			</div>

			{/* --- Header --- */}
			<div className="px-1 flex items-start justify-between">
				<div>
					<h2 className="text-3xl font-display font-bold text-primary tracking-tight">{getDayTitle()}</h2>
					<span className="text-xs font-medium text-muted block mt-0.5">
						{selectedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
					</span>
				</div>
				<div
					className={`px-3 py-1.5 rounded-full text-xs font-bold ${timeRange
						? 'bg-primary/10 text-primary border border-primary/20'
						: 'bg-muted/10 text-muted border border-muted/20'
						}`}>
					{timeRange ? `${timeRange.start} - ${timeRange.end}` : 'Brak zajęć'}
				</div>
			</div>

			{/* --- Carousel --- */}
			<section className="-mx-5 h-[280px] flex items-center">
				<div
					className={`w-full transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
					key={selectedDate.toISOString()}>
					{isDemo ? (
						<div className="flex flex-col items-center justify-center py-8 my-6 px-4 text-center border-2 border-dashed border-border rounded-3xl mx-auto max-w-[90vw] bg-surface/30 w-full relative overflow-hidden">
							<div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20 bg-primary blur-3xl"></div>
							<div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full pointer-events-none opacity-20 bg-primary blur-3xl"></div>

							<h3 className="text-xl font-bold text-main mb-2 relative z-10">Nie masz jeszcze wybranej grupy</h3>
							<p className="text-sm text-muted mb-6 max-w-[280px] relative z-10">
								Wybierz swoją grupę zajęciową, aby zobaczyć plan zajęć i korzystać z pełni funkcji aplikacji.
							</p>
							<button
								onClick={() => setIsGroupSelectorOpen(true)}
								className="bg-primary text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform relative z-10">
								Wybierz grupę
							</button>
						</div>
					) : todaysEvents.length === 0 ? (
						<div className="flex items-center justify-center w-full h-full">
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
									const isActive = idx === activeIndex
									const isCurrentClass = isTodayView && idx === currentClassIndex
									const isPast = isTodayView && idx < currentClassIndex
									const semanticBorder = getClassColor(evt.type)
									const badgeStyle = getClassBadgeColor(evt.type)

									let isPendingStart = false
									let isRunning = false

									if (isCurrentClass) {
										const now = getCurrentTimeMinutes()
										// Re-check detailed status for UI labels
										const start = getMinutesFromMidnight(evt.startTime)
										const end = getMinutesFromMidnight(evt.endTime)
										if (now < start) isPendingStart = true
										if (now >= start && now < end) isRunning = true
									}

									return (
										<SwiperSlide key={evt.id} style={{ width: '78vw', maxWidth: '340px' }}>
											<div className="w-full px-1 mb-2">
												<div
													className={clsx(
														"bg-surface rounded-2xl p-5 border transition-all duration-300 flex flex-col relative overflow-hidden shadow-lg",
														isActive ? `shadow-2xl ${semanticBorder}` : 'border-border/50 shadow-md'
													)}>
													<div
														className={`absolute -top-10 -right-10 w-32 h-32 bg-primary rounded-full pointer-events-none transition-opacity duration-300 blur-2xl ${isActive ? 'opacity-20' : 'opacity-5'
															}`}></div>

													{isTodayView && (
														<div className="mb-3 flex justify-between items-center">
															<span
																className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${isRunning ? 'bg-primary text-black' : isPendingStart ? 'bg-blue-500/10 text-blue-400' : isPast ? 'bg-slate-500/10 text-muted' : 'bg-slate-500/10 text-muted'
																	}`}>
																{isRunning ? 'Teraz' : isPendingStart ? 'Wkrótce' : isPast ? 'Koniec' : idx > currentClassIndex ? 'Nadchodzące' : 'Zajęcia'}
															</span>

															{/* Countdown for current class */}
															{isCurrentClass && countdownString && (
																<span className="text-xs font-bold text-primary animate-pulse">
																	{isPendingStart ? 'Początek za ' : 'Koniec za '} {countdownString}
																</span>
															)}
														</div>
													)}

													<div className="flex items-start gap-2 mb-3">
														<h3
															className={`text-lg font-display font-bold leading-tight flex-1 ${isActive ? 'text-primary' : 'text-main'
																}`}>
															{evt.subject}
														</h3>
														<span
															className={clsx(
																"text-[10px] font-bold border px-2 py-1 rounded-md uppercase tracking-wide flex-shrink-0",
																badgeStyle
															)}>
															{evt.type}
														</span>
													</div>

													<div className="flex flex-col gap-1.5 text-sm text-muted mb-4">
														<div className="flex items-center gap-2">
															<MapPin size={13} className="opacity-70 flex-shrink-0" />
															<span className="text-xs">{evt.room}</span>
														</div>
														<div className="flex items-center gap-2">
															<User size={13} className="opacity-70 flex-shrink-0" />
															<span className="text-xs opacity-80 line-clamp-1">
																{isTeacherView ? (evt.groups?.join(', ') || 'Brak grupy') : evt.teacher}
															</span>
														</div>
													</div>

													{/* Actions Row */}
													<div className="flex gap-2 mb-3">
														<button
															onClick={(e) => openNotes(evt.subject, e)}
															className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface border border-border/50 text-xs font-medium hover:bg-hover active:scale-95 transition-all text-muted hover:text-primary"
														>
															<StickyNote size={12} />
															Notatki
														</button>
													</div>

													<div className="flex justify-between items-center text-xs font-medium text-muted mb-2">
														<span>{evt.startTime}</span>
														<span>{evt.endTime}</span>
													</div>

													{isCurrentClass && isRunning && (
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

								{isTodayView &&
									todaysEvents.length > 0 &&
									minutesNow > getMinutesFromMidnight(todaysEvents[todaysEvents.length - 1]?.endTime || '00:00') && (
										<SwiperSlide style={{ width: '78vw', maxWidth: '340px' }}>
											<div className="w-full px-1 mb-2">
												<div className="bg-surface rounded-2xl p-5 border border-green-500/20 transition-all duration-300 flex flex-col relative overflow-hidden shadow-lg">
													<div
														className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none opacity-20 blur-2xl"
														style={{ backgroundColor: 'rgb(34, 197, 94)' }}></div>

													<div className="mb-3">
														<span className="inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide bg-green-500/10 text-green-500">
															Koniec
														</span>
													</div>

													<div className="flex-1 flex flex-col justify-center items-center text-center py-6">
														<h3 className="text-xl font-display font-bold text-green-500 mb-2">Koniec zajęć na dziś</h3>
														<p className="text-sm text-muted">Wszystkie zajęcia zostały zakończone</p>
													</div>

													<div className="text-center text-xs text-muted mt-2">
														Ostatnie zajęcia: {todaysEvents[todaysEvents.length - 1]?.endTime}
													</div>
												</div>
											</div>
										</SwiperSlide>
									)}
							</Swiper>

							{todaysEvents.length > 1 && (
								<div className="flex justify-center gap-2 mt-8">
									{todaysEvents.map((_, idx) => (
										<button
											key={idx}
											onClick={() => swiperRef.current?.slideTo(idx)}
											className={`transition-all duration-300 rounded-full ${idx === activeIndex ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-slate-500/50 hover:bg-primary/50'
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

			{/* Day Navigator */}
			{!isDemo && (
				<div className="flex items-center gap-3 px-1 mt-10">
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
					<div className="flex gap-2">
						<button
							onClick={() => setIsAllDeadlinesOpen(true)}
							className="flex items-center gap-2 text-[10px] font-bold text-muted bg-surface px-3 py-1.5 rounded-full border border-border hover:bg-hover transition-colors">
							<Grid size={12} />
							<span>WSZYSTKIE</span>
						</button>
						<button
							onClick={() => setIsArchiveOpen(true)}
							className="flex items-center gap-2 text-[10px] font-bold text-muted bg-surface px-3 py-1.5 rounded-full border border-border hover:bg-hover transition-colors">
							<Archive size={12} />
							<span>ARCHIWUM</span>
						</button>
					</div>
				</div>

				<div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
					{deadlines.map(dl => {
						const colorClass = getDeadlineColor(dl.date)
						return (
							<div
								key={dl.id}
								onClick={() => setSelectedDeadline(dl)}
								className={`shrink-0 w-32 aspect-square rounded-2xl p-3 flex flex-col justify-between border ${colorClass} relative group transition-transform active:scale-95 overflow-hidden cursor-pointer`}>
								<div
									className="absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 pointer-events-none opacity-10"
									style={{ backgroundColor: 'currentColor' }}></div>

								<div className="flex justify-between items-start relative z-10">
									<span className="text-[10px] font-bold uppercase opacity-70">
										{new Date(dl.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
									</span>
								</div>
								<div className="relative z-10">
									<h4 className="font-bold text-sm leading-tight line-clamp-1 mb-0.5">{dl.title}</h4>
									{dl.description && (
										<p className="text-[9px] opacity-60 line-clamp-1 mb-0.5">{dl.description}</p>
									)}
									<p className="text-[10px] font-medium opacity-80">{getDaysLeft(dl.date)}</p>
								</div>

								<button
									onClick={e => {
										e.stopPropagation()
										initiateDeleteDeadline(dl.id)
									}}
									className="absolute bottom-2 right-2 p-2 text-current opacity-70 hover:opacity-100 hover:scale-110 transition-all rounded-full hover:bg-background/10 z-10">
									<Trash2 size={16} />
								</button>
							</div>
						)
					})}

					<button
						onClick={() => setIsDeadlineModalOpen(true)}
						className="shrink-0 w-32 aspect-square rounded-2xl bg-surface border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 text-muted hover:text-primary transition-all group relative overflow-hidden">
						<div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:scale-110 transition-all relative z-10">
							<Plus size={20} />
						</div>
						<span className="text-xs font-bold relative z-10">Dodaj</span>
					</button>
				</div>
			</section>

			{/* --- Widgets Section (Replaces Shortcuts) --- */}
			<section className="space-y-6">
				<div className="flex items-center justify-between px-1">
					<h3 className="text-lg font-display font-bold text-main">Na skróty</h3>
					<div className="w-8 h-1 bg-primary/20 rounded-full"></div>
				</div>

				<div className="grid grid-cols-2 gap-3 h-40">
					{/* Campus Map Widget */}
					<div className="col-span-1 h-full">
						<CampusMapWidget />
					</div>

					{/* Deans Office Widget (Replaces Calculator) */}
					<div className="col-span-1 h-full">
						<DeansOfficeWidget onClick={() => setIsDeansOfficeModalOpen(true)} />
					</div>
				</div>

				{/* Useful Links Section */}
				<div className="h-64">
					<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col">
						{/* Decorative blob */}
						<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

						<div className="flex items-center justify-between mb-4 relative z-10">
							<div className="flex items-center gap-2">
								<div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
									<ExternalLink size={14} />
								</div>
								<h4 className="text-xs font-bold text-muted uppercase tracking-wide">Przydatne linki</h4>
							</div>
						</div>

						<div className="space-y-3 relative z-10 flex-1">
							<a href="https://usosweb.ubb.edu.pl/" target="_blank" rel="noopener noreferrer"
								className="flex items-start gap-3 p-2 -mx-2 rounded-lg active:bg-hover/50">
								<div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500"></div>
								<div className="flex-1 min-w-0">
									<h5 className="text-sm font-bold text-main leading-tight truncate">USOS Web</h5>
									<p className="text-[10px] text-muted mt-0.5">System obsługi studiów</p>
								</div>
								<ChevronRight size={14} className="text-muted mt-1" />
							</a>
							<a href="https://plany.ubb.edu.pl/" target="_blank" rel="noopener noreferrer"
								className="flex items-start gap-3 p-2 -mx-2 rounded-lg active:bg-hover/50">
								<div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-green-500"></div>
								<div className="flex-1 min-w-0">
									<h5 className="text-sm font-bold text-main leading-tight truncate">Plany zajęć</h5>
									<p className="text-[10px] text-muted mt-0.5">Oficjalne plany UBB</p>
								</div>
								<ChevronRight size={14} className="text-muted mt-1" />
							</a>
							<a href="https://ubb.edu.pl/" target="_blank" rel="noopener noreferrer"
								className="flex items-start gap-3 p-2 -mx-2 rounded-lg active:bg-hover/50">
								<div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary"></div>
								<div className="flex-1 min-w-0">
									<h5 className="text-sm font-bold text-main leading-tight truncate">Strona uczelni</h5>
									<p className="text-[10px] text-muted mt-0.5">ubb.edu.pl</p>
								</div>
								<ChevronRight size={14} className="text-muted mt-1" />
							</a>
						</div>
					</div>
				</div>
			</section>

			{/* --- Modals --- */}

			{/* Add Deadline Modal */}
			<Modal
				isOpen={isDeadlineModalOpen}
				onClose={() => setIsDeadlineModalOpen(false)}
				title="Nowy Deadline"
			>
				<div className="space-y-4">
					<div className="p-6 space-y-6">
						<div>
							<label className="text-xs font-bold text-white/60 uppercase ml-1 mb-2 block">Nazwa</label>
							<input
								type="text"
								value={newDeadlineTitle}
								onChange={e => setNewDeadlineTitle(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-colors"
								placeholder="np. Projekt z Javy"
								autoFocus
							/>
						</div>
						<div>
							<label className="text-xs font-bold text-white/60 uppercase ml-1 mb-2 block">Data</label>
							<div className="relative cursor-pointer" onClick={() => deadlineInputRef.current?.showPicker()}>
								<div className="absolute top-4 right-4 text-white pointer-events-none opacity-60">
									<Calendar size={20} />
								</div>
								<input
									ref={deadlineInputRef}
									type="date"
									value={newDeadlineDate}
									onChange={e => setNewDeadlineDate(e.target.value)}
									min={new Date().toISOString().split('T')[0]}
									className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-primary/50 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0"
								/>
							</div>
						</div>
						<div>
							<label className="text-xs font-bold text-white/60 uppercase ml-1 mb-2 block">Opis (opcjonalnie)</label>
							<textarea
								value={newDeadlineDescription}
								onChange={e => setNewDeadlineDescription(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 outline-none focus:border-primary/50 transition-colors resize-none"
								placeholder="Dodatkowe informacje..."
								rows={3}
							/>
						</div>
						<button
							onClick={handleAddDeadline}
							className="w-full py-4 bg-primary text-black rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all"
						>
							Dodaj deadline
						</button>
					</div>
				</div>
			</Modal>

			{/* All Deadlines Modal (Grid View) */}
			<Modal
				isOpen={isAllDeadlinesOpen}
				onClose={() => setIsAllDeadlinesOpen(false)}
			>
				<div className="grid grid-cols-2 gap-3 px-6 pb-6 pt-2">
					{deadlines.map(dl => {
						const colorClass = getDeadlineColor(dl.date)
						return (
							<div
								key={dl.id}
								className={`aspect-square rounded-2xl p-4 flex flex-col justify-between border relative group overflow-hidden transition-all ${colorClass} hover:opacity-90`}
							>
								<div
									className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-10 -mt-10 pointer-events-none opacity-20"
									style={{ backgroundColor: 'currentColor' }}></div>

								<div className="flex justify-between items-start relative z-10">
									<span className="text-xs font-bold uppercase opacity-80 tracking-wide">
										{new Date(dl.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
									</span>
								</div>
								<div className="relative z-10">
									<h4 className="font-bold text-sm leading-tight line-clamp-3 mb-1.5">{dl.title}</h4>
									<p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{getDaysLeft(dl.date)}</p>
								</div>

								<button
									onClick={e => {
										e.stopPropagation()
										initiateDeleteDeadline(dl.id)
									}}
									className="absolute bottom-3 right-3 p-2 text-current opacity-60 hover:opacity-100 hover:scale-110 transition-all rounded-full hover:bg-black/10 z-20">
									<Trash2 size={16} />
								</button>
							</div>
						)
					})}

					<button
						onClick={() => {
							setIsAllDeadlinesOpen(false)
							setIsDeadlineModalOpen(true)
						}}
						className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-3 text-muted hover:text-primary transition-all group">
						<div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:scale-110 transition-all shadow-lg">
							<Plus size={24} />
						</div>
						<span className="text-xs font-bold uppercase tracking-wider">Dodaj</span>
					</button>
				</div>
			</Modal>

			{/* Deadline Detail Modal */}
			<Modal
				isOpen={!!selectedDeadline}
				onClose={() => setSelectedDeadline(null)}
				title="Szczegóły"
			>
				{selectedDeadline && (
					<div className="space-y-4">
						<div className={`p-4 rounded-xl border ${getDeadlineColor(selectedDeadline.date)}`}>
							<div className="flex justify-between items-start mb-2">
								<span className="text-xs font-bold uppercase opacity-70">
									{new Date(selectedDeadline.date).toLocaleDateString('pl-PL', {
										weekday: 'long',
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})}
								</span>
								<span className="text-xs font-bold">{getDaysLeft(selectedDeadline.date)}</span>
							</div>
							<h3 className="text-lg font-bold mb-2">{selectedDeadline.title}</h3>
							{selectedDeadline.description && (
								<p className="text-sm opacity-80 whitespace-pre-wrap">{selectedDeadline.description}</p>
							)}
						</div>
						<button
							onClick={() => {
								initiateDeleteDeadline(selectedDeadline.id)
								setSelectedDeadline(null)
							}}
							className="w-full flex items-center justify-center gap-2 bg-surface border border-border text-muted font-bold py-3 rounded-xl hover:bg-hover transition-colors">
							<Archive size={18} />
							<span>Archiwizuj</span>
						</button>
					</div>
				)}
			</Modal>

			{/* Archive Modal */}
			<Modal
				isOpen={isArchiveOpen}
				onClose={() => setIsArchiveOpen(false)}
				title="Archiwum"
			>
				<div className="space-y-3">
					{archivedDeadlines.length === 0 ? (
						<p className="text-center text-muted text-sm py-8">Brak zarchiwizowanych zadań</p>
					) : (
						archivedDeadlines.map(dl => (
							<div key={dl.id} className="bg-background p-4 rounded-xl border border-border flex items-center justify-between group">
								<div>
									<h4 className="font-bold text-main text-sm line-through opacity-70">{dl.title}</h4>
									<p className="text-[10px] text-muted">{dl.date}</p>
								</div>
								<div className="flex gap-2">
									<button
										onClick={() => deleteFromArchive(dl.id)}
										className="p-2 text-muted active:text-red-500 active:bg-red-500/10 rounded-lg transition-colors"
										title="Usuń trwale">
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</Modal>

			{/* Confirm Dialog */}
			{confirmDialog.isOpen && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
									onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
									className="py-2.5 rounded-xl border border-border text-main font-bold text-sm hover:bg-hover transition-colors">
									Anuluj
								</button>
								<button
									onClick={confirmDelete}
									className="py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
									Potwierdź
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Toast */}
			{toast.show && createPortal(
				<div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down w-auto">
					<div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-surface border-green-500/30 text-green-500' : 'bg-surface border-red-500/30 text-red-500'}`}>
						{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
						<span className="text-sm font-bold">{toast.message}</span>
					</div>
				</div>,
				document.body
			)}

			<NotesModal
				isOpen={isNotesModalOpen}
				onClose={() => setIsNotesModalOpen(false)}
				subjectName={selectedNoteSubject}
			/>

			{/* Deans Office Modal */}
			<DeansOfficeModal
				isOpen={isDeansOfficeModalOpen}
				onClose={() => setIsDeansOfficeModalOpen(false)}
			/>

			<GroupSelectorModal
				isOpen={isGroupSelectorOpen}
				onClose={() => setIsGroupSelectorOpen(false)}
				onGroupSelected={() => window.location.reload()}
			/>
		</div>
	)
}

export default Home
