import React from 'react'
import { Clock, ChevronRight } from 'lucide-react'

interface DeansOfficeWidgetProps {
	onClick: () => void
}

const DeansOfficeWidget: React.FC<DeansOfficeWidgetProps> = ({ onClick }) => {
	return (
		<button onClick={onClick} className="block h-full w-full text-left">
			<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
				{/* Orange Orb */}
				<div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors"></div>

				<div className="relative z-10 flex flex-col h-full justify-between">
					<h4 className="text-sm font-bold text-main leading-tight pt-1">
						Godziny dziekanatów
					</h4>
				</div>

				<div className="relative z-10 flex items-center gap-1 text-xs font-bold text-muted group-hover:text-orange-500 transition-colors mt-2">
					<span>Sprawdź godziny</span>
					<ChevronRight size={14} />
				</div>
			</div>
		</button>
	)
}

export default DeansOfficeWidget
