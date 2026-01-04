import React, { useState } from 'react'
import { X, ChevronRight, Clock, Phone, Mail, MapPin, ArrowLeft, User } from 'lucide-react'
import Modal from '@/components/ui/Modal'

interface DeansOfficeModalProps {
	isOpen: boolean
	onClose: () => void
}

interface DeansOffice {
	id: string
	name: string
	location: string
	hours: { day: string; time: string }[]
	contact: { phone: string; email: string }
	status: 'open' | 'closed'
	staff: { name: string; role: string; hours: string }[]
}

const offices: DeansOffice[] = [
	{
		id: '1',
		name: 'Wydział Budowy Maszyn i Informatyki',
		location: 'Budynek L, I piętro',
		hours: [
			{ day: 'Poniedziałek', time: '10:00 - 13:00' },
			{ day: 'Wtorek', time: '10:00 - 13:00' },
			{ day: 'Środa', time: 'Zamknięte' },
			{ day: 'Czwartek', time: '10:00 - 13:00' },
			{ day: 'Piątek', time: '10:00 - 13:00' },
			{ day: 'Piątek (zjazdowy)', time: '15:00 - 17:00' },
			{ day: 'Sobota (zjazdowa)', time: '08:00 - 12:00' },
		],
		contact: { phone: '33 82-79-224', email: 'dzwbm@ubb.edu.pl' },
		status: 'open',
		staff: [
			{ name: 'dr inż. Dariusz Więcek', role: 'Prodziekan ds. Studenckich', hours: 'Wtorek: 10:00-11:00, Sobota (zjazdowa): 10:00-11:00' },
			{ name: 'dr inż. Jacek Rysiński', role: 'Prodziekan ds. Studenckich', hours: 'Piątek: 09:30-10:15, Piątek (zjazdowy): 15:00-16:00' },
		]
	},
	{
		id: '2',
		name: 'Wydział Humanistyczno-Społeczny',
		location: 'Budynek L, pokój 212',
		hours: [
			{ day: 'Poniedziałek', time: '10:00 - 13:00' },
			{ day: 'Wtorek', time: '10:00 - 13:00' },
			{ day: 'Środa', time: 'Zamknięte' },
			{ day: 'Czwartek', time: '10:00 - 13:00' },
			{ day: 'Piątek', time: '10:00 - 13:00' },
		],
		contact: { phone: '33 827 92 29', email: 'dwhs@ubb.edu.pl' },
		status: 'open',
		staff: [
			{ name: 'prof. dr hab. Ernest Zawada', role: 'Dziekan', hours: 'Wtorki 9:00-11:00' },
			{ name: 'dr Angelika Matuszek', role: 'p.o. Prodziekana ds. Studenckich', hours: 'Środa 11.30-13.30, Piątek 14.00-16.00, Piątek zjazdowy 16.00-17.30' },
			{ name: 'dr Roman Waluś', role: 'Prodziekan ds. Studenckich', hours: 'Poniedziałek 10:00-12:00, Środa 10:00-12:00, Sobota zjazdowa 09:00-10:30' },
		]
	},
	{
		id: '3',
		name: 'Wydział Inżynierii Materiałów, Budownictwa i Środowiska',
		location: 'Budynek L, pokój 112',
		hours: [
			{ day: 'Poniedziałek', time: '10:00 - 13:00' },
			{ day: 'Wtorek', time: '10:00 - 13:00' },
			{ day: 'Środa', time: 'Zamknięte' },
			{ day: 'Czwartek', time: '10:00 - 13:00' },
			{ day: 'Piątek', time: '10:00 - 13:00' },
			{ day: 'Sobota (zjazdowa)', time: '08:00 - 12:00' },
		],
		contact: { phone: '33 827 94 26', email: 'wimbis@ubb.edu.pl' },
		status: 'open',
		staff: [
			{ name: 'dr hab. inż. Klaudiusz Grübel', role: 'Dziekan', hours: 'Po umówieniu telefonicznym' },
			{ name: 'dr inż. Lucyna Przywara', role: 'Prodziekan ds. studenckich', hours: 'Wtorek 13:00 – 14:30, Sobota zjazdowa 8:00 – 9:30' },
			{ name: 'dr inż. Monika Rom', role: 'Prodziekan ds. studenckich', hours: 'Wtorek 9:30 – 11:00, Sobota zjazdowa 9:30 – 11:00' },
		]
	},
	{
		id: '4',
		name: 'Wydział Nauk o Zdrowiu',
		location: 'Budynek L, pokój 207',
		hours: [
			{ day: 'Poniedziałek', time: '10:00 - 13:00' },
			{ day: 'Wtorek', time: '10:00 - 13:00' },
			{ day: 'Środa', time: 'Zamknięte' },
			{ day: 'Czwartek', time: '10:00 - 15:15' },
			{ day: 'Piątek', time: '10:00 - 13:00' },
			{ day: 'Sobota (zjazdowa)', time: '08:00 - 12:00' },
		],
		contact: { phone: '33 82-79-403', email: 'wnoz@ubb.edu.pl' },
		status: 'open',
		staff: [
			{ name: 'dr hab. Wioletta Pollok-Waksmańska', role: 'Dziekan', hours: 'Wtorek 08:00 - 10:00' },
			{ name: 'dr Beata Babiarczyk', role: 'Prodziekan ds. studenckich', hours: 'Czwartek 11:00 - 13:00' },
			{ name: 'dr Arkadiusz Stasicki', role: 'Prodziekan ds. studenckich', hours: 'Czwartek 08:30 – 10:30' },
		]
	},
	{
		id: '5',
		name: 'Wydział Zarządzania i Transportu',
		location: 'Budynek L, pokój 202/203',
		hours: [
			{ day: 'Poniedziałek', time: '10:00 - 13:00' },
			{ day: 'Środa', time: '08:00 - 10:00' },
			{ day: 'Piątek', time: '10:00 - 13:00' },
			{ day: 'Piątek (zjazdowy)', time: '15:00 - 17:00' },
			{ day: 'Sobota (zjazdowa)', time: '08:00 - 12:00' },
		],
		contact: { phone: '33 827 92 07', email: 'dwzit@ubb.edu.pl' },
		status: 'open',
		staff: [
			{ name: 'dr inż. Mariusz Kubański', role: 'Prodziekan ds. studenckich', hours: 'Środa 8.00 - 9:30' },
			{ name: 'dr inż. Beata Bieńkowska', role: 'Prodziekan ds. studenckich', hours: 'Wtorek 10.00 - 12.00, Sobota zjazdowa 12.00 - 13.00' },
		]
	},
]

