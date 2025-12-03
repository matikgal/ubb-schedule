import React from 'react'
import { Map, ExternalLink } from 'lucide-react'

const CampusMapWidget: React.FC = () => {
	const mapUrl = 'https://www.google.com/maps/d/u/0/viewer?mid=1lKPgQeR_rcpO3_0hG_UXL5nJ6WrmVqI&femb=1&ll=49.78394208453077%2C19.057791725428764&z=18'

	return (
		<a
			href={mapUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="h-full bg-surface rounded-2xl p-4 border border-border flex flex-col justify-between hover:border-primary/50 transition-all group relative overflow-hidden"
		>
			{/* Background Map Image */}
			<div 
				className="absolute inset-0 bg-cover bg-center z-0 opacity-60 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none grayscale-[30%] invert-[10%]"
				style={{ backgroundImage: "url('/assets/campus_map_static.png')" }}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-0 pointer-events-none" />

			{/* Purple Orb */}
			<div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl group-hover:bg-purple-500/40 transition-colors z-0"></div>
			
			<div className="flex justify-end items-start relative z-10">
				<div className="p-2 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/10 group-hover:bg-white/20 transition-colors">
					<ExternalLink size={18} />
				</div>
			</div>

			<div className="relative z-10">
				<h4 className="font-bold text-white text-sm drop-shadow-md">Mapa Kampusu</h4>
				<p className="text-xs text-white/70 mt-0.5 drop-shadow-md">Zobacz lokalizacje</p>
			</div>
		</a>
	)
}

export default CampusMapWidget
