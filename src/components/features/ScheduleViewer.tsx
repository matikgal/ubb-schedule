import React, { useState, useEffect, useRef } from 'react'
import { ClassEvent } from '@/types'
import { getDayName, addDays, isSameDay } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import ClassCard from './ClassCard'
import Toast from '@/components/ui/Toast'

interface ScheduleViewerProps {
	events: ClassEvent[]
	currentWeek: { id: string; label: string; start: Date; end: Date } | undefined
	availableWeeks: Array<{ id: string; label: string; start: Date; end: Date }>
	isLoading: boolean
	error: string | null
	onPrevWeek: () => void
	onNextWeek: () => void
	onDateSelect: (date: Date) => void
	header?: React.ReactNode
	allowNotes?: boolean
}

const ScheduleViewer: React.FC<ScheduleViewerProps> = ({
	events,
	currentWeek,
	availableWeeks,
	isLoading,
	error,
	onPrevWeek,
	onNextWeek,
	onDateSelect,
	header,
	allowNotes = true,
}) => {
	const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null)
	const [showToast, setShowToast] = useState(false)
	const datePickerRef = useRef<HTMLInputElement>(null)

	const currentWeekStart = currentWeek?.start || new Date()
	const todayDate = new Date()

	// Set initial expanded state (expand "Today" if in current week)
	useEffect(() => {
		if (!currentWeek) return

		const today = new Date()

		// Check if today is in current week
		if (today >= currentWeek.start && today <= currentWeek.end) {
			const todayDay = today.getDay()
			const dayIndex = todayDay === 0 ? 6 : todayDay - 1
			setExpandedDayIndex(dayIndex)
		} else {
			setExpandedDayIndex(null)
		}
	}, [currentWeek?.id])

	useEffect(() => {
		if (error) {
			setShowToast(true)
		}
	}, [error])

	const toggleDay = (index: number) => {
		if (expandedDayIndex === index) {
			setExpandedDayIndex(null)
		} else {
			setExpandedDayIndex(index)
		}
	}

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.value) {
			const selected = new Date(e.target.value)
			onDateSelect(selected)
		}
	}

	const openDatePicker = () => {
		if (datePickerRef.current) {
			if ('showPicker' in HTMLInputElement.prototype) {
				try {
					// @ts-ignore
					datePickerRef.current.showPicker()
				} catch (e) {
					datePickerRef.current.click()
				}
			} else {
				datePickerRef.current.click()
			}
		}
	}

	return (
		<div className="space-y-6 animate-fade-in pt-6">
			{header}

			<div className="flex items-end justify-between mb-2">
				{!header && (
					<div>
						<h1 className="text-3xl font-display font-bold text-main leading-tight">Kalendarz</h1>
						<p className="text-muted text-sm">Przegląd tygodniowy</p>
					</div>
				)}
				{header && <div />} {/* Spacer if header is present but custom */}

				<div className="relative ml-auto">
					<button
						onClick={openDatePicker}
						className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-border text-muted hover:text-primary transition-colors hover:bg-hover active:scale-95">
						<Calendar size={18} />
					</button>
					{/* Hidden Date Input */}
					<input
						ref={datePickerRef}
						type="date"
						onChange={handleDateChange}
						className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
					/>
				</div>
			</div>

			{/* Week Info with Navigation */}
			<div className="flex items-center justify-between mb-6 bg-surface border border-border rounded-2xl p-2">
				<button
					onClick={onPrevWeek}
					className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!currentWeek || availableWeeks.findIndex(w => w.id === currentWeek.id) <= 0}>
					<ChevronLeft size={20} />
				</button>

				<div className="text-center">
					<div className="text-xs font-bold text-muted uppercase tracking-wide mb-0.5">Tydzień</div>
					<div className="text-main font-display font-bold text-base">
						{currentWeek ? currentWeek.label : 'Brak zajęć'}
					</div>
					{isLoading && <div className="mt-1 mx-auto w-12 h-0.5 bg-primary rounded-full animate-pulse" />}
				</div>

				<button
					onClick={onNextWeek}
					className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-hover text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={!currentWeek || availableWeeks.findIndex(w => w.id === currentWeek.id) >= availableWeeks.length - 1}>
					<ChevronRight size={20} />
				</button>
			</div>

			{/* Loading State - Skeleton Screens */}
			{isLoading && (
				<div className="space-y-3 animate-fade-in">
					{[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
						// Show expanded skeleton for "today" (index 2 for Wednesday as example)
						const isExpandedSkeleton = dayOffset === 2

						return (
							<div
								key={dayOffset}
								className={`rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-300`}
								style={{ animationDelay: `${dayOffset * 50}ms` }}>
								<div className="p-4">
									<div className="flex items-center gap-4">
										{/* Day Badge Skeleton */}
										<div className="w-10 h-10 rounded-xl skeleton-shimmer" />

										{/* Day Info Skeleton */}
										<div className="flex-1 space-y-2">
											<div className="h-4 skeleton-shimmer rounded w-24" />
											<div className="h-3 skeleton-shimmer rounded w-16" />
										</div>

										{/* Chevron Skeleton */}
										<div className="w-5 h-5 rounded skeleton-shimmer" />
									</div>
								</div>

								{/* Expanded Content Skeleton */}
								{isExpandedSkeleton && (
									<div className="px-4 pb-4 space-y-3 animate-slide-down">
										<div className="h-[1px] w-full bg-border mb-4"></div>
										{[1, 2, 3].map(classIdx => (
											<div key={classIdx} className="p-4 rounded-xl bg-hover/50 space-y-3">
												{/* Time skeleton */}
												<div className="h-3 skeleton-shimmer rounded w-20" />
												{/* Subject skeleton */}
												<div className="h-5 skeleton-shimmer rounded w-3/4" />
												{/* Details skeleton */}
												<div className="flex gap-2">
													<div className="h-3 skeleton-shimmer rounded w-16" />
													<div className="h-3 skeleton-shimmer rounded w-24" />
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Toast Notification */}
			{showToast && error && !isLoading && (
				<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
					<Toast message={error} type="error" onClose={() => setShowToast(false)} duration={5000} />
				</div>
			)}

			{/* Days List (Accordion) */}
			{!isLoading && !error && (
				<div className="space-y-3 animate-fade-in">
					{[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
						const currentDate = addDays(currentWeekStart, dayOffset)
						// Convert loop index (0=Mon) to API format (1=Mon... 7=Sun)
						const apiDayOfWeek = dayOffset + 1

						const dayEvents = events
							.filter(e => e.dayOfWeek === apiDayOfWeek)
							.sort((a, b) => a.startTime.localeCompare(b.startTime))

						const isExpanded = expandedDayIndex === dayOffset
						const isToday = isSameDay(currentDate, todayDate)
						const hasClasses = dayEvents.length > 0

						// Helper function to check if we're currently in a class or break
						const getCurrentStatus = () => {
							if (!isToday || !hasClasses) return null

							const now = new Date()
							const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
								2,
								'0'
							)}`

							// Check if currently in a class
							const currentClass = dayEvents.find(evt => evt.startTime <= currentTime && evt.endTime > currentTime)
							if (currentClass) return { type: 'in-class', event: currentClass }

							// Check for next class
							const nextClass = dayEvents.find(evt => evt.startTime > currentTime)
							if (nextClass) {
								// Calculate time until next class
								const [nextHour, nextMin] = nextClass.startTime.split(':').map(Number)
								const nextTime = new Date(now)
								nextTime.setHours(nextHour, nextMin, 0)
								const diffMs = nextTime.getTime() - now.getTime()
								const diffMins = Math.floor(diffMs / 60000)

								return { type: 'break', event: nextClass, minutesUntil: diffMins }
							}

							// All classes finished for today
							return { type: 'finished' }
						}

						const status = getCurrentStatus()

						return (
							<div
								key={dayOffset}
								className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'bg-surface border-border' : 'bg-transparent border-transparent'
									}`}>
								{/* Accordion Header */}
								<button
									onClick={() => toggleDay(dayOffset)}
									className={`w-full flex items-center justify-between p-4 transition-colors ${!isExpanded && 'hover:bg-hover rounded-2xl'
										}`}>
									<div className="flex items-center gap-4">
										<div
											className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl border ${isToday ? 'bg-primary text-black border-primary' : 'bg-surface border-border text-muted'
												}`}>
											<span className="text-[10px] font-bold uppercase leading-none">
												{getDayName(apiDayOfWeek === 7 ? 0 : apiDayOfWeek).substring(0, 3)}
											</span>
											<span className="text-sm font-bold leading-none mt-0.5">{currentDate.getDate()}</span>
										</div>
										<div className="text-left">
											<div className={`font-bold text-sm ${isToday ? 'text-primary' : 'text-main'}`}>
												{getDayName(apiDayOfWeek === 7 ? 0 : apiDayOfWeek)}
											</div>
											<div className="text-xs text-muted font-medium">
												{hasClasses ? `${dayEvents.length} zajęć` : 'Wolne'}
											</div>
										</div>
									</div>

									{isExpanded ? (
										<ChevronUp size={18} className="text-muted" />
									) : (
										<ChevronDown size={18} className="text-muted" />
									)}
								</button>

								{/* Accordion Content */}
								{isExpanded && (
									<div className="px-4 pb-4 animate-slide-down">
										<div className="h-[1px] w-full bg-border mb-4 mx-2"></div>

										{/* Status Card - only show if today and no current class */}
										{isToday && status && status.type !== 'in-class' && (
											<div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
												{status.type === 'break' && status.event && (
													<>
														<div className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
															Następne zajęcia za {status.minutesUntil} min
														</div>
														<div className="text-sm font-bold text-main mb-1">{status.event.subject}</div>
														<div className="text-xs text-muted">
															{status.event.startTime} - {status.event.endTime} • {status.event.room}
														</div>
													</>
												)}
												{status.type === 'finished' && (
													<>
														<div className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Dzisiaj</div>
														<div className="text-sm font-bold text-main">Brak więcej zajęć</div>
													</>
												)}
											</div>
										)}

										{/* No classes today */}
										{isToday && !hasClasses && (
											<div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
												<div className="text-xs font-bold text-green-500 uppercase tracking-wide mb-1">Dzisiaj</div>
												<div className="text-sm font-bold text-main">Brak zajęć</div>
											</div>
										)}

										{hasClasses ? (
											<div className="space-y-0">
												{dayEvents.map((evt, idx) => (
													<ClassCard
														key={evt.id}
														event={evt}
														isLast={idx === dayEvents.length - 1}
														allowNotes={allowNotes}
													/>
												))}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center py-8 text-muted opacity-60 animate-fade-in">
												<Clock size={24} className="mb-2" />
												<p className="text-xs font-medium">Brak zaplanowanych zajęć</p>
											</div>
										)}
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}

			{/* Bottom Spacer for Nav */}
			<div className="h-12"></div>
		</div>
	)
}

export default ScheduleViewer
