import React from 'react'
import { Calculator, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const CalculatorWidget: React.FC = () => {
	return (
		<Link to="/calculator" className="block h-full">
			<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
				{/* Decorative blob */}
				<div className="absolute -bottom-6 -right-6 w-24 h-24 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-colors"></div>

				<div className="relative z-10">
					<div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
						<Calculator size={20} />
					</div>
					<h4 className="text-sm font-bold text-main leading-tight">
						Kalkulator Ocen
					</h4>
				</div>

				<div className="relative z-10 flex items-center gap-1 text-xs font-bold text-muted group-hover:text-green-500 transition-colors mt-2">
					<span>Oblicz średnią</span>
					<ChevronRight size={14} />
				</div>
			</div>
		</Link>
	)
}

export default CalculatorWidget
