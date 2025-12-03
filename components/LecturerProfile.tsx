import React, { useState, useEffect } from 'react'
import { ArrowLeft, User, GraduationCap } from 'lucide-react'
import { ClassEvent } from '../types'
import { fetchScheduleForWeek, getAvailableWeeks, getCurrentWeekId } from '../services/scheduleService'
import ScheduleViewer from './ScheduleViewer'

interface LecturerProfileProps {
	teacherId: number
	teacherName: string
	faculty: string
	onBack: () => void
}

const LecturerProfile: React.FC<LecturerProfileProps> = ({ teacherId, teacherName, faculty, onBack }) => {
	const [events, setEvents] = useState<ClassEvent[]>([])
	const [currentWeekId, setCurrentWeekId] = useState<string | null>(null)
	const [availableWeeks, setAvailableWeeks] = useState<Array<{ id: string; label: string; start: Date; end: Date }>>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Get current week data
	const currentWeek = availableWeeks.find(w => w.id === currentWeekId)

	// Load available weeks on mount
	useEffect(() => {
		const loadWeeks = async () => {
			const weeks = await getAvailableWeeks(teacherId, true)
			setAvailableWeeks(weeks)

			const currentId = await getCurrentWeekId(teacherId, true)
			if (currentId) {
				setCurrentWeekId(currentId)
			}
		}

		loadWeeks()
	}, [teacherId])

	// Load data for current week
	useEffect(() => {
		const loadSchedule = async () => {
			setIsLoading(true)
			setError(null)

			try {
				if (!currentWeekId) {
					setEvents([])
					setIsLoading(false)
					return
				}

				const scheduleData = await fetchScheduleForWeek(teacherId, currentWeekId, false, true)
				setEvents(scheduleData)
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać planu'
				console.error('❌ Error loading schedule:', err)
				setError(errorMessage)
				setEvents([])
			} finally {
				setIsLoading(false)
			}
		}

		if (currentWeekId !== null) {
			loadSchedule()
		}
	}, [currentWeekId, teacherId])

	const handlePrevWeek = () => {
		if (!currentWeekId || availableWeeks.length === 0) return
		
		const currentIndex = availableWeeks.findIndex(w => w.id === currentWeekId)
		if (currentIndex > 0) {
			setCurrentWeekId(availableWeeks[currentIndex - 1].id)
		} else {
			setCurrentWeekId(null)
			setEvents([])
		}
	}

	const handleNextWeek = () => {
		if (availableWeeks.length === 0) return
		
		if (!currentWeekId) {
			setCurrentWeekId(availableWeeks[0].id)
			return
		}
		
		const currentIndex = availableWeeks.findIndex(w => w.id === currentWeekId)
		if (currentIndex < availableWeeks.length - 1) {
			setCurrentWeekId(availableWeeks[currentIndex + 1].id)
		} else {
			setCurrentWeekId(null)
			setEvents([])
		}
	}

	const handleDateSelect = (selected: Date) => {
		const matchingWeek = availableWeeks.find(w => selected >= w.start && selected <= w.end)
		if (matchingWeek) {
			setCurrentWeekId(matchingWeek.id)
		}
	}

	return (
		<div className="animate-fade-in space-y-6">
			{/* Header with Back Button */}
			<div className="flex items-center gap-4">
				<button 
					onClick={onBack}
					className="p-2 -ml-2 hover:bg-hover rounded-full transition-colors"
				>
					<ArrowLeft size={24} className="text-main" />
				</button>
				<div>
					<h1 className="text-2xl font-display font-bold text-main leading-tight">{teacherName}</h1>
					<div className="flex items-center gap-2 text-sm text-muted">
						<GraduationCap size={16} />
						<span>{faculty}</span>
					</div>
				</div>
			</div>

			{/* Schedule Preview */}
			<div className="border-t border-border pt-2">
				<ScheduleViewer
					events={events}
					currentWeek={currentWeek}
					availableWeeks={availableWeeks}
					isLoading={isLoading}
					error={error}
					onPrevWeek={handlePrevWeek}
					onNextWeek={handleNextWeek}
					onDateSelect={handleDateSelect}
					header={
						<div className="flex items-center gap-2 mb-4">
							<User size={20} className="text-primary" />
							<h2 className="text-lg font-bold text-main">Plan zajęć</h2>
						</div>
					}
				/>
			</div>
		</div>
	)
}

export default LecturerProfile
