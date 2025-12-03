import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, ArrowRight, User, ChevronRight, GraduationCap } from 'lucide-react'
import Toast from '../components/Toast'
import OfflineBadge from '../components/OfflineBadge'
import { fetchFaculties, fetchMajorsForFaculty, fetchGroupsForMajor, saveSelectedGroup, fetchAllTeachers } from '../services/groupService'
import { GroupInfo } from '../types'
import { ERROR_MESSAGES } from '../constants/errorMessages'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import LecturerProfile from '../components/LecturerProfile'

interface SelectionPillProps {
	label: string
	active: boolean
	onClick: () => void
}

const SelectionPill: React.FC<SelectionPillProps> = ({ label, active, onClick }) => (
	<button
		onClick={onClick}
		className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
			active ? 'bg-primary text-black border-primary' : 'bg-surface border-border text-muted hover:bg-hover'
		}`}>
		{label}
	</button>
)

const SearchPage: React.FC = () => {
	const navigate = useNavigate()
	const isOnline = useOnlineStatus()

	// --- Search State ---
	const [searchQuery, setSearchQuery] = useState('')
	const [allTeachers, setAllTeachers] = useState<GroupInfo[]>([])
	const [searchResults, setSearchResults] = useState<GroupInfo[]>([])
	const [selectedLecturer, setSelectedLecturer] = useState<GroupInfo | null>(null)

	// --- Filter State ---
	const [selectedFaculty, setSelectedFaculty] = useState<string>('')
	const [selectedField, setSelectedField] = useState<string>('')
	const [selectedStudyType, setSelectedStudyType] = useState<string>('')
	const [selectedSemester, setSelectedSemester] = useState<number | null>(null)
	const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)

	const [faculties, setFaculties] = useState<string[]>([])
	const [fields, setFields] = useState<string[]>([])
	const [groups, setGroups] = useState<GroupInfo[]>([])

	const [loadingFaculties, setLoadingFaculties] = useState<boolean>(false)
	const [loadingFields, setLoadingFields] = useState<boolean>(false)
	const [loadingGroups, setLoadingGroups] = useState<boolean>(false)

	const [error, setError] = useState<string>('')
	const [showToast, setShowToast] = useState<boolean>(false)

	// Mapowanie wyświetlanych nazw na wartości w bazie
	const studyTypeMapping: Record<string, string> = {
		Stacjonarne: 'S',
		Zaoczne: 'NW',
	}

	const studyTypes = Object.keys(studyTypeMapping)

	// Semestry (1-7 dla studiów inżynierskich)
	const semesters = [1, 2, 3, 4, 5, 6, 7]

	// Load all teachers on mount
	useEffect(() => {
		const loadTeachers = async () => {
			try {
				const teachers = await fetchAllTeachers()
				setAllTeachers(teachers)
			} catch (err) {
				console.error('Failed to load teachers for search:', err)
			}
		}
		loadTeachers()
	}, [])

	// Filter teachers based on search query
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([])
			return
		}

		const query = searchQuery.toLowerCase()
		const results = allTeachers.filter(t => t.name.toLowerCase().includes(query))
		setSearchResults(results)
	}, [searchQuery, allTeachers])

	// Pobierz wydziały przy montowaniu komponentu
	useEffect(() => {
		const loadFaculties = async () => {
			setLoadingFaculties(true)
			setError('')
			setShowToast(false)
			try {
				const data = await fetchFaculties()
				setFaculties(data)
			} catch (err) {
				setError(ERROR_MESSAGES.FACULTIES_LOAD_ERROR)
				setShowToast(true)
				console.error('Error loading faculties:', err)
			} finally {
				setLoadingFaculties(false)
			}
		}

		loadFaculties()
	}, [])

	// Pobierz kierunki gdy wybrano wydział
	useEffect(() => {
		if (!selectedFaculty) {
			setFields([])
			return
		}

		const loadFields = async () => {
			setLoadingFields(true)
			setError('')
			setShowToast(false)
			try {
				const data = await fetchMajorsForFaculty(selectedFaculty)
				setFields(data)
			} catch (err) {
				setError(ERROR_MESSAGES.MAJORS_LOAD_ERROR)
				setShowToast(true)
				console.error('Error loading fields:', err)
			} finally {
				setLoadingFields(false)
			}
		}

		loadFields()
	}, [selectedFaculty])

	// Pobierz grupy gdy wybrano wydział, kierunek, tryb studiów i semestr
	useEffect(() => {
		if (!selectedFaculty || !selectedField || !selectedStudyType || !selectedSemester) {
			setGroups([])
			return
		}

		const loadGroups = async () => {
			setLoadingGroups(true)
			setError('')
			setShowToast(false)
			try {
				// Zmapuj wyświetlaną nazwę na wartość w bazie (S lub NW)
				const dbStudyType = studyTypeMapping[selectedStudyType]
				console.log('🔄 Mapping study type:', selectedStudyType, '→', dbStudyType)

				const data = await fetchGroupsForMajor(selectedFaculty, selectedField, dbStudyType, selectedSemester)
				setGroups(data)
			} catch (err) {
				setError(ERROR_MESSAGES.GROUPS_LOAD_ERROR)
				setShowToast(true)
				console.error('Error loading groups:', err)
			} finally {
				setLoadingGroups(false)
			}
		}

		loadGroups()
	}, [selectedFaculty, selectedField, selectedStudyType, selectedSemester])

	const handleSave = async () => {
		if (!selectedGroup) return

		try {
			await saveSelectedGroup(selectedGroup)
			navigate('/')
		} catch (err) {
			setError(ERROR_MESSAGES.GROUP_SAVE_ERROR)
			setShowToast(true)
			console.error('Error saving group:', err)
		}
	}

	// If a lecturer is selected, show their profile
	if (selectedLecturer) {
		return (
			<div className="pt-6">
				<LecturerProfile
					teacherId={selectedLecturer.id}
					teacherName={selectedLecturer.name}
					faculty={selectedLecturer.faculty}
					email={selectedLecturer.email}
					phone={selectedLecturer.phone}
					office={selectedLecturer.office}
					onBack={() => setSelectedLecturer(null)}
				/>
			</div>
		)
	}

	return (
		<div className="space-y-10 animate-fade-in pt-6">
			{/* Offline Badge */}
			<OfflineBadge isVisible={!isOnline} />

			<div>
				<h1 className="text-3xl font-display font-bold text-main mb-2">Znajdź plan</h1>
			</div>

			{/* Search Input */}
			<div className="space-y-4">
				<div className="bg-surface rounded-xl flex items-center p-1 border border-border focus-within:border-primary/50 transition-colors">
					<div className="p-3 text-muted">
						<SearchIcon size={20} />
					</div>
					<input
						type="text"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder="Szukaj wykładowcy..."
						className="w-full p-2 outline-none text-main bg-transparent placeholder:text-muted text-sm"
					/>
				</div>

				{/* Search Results */}
				{searchQuery && (
					<div className="space-y-2 animate-fade-in">
						{searchResults.length > 0 ? (
							searchResults.map(teacher => (
								<button
									key={teacher.id}
									onClick={() => setSelectedLecturer(teacher)}
									className="w-full p-4 bg-surface border border-border rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group text-left"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
											<User size={20} />
										</div>
										<div>
											<h4 className="font-bold text-main text-sm">{teacher.name}</h4>
											<div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
												<GraduationCap size={12} />
												<span>{teacher.faculty}</span>
											</div>
										</div>
									</div>
									<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
								</button>
							))
						) : (
							<p className="text-center text-muted text-sm py-4">Brak wyników wyszukiwania</p>
						)}
					</div>
				)}
			</div>

			{/* Toast Notification */}
			{showToast && error && (
				<div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-lg">
					<Toast message={error} type="error" onClose={() => setShowToast(false)} duration={5000} />
				</div>
			)}

			{/* Filter Flow (Only show if not searching) */}
			{!searchQuery && (
				<div className="space-y-8 animate-fade-in">
					<div className="flex items-center gap-4">
						<div className="h-[1px] flex-1 bg-border"></div>
						<span className="text-xs font-bold text-muted uppercase">LUB WYBIERZ GRUPĘ</span>
						<div className="h-[1px] flex-1 bg-border"></div>
					</div>

					<div className="space-y-3">
						<h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Wydział</h3>
						{loadingFaculties ? (
							<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
								{[1, 2, 3, 4].map(i => (
									<div
										key={i}
										className="px-5 py-2.5 rounded-full border border-border h-9 w-32 skeleton-shimmer"
										style={{ animationDelay: `${i * 100}ms` }}
									/>
								))}
							</div>
						) : (
							<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
								{faculties.map(f => (
									<SelectionPill
										key={f}
										label={f}
										active={selectedFaculty === f}
										onClick={() => {
											setSelectedFaculty(f)
											setSelectedField('')
											setSelectedStudyType('')
											setSelectedSemester(null)
											setSelectedGroup(null)
										}}
									/>
								))}
							</div>
						)}
					</div>

					{selectedFaculty && (
						<div className="space-y-3 animate-slide-up">
							<h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Kierunek</h3>
							{loadingFields ? (
								<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
									{[1, 2, 3].map(i => (
										<div
											key={i}
											className="px-5 py-2.5 rounded-full border border-border h-9 w-40 skeleton-shimmer"
											style={{ animationDelay: `${i * 100}ms` }}
										/>
									))}
								</div>
							) : (
								<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
									{fields.map(f => (
										<SelectionPill
											key={f}
											label={f}
											active={selectedField === f}
											onClick={() => {
												setSelectedField(f)
												setSelectedStudyType('')
												setSelectedSemester(null)
												setSelectedGroup(null)
											}}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{selectedField && (
						<div className="space-y-3 animate-slide-up">
							<h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Tryb studiów</h3>
							<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
								{studyTypes.map(type => (
									<SelectionPill
										key={type}
										label={type}
										active={selectedStudyType === type}
										onClick={() => {
											setSelectedStudyType(type)
											setSelectedSemester(null)
											setSelectedGroup(null)
										}}
									/>
								))}
							</div>
						</div>
					)}

					{selectedStudyType && (
						<div className="space-y-3 animate-slide-up">
							<h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Semestr</h3>
							<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
								{semesters.map(sem => (
									<SelectionPill
										key={sem}
										label={`${sem}`}
										active={selectedSemester === sem}
										onClick={() => {
											setSelectedSemester(sem)
											setSelectedGroup(null)
										}}
									/>
								))}
							</div>
						</div>
					)}

					{selectedSemester && (
						<div className="space-y-3 animate-slide-up">
							<h3 className="text-xs font-bold text-muted uppercase tracking-wide ml-1">Grupa</h3>
							{loadingGroups ? (
								<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
									{[1, 2, 3, 4].map(i => (
										<div
											key={i}
											className="px-5 py-2.5 rounded-full border border-border h-9 w-24 skeleton-shimmer"
											style={{ animationDelay: `${i * 100}ms` }}
										/>
									))}
								</div>
							) : groups.length === 0 ? (
								<p className="text-muted text-sm ml-1 animate-fade-in">Brak dostępnych grup dla wybranej kombinacji.</p>
							) : (
								<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar animate-fade-in">
									{groups.map(g => (
										<SelectionPill
											key={g.id}
											label={g.name}
											active={selectedGroup?.id === g.id}
											onClick={() => setSelectedGroup(g)}
										/>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Save Button */}
			{selectedGroup && !searchQuery && (
				<div className="fixed bottom-24 left-0 right-0 px-6 flex justify-center animate-bounce-in z-30">
					<button
						onClick={handleSave}
						className="flex items-center gap-3 bg-primary text-black px-8 py-3.5 rounded-full font-bold text-sm shadow-xl hover:scale-105 transition-transform">
						Zapisz wybór <ArrowRight size={18} />
					</button>
				</div>
			)}
		</div>
	)
}

export default SearchPage
