import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, X, Users, ChevronRight, MapPin } from 'lucide-react'
import { fetchAllTeachers, fetchAllRooms } from '../services/groupService'
import { GroupInfo } from '../types'
import LecturerProfile from '../components/LecturerProfile'
import RoomProfile from '../components/RoomProfile'
import GroupScheduleView from '../components/GroupScheduleView'
import GroupSelectorModal from '../components/GroupSelectorModal'
import OfflineBadge from '../components/OfflineBadge'

const SearchPage: React.FC = () => {
	const [searchQuery, setSearchQuery] = useState('')
	const [teachers, setTeachers] = useState<GroupInfo[]>([])
	const [rooms, setRooms] = useState<GroupInfo[]>([])
	const [searchResults, setSearchResults] = useState<GroupInfo[]>([])
	const [selectedLecturer, setSelectedLecturer] = useState<GroupInfo | null>(null)
	const [selectedRoom, setSelectedRoom] = useState<GroupInfo | null>(null)
	const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null)
	const [isOnline, setIsOnline] = useState(navigator.onLine)
	const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false)

	// Load teachers and rooms on mount
	useEffect(() => {
		const loadData = async () => {
			try {
				const [teachersData, roomsData] = await Promise.all([
					fetchAllTeachers(),
					fetchAllRooms()
				])
				setTeachers(teachersData)
				setRooms(roomsData)
			} catch (error) {
				console.error('Failed to load data:', error)
			}
		}
		loadData()

		const handleOnline = () => setIsOnline(true)
		const handleOffline = () => setIsOnline(false)

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	// Filter teachers and rooms when query changes
	useEffect(() => {
		if (!searchQuery.trim()) {
			setSearchResults([])
			return
		}

		const query = searchQuery.toLowerCase()
		
		const filteredTeachers = teachers.filter(teacher => 
			teacher.name.toLowerCase().includes(query)
		)

		const filteredRooms = rooms.filter(room => 
			room.name.toLowerCase().includes(query)
		)

		// Combine and sort results
		const combined = [...filteredTeachers, ...filteredRooms].sort((a, b) => 
			a.name.localeCompare(b.name)
		)

		setSearchResults(combined)
	}, [searchQuery, teachers, rooms])

	const handleClearSearch = () => {
		setSearchQuery('')
		setSearchResults([])
	}

	// Show lecturer profile if selected
	if (selectedLecturer) {
		return (
			<LecturerProfile
				teacherId={selectedLecturer.id}
				teacherName={selectedLecturer.name}
				faculty={selectedLecturer.faculty}
				email={selectedLecturer.email}
				phone={selectedLecturer.phone}
				office={selectedLecturer.office}
				onBack={() => setSelectedLecturer(null)}
			/>
		)
	}

	// Show room profile if selected
	if (selectedRoom) {
		return (
			<RoomProfile
				roomId={selectedRoom.id}
				roomName={selectedRoom.name}
				faculty={selectedRoom.faculty}
				onBack={() => setSelectedRoom(null)}
			/>
		)
	}

	// Show group schedule if selected
	if (selectedGroup) {
		return (
			<GroupScheduleView
				group={selectedGroup}
				onBack={() => setSelectedGroup(null)}
			/>
		)
	}

	return (
		<div className="animate-fade-in space-y-6 pb-24">
			<OfflineBadge isVisible={!isOnline} />

			<div>
				<h1 className="text-3xl font-display font-bold text-main mb-2">Szukaj</h1>
				<p className="text-sm text-muted">
					Sprawdź dane kontaktowe wykładowców, numer telefonu, salę konsultacji oraz ich plan zajęć.
				</p>
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
						placeholder="Wyszukaj salę lub wykładowcę..."
						className="w-full p-2 outline-none text-main bg-transparent placeholder:text-muted text-sm"
					/>
					{searchQuery && (
						<button 
							onClick={handleClearSearch}
							className="p-3 text-muted hover:text-main transition-colors"
						>
							<X size={20} />
						</button>
					)}
				</div>

				{/* Search Results */}
				{searchResults.length > 0 && (
					<div className="space-y-2 animate-fade-in">
						<h3 className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Wyniki wyszukiwania</h3>
						<div className="space-y-2">
							{searchResults.map(item => (
								<button
									key={`${item.type}-${item.id}`}
									onClick={() => {
										console.log('👉 Selected item:', item)
										if (item.type === 'teacher') {
											setSelectedLecturer(item)
										} else if (item.type === 'room') {
											setSelectedRoom(item)
										}
									}}
									className="w-full p-4 bg-surface border border-border rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group text-left"
								>
									<div className="flex items-center gap-3">
										<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
											item.type === 'teacher' 
												? 'bg-primary/10 text-primary' 
												: 'bg-emerald-500/10 text-emerald-500'
										}`}>
											{item.type === 'teacher' ? <Users size={20} /> : <MapPin size={20} />}
										</div>
										<div>
											<span className="font-bold text-main block">{item.name}</span>
											{item.faculty && item.faculty !== 'Unknown' && (
												<span className="text-xs text-muted">{item.faculty}</span>
											)}
										</div>
									</div>
									<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Separator */}
			<div className="relative py-4">
				<div className="absolute inset-0 flex items-center">
					<div className="w-full border-t border-border"></div>
				</div>
				<div className="relative flex justify-center">
					<span className="bg-background px-4 text-xs font-bold text-muted uppercase tracking-wider">
						LUB WYBIERZ GRUPĘ RĘCZNIE
					</span>
				</div>
			</div>

			{/* Group Selection Button */}
			<button
				onClick={() => setIsGroupSelectorOpen(true)}
				className="w-full p-4 bg-surface border border-border rounded-xl flex items-center justify-between hover:border-primary/50 transition-all group text-left"
			>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
						<Users size={20} />
					</div>
					<div>
						<span className="font-bold text-main block">Wybierz grupę</span>
						<span className="text-xs text-muted">Przeglądaj plan zajęć dowolnej grupy</span>
					</div>
				</div>
				<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors" />
			</button>

			<GroupSelectorModal
				isOpen={isGroupSelectorOpen}
				onClose={() => setIsGroupSelectorOpen(false)}
				onGroupSelected={(group) => {
					if (group) {
						setSelectedGroup(group)
					}
				}}
				mode="preview"
			/>
		</div>
	)
}

export default SearchPage
