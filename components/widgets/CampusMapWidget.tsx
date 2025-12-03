import React from 'react'
import { Map } from 'lucide-react'

const CampusMapWidget: React.FC = () => {
	const mapUrl = 'https://www.google.com/maps/d/u/0/viewer?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&femb=1&ll=49.78394208453077%2C19.057791725428764&z=18'

	return (
		<a
			href={mapUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="h-full bg-surface rounded-2xl p-4 border border-border flex flex-col justify-between hover:bg-hover transition-all group relative overflow-hidden">
			
			<div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
			
			<div className="flex justify-between items-start">
				<div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
					<Map size={20} />
				</div>
			</div>

			<div>
				<h4 className="font-bold text-main text-sm">Mapa Kampusu</h4>
				<p className="text-xs text-muted mt-0.5">Zobacz lokalizacje</p>
			</div>
		</a>
	)
}

export default CampusMapWidget
