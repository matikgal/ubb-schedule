import React, { useState, useEffect } from 'react'
import { X, ChevronRight, Check } from 'lucide-react'
import { fetchFaculties, fetchMajorsForFaculty, fetchGroupsForMajor, saveSelectedGroup } from '@/services/groupService'
import { GroupInfo } from '@/types'
import Modal from '@/components/ui/Modal'

interface GroupSelectorModalProps {
	isOpen: boolean
	onClose: () => void
	onGroupSelected: (group?: GroupInfo) => void
	mode?: 'select' | 'preview'
}

type Step = 'role' | 'faculty' | 'major' | 'studyType' | 'semester' | 'group' | 'allTeachers'

const GroupSelectorModal: React.FC<GroupSelectorModalProps> = ({ isOpen, onClose, onGroupSelected, mode = 'select' }) => {
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
			const { fetchAllTeachers } = await import('@/services/groupService')
			const data = await fetchAllTeachers()
			setTeachers(data)
			setFilteredTeachers(data)
		} catch (err) {
			setError('Nie udało się pobrać wykładowców')
		} finally {
			setLoading(false)
		}
	}

	const handleSelection = async (value: any) => {
		setTempSelection(value)

		// For final steps, just select (don't auto-advance)
		if (currentStep === 'group' || currentStep === 'allTeachers') {
			return
		}

		// Auto-advance for intermediate steps
		if (currentStep === 'role') {
			const role = value as 'student' | 'teacher'
			setSelectedRole(role)
			setCurrentStep(role === 'student' ? 'faculty' : 'allTeachers')
		} else if (currentStep === 'faculty') {
			const faculty = value as string
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
			const major = value as string
			setSelectedMajor(major)
			const majorLower = String(major).toLowerCase().trim()
			if (majorLower.includes('erasmus')) {
				setSelectedStudyType('S')
				setCurrentStep('semester')
			} else {
				setCurrentStep('studyType')
			}
		} else if (currentStep === 'studyType') {
			setSelectedStudyType(value as string)
			setCurrentStep('semester')
		} else if (currentStep === 'semester') {
			const semester = value as number
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
		}
	}

	const handleConfirm = async () => {
		if (!tempSelection) return

		if (currentStep === 'group' || currentStep === 'allTeachers') {
			const group = tempSelection as GroupInfo

			if (mode === 'preview') {
				onGroupSelected(group)
				onClose()
				return
			}

			setSelectedGroup(group)
			try {
				await saveSelectedGroup(group)
				const { fetchScheduleForWeek } = await import('@/services/scheduleService')
				await fetchScheduleForWeek(group.id, undefined, true, group.type === 'teacher')
				onGroupSelected(group)
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

		if (currentStep === 'semester' && selectedMajor.toLowerCase().includes('erasmus')) {
			setCurrentStep('major')
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
			title={getStepTitle()}
			className="h-full flex flex-col"
		>
			<div className="flex-1 overflow-y-auto px-6 pb-6">
				{/* Progress Bar */}
				<div className="mb-6 h-1 w-full bg-white/10 rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-300"
						style={{ width: `${(getStepNumber() / (selectedRole === 'teacher' ? 2 : 6)) * 100}%` }}></div>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm">
						{error}
					</div>
				)}

				{loading ? (
					<div className="space-y-3">
						{[1, 2, 3, 4].map(i => (
							<div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
						))}
					</div>
				) : (
					<div className="space-y-3">
						{/* Role Selection */}
						{currentStep === 'role' && (
							<div className="space-y-4">
								<button
									onClick={() => handleSelection('student')}
									className={`w-full p-6 border rounded-3xl text-left transition-all group flex items-center justify-between ${isSelected('student')
											? 'bg-primary border-primary text-black'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
										}`}>
									<div>
										<span className="font-bold text-xl block mb-1">Student</span>
										<span className={`text-sm ${isSelected('student') ? 'text-black/70' : 'text-white/50'}`}>Przeglądaj plany grup dziekańskich</span>
									</div>
									{isSelected('student') && <Check size={28} className="text-black" />}
								</button>
								<button
									onClick={() => handleSelection('teacher')}
									className={`w-full p-6 border rounded-3xl text-left transition-all group flex items-center justify-between ${isSelected('teacher')
											? 'bg-primary border-primary text-black'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
										}`}>
									<div>
										<span className="font-bold text-xl block mb-1">Wykładowca</span>
										<span className={`text-sm ${isSelected('teacher') ? 'text-black/70' : 'text-white/50'}`}>Znajdź plan prowadzącego</span>
									</div>
									{isSelected('teacher') && <Check size={28} className="text-black" />}
								</button>
							</div>
						)}

						{/* Faculty */}
						{currentStep === 'faculty' &&
							faculties.map(faculty => (
								<button
									key={faculty}
									onClick={() => handleSelection(faculty)}
									className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(faculty)
											? 'bg-primary border-primary text-black font-bold'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium'
										}`}>
									<span>{faculty}</span>
									{isSelected(faculty) && <Check size={20} />}
								</button>
							))}

						{/* Major */}
						{currentStep === 'major' &&
							majors.map(major => (
								<button
									key={major}
									onClick={() => handleSelection(major)}
									className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(major)
											? 'bg-primary border-primary text-black font-bold'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium'
										}`}>
									<span>{major}</span>
									{isSelected(major) && <Check size={20} />}
								</button>
							))}

						{/* Study Type */}
						{currentStep === 'studyType' &&
							studyTypes.map(type => (
								<button
									key={type.value}
									onClick={() => handleSelection(type.value)}
									className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(type.value)
											? 'bg-primary border-primary text-black font-bold'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium'
										}`}>
									<span>{type.label}</span>
									{isSelected(type.value) && <Check size={20} />}
								</button>
							))}

						{/* Semester */}
						{currentStep === 'semester' &&
							semesters.map(sem => (
								<button
									key={sem}
									onClick={() => handleSelection(sem)}
									className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(sem)
											? 'bg-primary border-primary text-black font-bold'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium'
										}`}>
									<span>Semestr {sem}</span>
									{isSelected(sem) && <Check size={20} />}
								</button>
							))}

						{/* Group */}
						{currentStep === 'group' && groups.length === 0 && (
							<div className="text-center py-12 text-white/40">Brak dostępnych grup dla wybranej kombinacji</div>
						)}
						{currentStep === 'group' &&
							groups.map(group => (
								<button
									key={group.id}
									onClick={() => handleSelection(group)}
									className={`w-full p-5 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(group)
											? 'bg-primary border-primary text-black font-bold'
											: 'bg-white/5 hover:bg-white/10 border-white/10 text-white font-medium'
										}`}>
									<span>{group.name}</span>
									{isSelected(group) && <Check size={20} />}
								</button>
							))}

						{/* All Teachers */}
						{currentStep === 'allTeachers' && (
							<>
								<div className="sticky top-0 bg-transparent z-10 pb-4">
									<input
										type="text"
										placeholder="Szukaj wykładowcy..."
										value={searchTerm}
										onChange={e => setSearchTerm(e.target.value)}
										className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors backdrop-blur-md"
										autoFocus
									/>
								</div>

								<div className="space-y-2">
									{filteredTeachers.length === 0 ? (
										<div className="text-center py-12 text-white/40">
											{searchTerm ? 'Nie znaleziono wykładowcy' : 'Brak dostępnych wykładowców'}
										</div>
									) : (
										filteredTeachers.map(teacher => (
											<button
												key={teacher.id}
												onClick={() => handleSelection(teacher)}
												className={`w-full p-4 border rounded-2xl text-left transition-all flex items-center justify-between ${isSelected(teacher)
														? 'bg-primary border-primary text-black'
														: 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
													}`}>
												<div>
													<span className={`font-medium block ${isSelected(teacher) ? 'font-bold' : ''}`}>{teacher.name}</span>
													<span className={`text-[11px] ${isSelected(teacher) ? 'text-black/70' : 'text-white/40'}`}>{teacher.faculty}</span>
												</div>
												{isSelected(teacher) && <Check size={20} />}
											</button>
										))
									)}
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Unified Footer */}
			<div className="p-6 pt-2 flex gap-4 bg-transparent z-20">
				{currentStep !== 'role' && (
					<button
						onClick={handleBack}
						className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
					>
						Wstecz
					</button>
				)}
				{(currentStep === 'group' || currentStep === 'allTeachers') && (
					<button
						onClick={handleConfirm}
						disabled={!tempSelection}
						className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all shadow-lg ${tempSelection
								? 'bg-primary text-black shadow-primary/20 hover:bg-primary-hover'
								: 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
							}`}
					>
						Zatwierdź
					</button>
				)}
			</div>
		</Modal>
	)
}

export default GroupSelectorModal
