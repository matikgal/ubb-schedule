import React, { useState } from 'react'
import { X, ChevronRight, Clock, Phone, Mail, MapPin, ArrowLeft } from 'lucide-react'
import Modal from './Modal'

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
			className="p-0 w-full max-h-[80vh] min-h-[400px] mb-20 flex flex-col"
			scrollable={false}
			hideCloseButton={true}
		>
			{/* Header */}
			<div className="p-6 border-b border-border flex-shrink-0 bg-surface z-20">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-3">
						{selectedOffice && (
							<button 
								onClick={() => setSelectedOffice(null)}
								className="p-2 -ml-2 hover:bg-hover rounded-lg transition-colors"
							>
								<ArrowLeft size={20} className="text-main" />
							</button>
						)}
						<h3 className="font-display font-bold text-lg text-main">
							{selectedOffice ? 'Szczegóły' : 'Godziny dziekanatów'}
						</h3>
					</div>
					<button onClick={handleClose} className="p-2 hover:bg-hover rounded-lg transition-colors">
						<X size={20} className="text-muted" />
					</button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-6 overscroll-contain">
				{!selectedOffice ? (
					<div className="space-y-3">
						{offices.map(office => (
							<button
								key={office.id}
								onClick={() => setSelectedOffice(office)}
								className="w-full p-4 border border-border rounded-xl text-left transition-all bg-background hover:bg-hover hover:border-primary/50 group"
							>
								<div className="flex justify-between items-center mb-1">
									<span className="font-bold text-main group-hover:text-primary transition-colors pr-4">
										{office.name}
									</span>
									<ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors flex-shrink-0" />
								</div>
								<div className="flex items-center gap-2 text-xs text-muted">
									<MapPin size={12} />
									<span>{office.location}</span>
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="space-y-6 animate-fade-in">
						<div>
							<h2 className="text-xl font-bold text-main mb-2">{selectedOffice.name}</h2>
							<div className="flex items-center gap-2 text-sm text-muted">
								<MapPin size={16} />
								<span>{selectedOffice.location}</span>
							</div>
						</div>

						<div className="space-y-4">
							<h4 className="text-sm font-bold text-muted uppercase tracking-wider">Godziny otwarcia</h4>
							<div className="space-y-2">
								{selectedOffice.hours.map((h, idx) => (
									<div key={idx} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
										<span className="font-medium text-main">{h.day}</span>
										<span className={`font-bold ${h.time === 'Zamknięte' ? 'text-red-500' : 'text-primary'}`}>
											{h.time}
										</span>
									</div>
								))}
							</div>
						</div>

						{selectedOffice.staff.length > 0 && (
							<div className="space-y-4">
								<h4 className="text-sm font-bold text-muted uppercase tracking-wider">Władze Wydziału / Dyżury</h4>
								<div className="space-y-3">
									{selectedOffice.staff.map((person, idx) => (
										<div key={idx} className="p-4 bg-background border border-border rounded-xl">
											<div className="mb-2">
												<span className="text-xs font-bold text-primary uppercase block mb-0.5">{person.role}</span>
												<span className="font-bold text-main">{person.name}</span>
											</div>
											<div className="text-sm text-muted">
												{person.hours}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="space-y-4">
							<h4 className="text-sm font-bold text-muted uppercase tracking-wider">Kontakt</h4>
							<div className="grid grid-cols-2 gap-3">
								<a href={`tel:${selectedOffice.contact.phone}`} className="p-4 bg-background border border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
									<Phone size={20} className="text-primary" />
									<span className="text-sm font-bold text-main text-center">{selectedOffice.contact.phone}</span>
								</a>
								<a href={`mailto:${selectedOffice.contact.email}`} className="p-4 bg-background border border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
									<Mail size={20} className="text-primary" />
									<span className="text-sm font-bold text-main">Napisz e-mail</span>
								</a>
							</div>
						</div>
					</div>
				)}
			</div>
		</Modal>
	)
}

export default DeansOfficeModal
