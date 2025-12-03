import React from 'react'
import { Clock, ChevronRight } from 'lucide-react'

interface DeansOfficeWidgetProps {
	onClick: () => void
}

const DeansOfficeWidget: React.FC<DeansOfficeWidgetProps> = ({ onClick }) => {
	return (
		<button onClick={onClick} className="block h-full w-full text-left">
			<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
				{/* Decorative blob */}
				<div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>

				<div className="relative z-10">
					<div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
						<Clock size={20} />
					</div>
					<h4 className="text-sm font-bold text-main leading-tight">
						Godziny dziekanatów
					</h4>
				</div>

				<div className="relative z-10 flex items-center gap-1 text-xs font-bold text-muted group-hover:text-blue-500 transition-colors mt-2">
					<span>Sprawdź godziny</span>
					<ChevronRight size={14} />
				</div>
			</div>
		</button>
	)
}

export default DeansOfficeWidget
