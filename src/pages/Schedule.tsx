import React, { useState, useEffect } from 'react'
import { ClassEvent } from '@/types'
import { addDays } from '@/lib/utils'
import OfflineBadge from '@/components/ui/OfflineBadge'
import { fetchScheduleForWeek } from '@/services/scheduleService'
import { getSelectedGroup } from '@/services/groupService'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import ScheduleViewer from '@/components/features/ScheduleViewer'

const SchedulePage: React.FC = () => {
	const [events, setEvents] = useState<ClassEvent[]>([])
	const [currentWeekId, setCurrentWeekId] = useState<string | null>(null)
	const [availableWeeks, setAvailableWeeks] = useState<Array<{ id: string; label: string; start: Date; end: Date }>>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const isOnline = useOnlineStatus()
	
	// Get current week data
	const currentWeek = availableWeeks.find(w => w.id === currentWeekId)

	// Load available weeks on mount
	useEffect(() => {
		const loadWeeks = async () => {
			const selectedGroup = await getSelectedGroup()
			if (!selectedGroup) return

			const { getAvailableWeeks, getCurrentWeekId } = await import('@/services/scheduleService')
			const isTeacher = selectedGroup.type === 'teacher'
			const weeks = await getAvailableWeeks(selectedGroup.id, isTeacher)
			setAvailableWeeks(weeks)

			const currentId = await getCurrentWeekId(selectedGroup.id, isTeacher)
			if (currentId) {
				setCurrentWeekId(currentId)
			}
		}

		loadWeeks()
	}, [])

	// Load data for current week
	useEffect(() => {
		const loadSchedule = async () => {
			setIsLoading(true)
			setError(null)

			try {
				const selectedGroup = await getSelectedGroup()

				if (!selectedGroup) {
					setError(ERROR_MESSAGES.NO_GROUP_SELECTED)
					setEvents([])
					setIsLoading(false)
					return
				}

				// If no weekId, show empty (no classes)
				if (!currentWeekId) {
					setEvents([])
					setIsLoading(false)
					return
				}

				const isTeacher = selectedGroup.type === 'teacher'
				const scheduleData = await fetchScheduleForWeek(selectedGroup.id, currentWeekId, false, isTeacher)
				setEvents(scheduleData)
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.FETCH_FAILED
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
	}, [currentWeekId])

	const handlePrevWeek = () => {
		if (!currentWeekId || availableWeeks.length === 0) return
		
		const currentIndex = availableWeeks.findIndex(w => w.id === currentWeekId)
		if (currentIndex > 0) {
			setCurrentWeekId(availableWeeks[currentIndex - 1].id)
		} else {
			// No more weeks before - show empty
			setCurrentWeekId(null)
			setEvents([])
		}
	}

	const handleNextWeek = () => {
		if (availableWeeks.length === 0) return
		
		// If no current week, start from first
		if (!currentWeekId) {
			setCurrentWeekId(availableWeeks[0].id)
			return
		}
		
		const currentIndex = availableWeeks.findIndex(w => w.id === currentWeekId)
		if (currentIndex < availableWeeks.length - 1) {
			setCurrentWeekId(availableWeeks[currentIndex + 1].id)
		} else {
			// No more weeks after - show empty
			setCurrentWeekId(null)
			setEvents([])
		}
	}

	const handleDateSelect = (selected: Date) => {
		// Find week that contains this date
		const matchingWeek = availableWeeks.find(w => selected >= w.start && selected <= w.end)
		
		if (matchingWeek) {
			setCurrentWeekId(matchingWeek.id)
		}
	}

	return (
		<div className="space-y-6 animate-fade-in pt-6">
			{/* Offline Badge */}
			<OfflineBadge isVisible={!isOnline} />

			<ScheduleViewer
				events={events}
				currentWeek={currentWeek}
				availableWeeks={availableWeeks}
				isLoading={isLoading}
				error={error}
				onPrevWeek={handlePrevWeek}
				onNextWeek={handleNextWeek}
				onDateSelect={handleDateSelect}
			/>
		</div>
	)
}

export default SchedulePage