const DeansOfficeModal: React.FC<DeansOfficeModalProps> = ({ isOpen, onClose }) => {
	const [selectedOffice, setSelectedOffice] = useState<DeansOffice | null>(null)

	const handleClose = () => {
		setSelectedOffice(null)
		onClose()
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={selectedOffice ? selectedOffice.name : 'Godziny dziekanatów'}
		>
			<div className="flex flex-col h-full p-6">
				{selectedOffice && (
					<button
						onClick={() => setSelectedOffice(null)}
						className="mb-6 flex items-center gap-2 text-sm text-primary font-bold hover:gap-3 transition-all w-fit group"
					>
						<ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
						Wróć do listy
					</button>
				)}

				<div className="flex-1 overflow-y-auto space-y-4 -mr-2 pr-2 scrollbar-hide">
					{!selectedOffice ? (
						<div className="space-y-3">
							{offices.map(office => (
								<button
									key={office.id}
									onClick={() => setSelectedOffice(office)}
									className="w-full p-5 border border-white/10 bg-white/5 rounded-2xl text-left transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] group shadow-sm active:scale-95"
								>
									<div className="flex justify-between items-center mb-1">
										<span className="font-bold text-white group-hover:text-primary transition-colors pr-4 text-sm leading-relaxed">
											{office.name}
										</span>
										<ChevronRight size={18} className="text-white/60 group-hover:text-primary transition-colors flex-shrink-0" />
									</div>
									<div className="flex items-center gap-2 text-xs text-white/50">
										<MapPin size={12} />
										<span>{office.location}</span>
									</div>
								</button>
							))}
						</div>
					) : (
						<div className="space-y-8 animate-fade-in pb-12">
							{/* Location Card */}
							<div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
								<div className="flex items-start gap-4">
									<div className="p-3 rounded-full bg-primary/10 text-primary">
										<MapPin size={24} />
									</div>
									<div>
										<h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Lokalizacja</h4>
										<p className="text-white font-medium">{selectedOffice.location}</p>
									</div>
								</div>
							</div>

							{/* Hours */}
							<div className="space-y-4">
								<h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
									<Clock size={16} /> Godziny otwarcia
								</h4>
								<div className="space-y-2">
									{selectedOffice.hours.map((h, idx) => (
										<div key={idx} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
											<span className="font-medium text-white text-sm">{h.day}</span>
											<span className={`font-bold text-sm ${h.time === 'Zamknięte' ? 'text-red-400' : 'text-primary'}`}>
												{h.time}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Staff */}
							{selectedOffice.staff.length > 0 && (
								<div className="space-y-4">
									<h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
										<User size={16} /> Władze Wydziału
									</h4>
									<div className="space-y-3">
										{selectedOffice.staff.map((person, idx) => (
											<div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-colors">
												<div className="mb-3">
													<span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md mb-2 inline-block">
														{person.role}
													</span>
													<span className="font-bold text-white block text-lg">{person.name}</span>
												</div>
												<div className="text-sm text-white/70 pl-2 border-l-2 border-white/10">
													{person.hours}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Contact */}
							<div className="space-y-4">
								<h4 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
									<Phone size={16} /> Kontakt
								</h4>
								<div className="grid grid-cols-2 gap-3">
									<a
										href={`tel:${selectedOffice.contact.phone}`}
										className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95 group"
									>
										<div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
											<Phone size={20} className="text-primary" />
										</div>
										<span className="text-sm font-bold text-white text-center">{selectedOffice.contact.phone}</span>
									</a>
									<a
										href={`mailto:${selectedOffice.contact.email}`}
										className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-primary/10 hover:border-primary/30 transition-all active:scale-95 group"
									>
										<div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
											<Mail size={20} className="text-primary" />
										</div>
										<span className="text-sm font-bold text-white">Napisz e-mail</span>
									</a>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</Modal>
	)
}

export default DeansOfficeModal
