import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'
import { fetchFaculties, fetchMajorsForFaculty, fetchGroupsForMajor, saveSelectedGroup } from '../services/groupService'
import { GroupInfo } from '../types'

interface GroupSelectorModalProps {
	isOpen: boolean
	onClose: () => void
	onGroupSelected: () => void
}

type Step = 'faculty' | 'major' | 'studyType' | 'semester' | 'group'

const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({ isOpen, onClose, onGroupSelected }) => {
	const [currentStep, setCurrentStep] = useState<Step>('faculty')

	// Selections
	const [selectedFaculty, setSelectedFaculty] = useState<string>('')
	const [selectedMajor, setSelectedMajor] = useState<string>('')
	const [selectedStudyType, setSelectedStudyType] = useState<string>('')
	const [selectedSemester, setSelectedSemester] = useState<number | null>(null)
	const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)

	// Data
	const [faculties, setFaculties] = useState<string[]>([])
	const [majors, setMajors] = useState<string[]>([])
	const [groups, setGroups] = useState<GroupInfo[]>([])

	// Loading
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')

	const studyTypes = [
		{ label: 'Stacjonarne', value: 'S' },
		{ label: 'Zaoczne', value: 'NW' },
	]

	const semesters = [1, 2, 3, 4, 5, 6, 7]

	// Block body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	// Load faculties on mount
	useEffect(() => {
		if (isOpen && currentStep === 'faculty') {
			loadFaculties()
		}
	}, [isOpen, currentStep])

	const loadFaculties = async () => {
		setLoading(true)
		setError('')
		try {
			const data = await fetchFaculties()
			setFaculties(data)
		} catch (err) {
			setError('Nie udało się pobrać wydziałów')
		} finally {
			setLoading(false)
		}
	}

	const handleFacultySelect = async (faculty: string) => {
		setSelectedFaculty(faculty)
		setLoading(true)
		setError('')
		try {
			const data = await fetchMajorsForFaculty(faculty)
			setMajors(data)
			setCurrentStep('major')
		} catch (err) {
			setError('Nie udało się pobrać kierunków')
		} finally {
			setLoading(false)
		}
	}

	const handleMajorSelect = (major: string) => {
		setSelectedMajor(major)
		setCurrentStep('studyType')
	}

	const handleStudyTypeSelect = (studyType: string) => {
		setSelectedStudyType(studyType)
		setCurrentStep('semester')
	}

	const handleSemesterSelect = async (semester: number) => {
		setSelectedSemester(semester)
		setLoading(true)
		setError('')
		try {
			const data = await fetchGroupsForMajor(selectedFaculty, selectedMajor, selectedStudyType, semester)
			setGroups(data)
			setCurrentStep('group')
		} catch (err) {
			setError('Nie udało się pobrać grup')
		} finally {
			setLoading(false)
		}
	}

	const handleGroupSelect = async (group: GroupInfo) => {
		setSelectedGroup(group)
		try {
			await saveSelectedGroup(group)

			// Force refresh schedule data for the new group
			const { fetchScheduleForWeek } = await import('../services/scheduleService')
			await fetchScheduleForWeek(group.id, undefined, true)

			onGroupSelected()
			onClose()
		} catch (err) {
			setError('Nie udało się zapisać grupy')
		}
	}

	const handleBack = () => {
		const steps: Step[] = ['faculty', 'major', 'studyType', 'semester', 'group']
		const currentIndex = steps.indexOf(currentStep)
		if (currentIndex > 0) {
			setCurrentStep(steps[currentIndex - 1])
		}
	}

	const getStepTitle = () => {
		switch (currentStep) {
			case 'faculty':
				return 'Wybierz wydział'
			case 'major':
				return 'Wybierz kierunek'
			case 'studyType':
				return 'Tryb studiów'
			case 'semester':
				return 'Wybierz semestr'
			case 'group':
				return 'Wybierz grupę'
		}
	}

	const getStepNumber = () => {
		const steps: Step[] = ['faculty', 'major', 'studyType', 'semester', 'group']
		return steps.indexOf(currentStep) + 1
	}

	if (!isOpen) return null

	return (
		<div
			className="fixed inset-0 z-[70] flex items-center justify-center px-3 pointer-events-none"
			style={{
				paddingTop: 'calc(3rem + env(safe-area-inset-top))',
				paddingBottom: 'calc(2rem + 5rem + env(safe-area-inset-bottom))',
			}}>
			<div
				className="bg-surface border border-border rounded-3xl w-full max-w-md animate-slide-up flex flex-col pointer-events-auto"
				style={{
					height: '70vh',
					maxHeight: '600px',
					minHeight: '400px',
					boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
				}}>
				{/* Header */}
				<div className="p-6 border-b border-border flex-shrink-0">
					<div className="flex justify-between items-center mb-4">
						<div className="flex items-center gap-3">
							{currentStep !== 'faculty' && (
								<button onClick={handleBack} className="p-2 hover:bg-hover rounded-lg transition-colors">
									<ChevronRight size={20} className="text-muted rotate-180" />
								</button>
							)}
							<div>
								<h3 className="font-display font-bold text-lg text-main">{getStepTitle()}</h3>
								<p className="text-xs text-muted">Krok {getStepNumber()} z 5</p>
							</div>
						</div>
						<button onClick={onClose} className="p-2 hover:bg-hover rounded-lg transition-colors">
							<X size={20} className="text-muted" />
						</button>
					</div>

					{/* Progress bar */}
					<div className="h-1 w-full bg-background rounded-full overflow-hidden">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${(getStepNumber() / 5) * 100}%` }}></div>
					</div>
				</div>

				{/* Content - scrollable */}
				<div className="flex-1 overflow-y-auto p-6 overscroll-contain">
					{error && (
						<div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
							{error}
						</div>
					)}

					{loading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4].map(i => (
								<div key={i} className="h-14 rounded-xl skeleton-shimmer" style={{ animationDelay: `${i * 100}ms` }} />
							))}
						</div>
					) : (
						<div className="space-y-2">
							{/* Faculty */}
							{currentStep === 'faculty' &&
								faculties.map(faculty => (
									<button
										key={faculty}
										onClick={() => handleFacultySelect(faculty)}
										className="w-full p-4 bg-background hover:bg-hover border border-border rounded-xl text-left transition-all group flex items-center justify-between">
										<span className="text-main font-medium">{faculty}</span>
										<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
									</button>
								))}

							{/* Major */}
							{currentStep === 'major' &&
								majors.map(major => (
									<button
										key={major}
										onClick={() => handleMajorSelect(major)}
										className="w-full p-4 bg-background hover:bg-hover border border-border rounded-xl text-left transition-all group flex items-center justify-between">
										<span className="text-main font-medium">{major}</span>
										<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
									</button>
								))}

							{/* Study Type */}
							{currentStep === 'studyType' &&
								studyTypes.map(type => (
									<button
										key={type.value}
										onClick={() => handleStudyTypeSelect(type.value)}
										className="w-full p-4 bg-background hover:bg-hover border border-border rounded-xl text-left transition-all group flex items-center justify-between">
										<span className="text-main font-medium">{type.label}</span>
										<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
									</button>
								))}

							{/* Semester */}
							{currentStep === 'semester' &&
								semesters.map(sem => (
									<button
										key={sem}
										onClick={() => handleSemesterSelect(sem)}
										className="w-full p-4 bg-background hover:bg-hover border border-border rounded-xl text-left transition-all group flex items-center justify-between">
										<span className="text-main font-medium">Semestr {sem}</span>
										<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
									</button>
								))}

							{/* Group */}
							{currentStep === 'group' && groups.length === 0 && (
								<div className="text-center py-8 text-muted">Brak dostępnych grup dla wybranej kombinacji</div>
							)}
							{currentStep === 'group' &&
								groups.map(group => (
									<button
										key={group.id}
										onClick={() => handleGroupSelect(group)}
										className="w-full p-4 bg-background hover:bg-hover border border-border rounded-xl text-left transition-all group flex items-center justify-between">
										<span className="text-main font-medium">{group.name}</span>
										<Check size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
									</button>
								))}
						</div>
					)}
				</div>

				{/* Footer - Breadcrumb */}
				<div className="p-3 border-t border-border bg-background/50 flex-shrink-0">
					<div className="flex items-center gap-2 text-xs text-muted overflow-x-auto no-scrollbar"></div>
				</div>
			</div>
		</div>
	)
}

export default GroupSelectorModal
