import React from 'react'
import { Bell, ChevronRight, ExternalLink } from 'lucide-react'

const NEWS = [
	{ id: 1, title: "Harmonogram sesji zimowej 2025", date: "2 dni temu", important: true },
	{ id: 2, title: "Godziny dziekańskie 24.12", date: "5 dni temu", important: false },
	{ id: 3, title: "Nowe stypendia naukowe", date: "Tydzień temu", important: false },
]

const NewsWidget: React.FC = () => {
	return (
		<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col group hover:border-primary/30 transition-colors">
			{/* Decorative blob */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>

			<div className="flex items-center justify-between mb-4 relative z-10">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-green-500/10 rounded-lg text-green-500">
						<Bell size={14} />
					</div>
					<h4 className="text-xs font-bold text-muted uppercase tracking-wide">Ogłoszenia</h4>
				</div>
				<a href="https://ubb.edu.pl" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors">
					<ExternalLink size={14} />
				</a>
			</div>

			<div className="space-y-3 relative z-10 flex-1">
				{NEWS.map(item => (
					<div key={item.id} className="group/item flex items-start gap-3 cursor-pointer hover:bg-hover/50 p-2 -mx-2 rounded-lg transition-colors">
						<div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.important ? 'bg-red-500 animate-pulse' : 'bg-border'}`}></div>
						<div className="flex-1 min-w-0">
							<h5 className="text-sm font-bold text-main leading-tight truncate group-hover/item:text-primary transition-colors">
								{item.title}
							</h5>
							<p className="text-[10px] text-muted mt-0.5">{item.date}</p>
						</div>
						<ChevronRight size={14} className="text-muted opacity-0 group-hover/item:opacity-100 transition-opacity mt-1" />
					</div>
				))}
			</div>
		</div>
	)
}

export default NewsWidget
