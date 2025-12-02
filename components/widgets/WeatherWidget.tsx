import React, { useEffect, useState } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Loader2, Thermometer } from 'lucide-react'

interface WeatherData {
	temperature: number
	weatherCode: number
}

const WeatherWidget: React.FC = () => {
	const [weather, setWeather] = useState<WeatherData | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(() => {
		const fetchWeather = async () => {
			try {
				// Bielsko-Biała coordinates
				const res = await fetch(
					'https://api.open-meteo.com/v1/forecast?latitude=49.8225&longitude=19.0444&current=temperature_2m,weather_code&timezone=Europe%2FBerlin'
				)
				const data = await res.json()
				setWeather({
					temperature: data.current.temperature_2m,
					weatherCode: data.current.weather_code,
				})
			} catch (e) {
				console.error('Weather fetch error:', e)
				setError(true)
			} finally {
				setLoading(false)
			}
		}

		fetchWeather()
	}, [])

	const getWeatherIcon = (code: number) => {
		if (code <= 1) return <Sun className="text-yellow-500" size={28} />
		if (code <= 3) return <Cloud className="text-gray-400" size={28} />
		if (code <= 67) return <CloudRain className="text-blue-400" size={28} />
		if (code <= 77) return <CloudSnow className="text-blue-200" size={28} />
		if (code <= 99) return <CloudLightning className="text-purple-500" size={28} />
		return <Sun className="text-yellow-500" size={28} />
	}

	const getWeatherDescription = (code: number) => {
		if (code <= 1) return 'Słonecznie'
		if (code <= 3) return 'Pochmurno'
		if (code <= 67) return 'Deszczowo'
		if (code <= 77) return 'Śnieg'
		if (code <= 99) return 'Burzowo'
		return 'Pogodnie'
	}

	return (
		<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
			{/* Decorative blob */}
			<div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors"></div>

			<div className="flex justify-between items-start relative z-10">
				<div>
					<h4 className="text-xs font-bold text-muted uppercase tracking-wide">Pogoda</h4>
					<p className="text-[10px] text-muted opacity-70">Bielsko-Biała</p>
				</div>
				{loading ? (
					<Loader2 className="animate-spin text-muted" size={20} />
				) : error ? (
					<Cloud className="text-muted" size={20} />
				) : (
					getWeatherIcon(weather!.weatherCode)
				)}
			</div>

			<div className="relative z-10 mt-2">
				{loading ? (
					<div className="h-8 w-16 bg-border/50 rounded animate-pulse"></div>
				) : error ? (
					<span className="text-sm text-muted">Brak danych</span>
				) : (
					<div className="flex items-end gap-2">
						<span className="text-3xl font-display font-bold text-main">{Math.round(weather!.temperature)}°</span>
						<span className="text-sm font-medium text-muted mb-1.5">{getWeatherDescription(weather!.weatherCode)}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default WeatherWidget
