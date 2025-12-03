import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'
import { fetchFaculties, fetchMajorsForFaculty, fetchGroupsForMajor, saveSelectedGroup } from '../services/groupService'
import { GroupInfo } from '../types'
import Modal from './Modal'

interface GroupSelectorModalProps {
	isOpen: boolean
	onClose: () => void
	onGroupSelected: () => void
}

type Step = 'role' | 'faculty' | 'major' | 'studyType' | 'semester' | 'group' | 'allTeachers'

const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({ isOpen, onClose, onGroupSelected }) => {
	const [currentStep, setCurrentStep] = useState<Step>('role')

	// Selections
	const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null)
	const [selectedFaculty, setSelectedFaculty] = useState<string>('')
	const [selectedMajor, setSelectedMajor] = useState<string>('')
	const [selectedStudyType, setSelectedStudyType] = useState<string>('')
	const [selectedSemester, setSelectedSemester] = useState<number | null>(null)
	const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)

	// Data
	const [faculties, setFaculties] = useState<string[]>([])
	const [majors, setMajors] = useState<string[]>([])
	const [groups, setGroups] = useState<GroupInfo[]>([])
	const [teachers, setTeachers] = useState<GroupInfo[]>([])
	const [filteredTeachers, setFilteredTeachers] = useState<GroupInfo[]>([])
	const [searchTerm, setSearchTerm] = useState('')

	// Loading
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')

	const studyTypes = [
		{ label: 'Stacjonarne', value: 'S' },
		{ label: 'Zaoczne', value: 'NW' },
	]

	const semesters = [1, 2, 3, 4, 5, 6, 7]

	// Temporary selection state (before clicking Next)
	const [tempSelection, setTempSelection] = useState<any>(null)

	// Reset state when opening
	useEffect(() => {
		if (isOpen) {
			if (currentStep !== 'role') {
				setCurrentStep('role')
				setSelectedRole(null)
				setTempSelection(null)
				setSearchTerm('')
			}
		}
	}, [isOpen])

	// Clear temp selection when step changes
	useEffect(() => {
		setTempSelection(null)
	}, [currentStep])

	// Load faculties or teachers based on step
	useEffect(() => {
		if (isOpen) {
			if (currentStep === 'faculty') {
				loadFaculties()
			} else if (currentStep === 'allTeachers') {
				loadAllTeachers()
			}
		}
	}, [isOpen, currentStep])

	// Filter teachers
	useEffect(() => {
		if (currentStep === 'allTeachers') {
			if (!searchTerm.trim()) {
				setFilteredTeachers(teachers)
			} else {
				const lowerTerm = searchTerm.toLowerCase()
				const filtered = teachers.filter(t => t.name.toLowerCase().includes(lowerTerm))
				setFilteredTeachers(filtered)
			}
		}
	}, [searchTerm, teachers, currentStep])

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

	const loadAllTeachers = async () => {
		setLoading(true)
		setError('')
		try {
			const { fetchAllTeachers } = await import('../services/groupService')
			const data = await fetchAllTeachers()
			setTeachers(data)
			setFilteredTeachers(data)
		} catch (err) {
			setError('Nie udało się pobrać wykładowców')
		} finally {
			setLoading(false)
		}
	}

	const handleNext = async () => {
		if (!tempSelection) return

		if (currentStep === 'role') {
			const role = tempSelection as 'student' | 'teacher'
			setSelectedRole(role)
			setCurrentStep(role === 'student' ? 'faculty' : 'allTeachers')
		} else if (currentStep === 'faculty') {
			const faculty = tempSelection as string
			setSelectedFaculty(faculty)
			setLoading(true)
			try {
				const data = await fetchMajorsForFaculty(faculty)
				setMajors(data)
				setCurrentStep('major')
			} catch (err) {
				setError('Nie udało się pobrać kierunków')
			} finally {
				setLoading(false)
			}
		} else if (currentStep === 'major') {
			setSelectedMajor(tempSelection as string)
			setCurrentStep('studyType')
		} else if (currentStep === 'studyType') {
			setSelectedStudyType(tempSelection as string)
			setCurrentStep('semester')
		} else if (currentStep === 'semester') {
			const semester = tempSelection as number
			setSelectedSemester(semester)
			setLoading(true)
			try {
				const data = await fetchGroupsForMajor(selectedFaculty, selectedMajor, selectedStudyType, semester)
				setGroups(data)
				setCurrentStep('group')
			} catch (err) {
				setError('Nie udało się pobrać grup')
			} finally {
				setLoading(false)
			}
		} else if (currentStep === 'group' || currentStep === 'allTeachers') {
			const group = tempSelection as GroupInfo
			setSelectedGroup(group)
			try {
				await saveSelectedGroup(group)
				const { fetchScheduleForWeek } = await import('../services/scheduleService')
				await fetchScheduleForWeek(group.id, undefined, true, group.type === 'teacher')
				onGroupSelected()
				onClose()
			} catch (err) {
				setError('Nie udało się zapisać grupy')
			}
		}
	}

	const handleBack = () => {
		const steps: Step[] = ['role', 'faculty', 'major', 'studyType', 'semester', 'group']

		if (currentStep === 'allTeachers') {
			setCurrentStep('role')
			return
		}

		const currentIndex = steps.indexOf(currentStep)
		if (currentIndex > 0) {
			setCurrentStep(steps[currentIndex - 1])
		}
	}

	const getStepTitle = () => {
		switch (currentStep) {
			case 'role': return 'Kim jesteś?'
			case 'faculty': return 'Wybierz wydział'
			case 'major': return 'Wybierz kierunek'
			case 'studyType': return 'Tryb studiów'
			case 'semester': return 'Wybierz semestr'
			case 'group': return 'Wybierz grupę'
			case 'allTeachers': return 'Wybierz wykładowcę'
		}
	}

	const getStepNumber = () => {
		if (currentStep === 'allTeachers') return 2
		const steps: Step[] = ['role', 'faculty', 'major', 'studyType', 'semester', 'group']
		return steps.indexOf(currentStep) + 1
	}

	const isSelected = (value: any) => {
		if (currentStep === 'group' || currentStep === 'allTeachers') {
			return tempSelection?.id === value.id
		}
		return tempSelection === value
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			className="p-0 w-full max-h-[70vh] min-h-[300px] mb-20 flex flex-col"
			scrollable={false}
			hideCloseButton={true}
		>
			{/* Header - Fixed */}
			<div className="p-6 border-b border-border flex-shrink-0 bg-surface z-20">
				<div className="flex justify-between items-center mb-4">
					<h3 className="font-display font-bold text-lg text-main">{getStepTitle()}</h3>
					<button onClick={onClose} className="p-2 hover:bg-hover rounded-lg transition-colors">
						<X size={20} className="text-muted" />
					</button>
				</div>
				<div className="h-1 w-full bg-background rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-300"
						style={{ width: `${(getStepNumber() / (selectedRole === 'teacher' ? 2 : 6)) * 100}%` }}></div>
				</div>
			</div>

			{/* Content - Scrollable */}
			<div className="flex-1 overflow-y-auto p-6 overscroll-contain relative">
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
					<div className="space-y-2 pb-4">
						{/* Role Selection */}
						{currentStep === 'role' && (
							<div className="space-y-3">
								<button
									onClick={() => setTempSelection('student')}
									className={`w-full p-6 border rounded-2xl text-left transition-all group flex items-center justify-between ${
										isSelected('student') ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<div>
										<span className={`font-bold text-lg block mb-1 ${isSelected('student') ? 'text-primary' : 'text-main'}`}>Student</span>
										<span className="text-muted text-xs">Przeglądaj plany grup dziekańskich</span>
									</div>
									{isSelected('student') && <Check size={24} className="text-primary" />}
								</button>
								<button
									onClick={() => setTempSelection('teacher')}
									className={`w-full p-6 border rounded-2xl text-left transition-all group flex items-center justify-between ${
										isSelected('teacher') ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<div>
										<span className={`font-bold text-lg block mb-1 ${isSelected('teacher') ? 'text-primary' : 'text-main'}`}>Wykładowca</span>
										<span className="text-muted text-xs">Znajdź plan prowadzącego</span>
									</div>
									{isSelected('teacher') && <Check size={24} className="text-primary" />}
								</button>
							</div>
						)}

						{/* Faculty */}
						{currentStep === 'faculty' &&
							faculties.map(faculty => (
								<button
									key={faculty}
									onClick={() => setTempSelection(faculty)}
									className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
										isSelected(faculty) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<span className={`font-medium ${isSelected(faculty) ? 'text-primary' : 'text-main'}`}>{faculty}</span>
									{isSelected(faculty) && <Check size={18} className="text-primary" />}
								</button>
							))}

						{/* Major */}
						{currentStep === 'major' &&
							majors.map(major => (
								<button
									key={major}
									onClick={() => setTempSelection(major)}
									className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
										isSelected(major) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<span className={`font-medium ${isSelected(major) ? 'text-primary' : 'text-main'}`}>{major}</span>
									{isSelected(major) && <Check size={18} className="text-primary" />}
								</button>
							))}

						{/* Study Type */}
						{currentStep === 'studyType' &&
							studyTypes.map(type => (
								<button
									key={type.value}
									onClick={() => setTempSelection(type.value)}
									className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
										isSelected(type.value) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<span className={`font-medium ${isSelected(type.value) ? 'text-primary' : 'text-main'}`}>{type.label}</span>
									{isSelected(type.value) && <Check size={18} className="text-primary" />}
								</button>
							))}

						{/* Semester */}
						{currentStep === 'semester' &&
							semesters.map(sem => (
								<button
									key={sem}
									onClick={() => setTempSelection(sem)}
									className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
										isSelected(sem) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<span className={`font-medium ${isSelected(sem) ? 'text-primary' : 'text-main'}`}>Semestr {sem}</span>
									{isSelected(sem) && <Check size={18} className="text-primary" />}
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
									onClick={() => setTempSelection(group)}
									className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
										isSelected(group) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
									}`}>
									<span className={`font-medium ${isSelected(group) ? 'text-primary' : 'text-main'}`}>{group.name}</span>
									{isSelected(group) && <Check size={18} className="text-primary" />}
								</button>
							))}

						{/* All Teachers */}
						{currentStep === 'allTeachers' && (
							<>
								<div className="sticky top-0 bg-surface z-10 py-2 mb-2">
									<input
										type="text"
										placeholder="Szukaj wykładowcy..."
										value={searchTerm}
										onChange={e => setSearchTerm(e.target.value)}
										className="w-full p-4 bg-background border border-border rounded-xl text-main placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
										autoFocus
									/>
								</div>

								{filteredTeachers.length === 0 ? (
									<div className="text-center py-8 text-muted">
										{searchTerm ? 'Nie znaleziono wykładowcy' : 'Brak dostępnych wykładowców'}
									</div>
								) : (
									filteredTeachers.map(teacher => (
										<button
											key={teacher.id}
											onClick={() => setTempSelection(teacher)}
											className={`w-full p-4 border rounded-xl text-left transition-all flex items-center justify-between ${
												isSelected(teacher) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-hover border-border'
											}`}>
											<div>
												<span className={`font-medium block ${isSelected(teacher) ? 'text-primary' : 'text-main'}`}>{teacher.name}</span>
												<span className="text-[10px] text-muted">{teacher.faculty}</span>
											</div>
											{isSelected(teacher) && <Check size={18} className="text-primary" />}
										</button>
									))
								)}
							</>
						)}
					</div>
				)}
			</div>

			{/* Footer - Navigation Buttons - Fixed */}
			<div className="p-4 border-t border-border bg-surface flex-shrink-0 flex gap-3 z-20">
				{currentStep !== 'role' && (
					<button
						onClick={handleBack}
						className="flex-1 py-3 px-4 rounded-xl border border-border text-main font-medium hover:bg-hover transition-colors"
					>
						Wstecz
					</button>
				)}
				<button
					onClick={handleNext}
					disabled={!tempSelection}
					className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${
						tempSelection
							? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700'
							: 'bg-transparent border-border text-muted cursor-not-allowed'
					}`}
				>
					{currentStep === 'group' || currentStep === 'allTeachers' ? 'Zatwierdź' : 'Dalej'}
				</button>
			</div>
		</Modal>
	)
}

export default GroupSelectorModal
