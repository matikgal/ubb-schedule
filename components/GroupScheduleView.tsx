import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, GraduationCap, Calendar } from 'lucide-react'
import { ClassEvent, GroupInfo } from '../types'
import { fetchScheduleForWeek, getAvailableWeeks, getCurrentWeekId } from '../services/scheduleService'
import ScheduleViewer from './ScheduleViewer'

interface GroupScheduleViewProps {
	group: GroupInfo
	onBack: () => void
	allowNotes?: boolean
}

const GroupScheduleView: React.FC<GroupScheduleViewProps> = ({ group, onBack, allowNotes = true }) => {
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
			const weeks = await getAvailableWeeks(group.id, false)
			setAvailableWeeks(weeks)

			const currentId = await getCurrentWeekId(group.id, false)
			if (currentId) {
				setCurrentWeekId(currentId)
			}
		}

		loadWeeks()
	}, [group.id])

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

				const scheduleData = await fetchScheduleForWeek(group.id, currentWeekId, false, false)
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
	}, [currentWeekId, group.id])

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
			<div className="flex items-start gap-4">
				<button
					onClick={onBack}
					className="p-2 -ml-2 hover:bg-hover rounded-full transition-colors mt-1"
				>
					<ArrowLeft size={24} className="text-main" />
				</button>
				<div className="space-y-2">
					<div>
						<h1 className="text-2xl font-display font-bold text-main leading-tight">{group.name}</h1>
						<div className="flex items-center gap-2 text-sm text-muted mt-1">
							<GraduationCap size={16} />
							<span>{group.faculty}</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted mt-1">
							<Users size={16} />
							<span>{group.field} {group.studyType}</span>
						</div>
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
					allowNotes={allowNotes}
					header={
						<div className="flex items-center gap-2 mb-4">
							<Calendar size={20} className="text-primary" />
							<h2 className="text-lg font-bold text-main">Plan zajęć</h2>
						</div>
					}
				/>
			</div>
		</div>
	)
}

export default GroupScheduleView
