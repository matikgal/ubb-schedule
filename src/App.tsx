import React, { useState, useEffect, Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Preloader from '@/components/ui/Preloader'
import GroupSelectorModal from '@/components/features/GroupSelectorModal'
import { ChevronLeft } from 'lucide-react'

// Lazy Load Pages
const Home = React.lazy(() => import('@/pages/Home'))
const SearchPage = React.lazy(() => import('@/pages/Search'))
const SchedulePage = React.lazy(() => import('@/pages/Schedule'))
const SettingsPage = React.lazy(() => import('@/pages/Settings'))

const PrivacyPage = () => {
	const navigate = useNavigate()
	return (
		<div className="space-y-6 animate-fade-in pt-6">
			<div className="flex items-center gap-4 mb-2">
				<button
					onClick={() => navigate(-1)}
					className="p-2 rounded-xl bg-surface border border-border text-muted hover:text-main transition-colors">
					<ChevronLeft size={20} />
				</button>
				<h1 className="text-2xl font-display font-bold text-main">Prywatność</h1>
			</div>

			<div className="bg-surface rounded-2xl p-6 border border-border space-y-4 text-muted text-sm leading-relaxed shadow-sm">
				<p>
					Twoja prywatność jest dla nas priorytetem. Aplikacja <strong className="text-main">UniSchedule</strong>{' '}
					przechowuje Twoje preferencje (wybrana grupa, motyw) wyłącznie lokalnie na Twoim urządzeniu (Local Storage).
				</p>
				<p>
					Żadne dane osobowe nie są przesyłane na zewnętrzne serwery. Dane o planie zajęć są pobierane z publicznie
					dostępnych źródeł uczelni lub wprowadzane ręcznie.
				</p>
				<p>Aplikacja nie śledzi Twojej lokalizacji ani nie wykorzystuje plików cookies w celach reklamowych.</p>
			</div>
		</div>
	)
}

const App: React.FC = () => {
	const [loading, setLoading] = useState(true)

	// Initialize data on first load
	useEffect(() => {
		const initNative = async () => {
			// Orientation Lock
			try {
				const { ScreenOrientation } = await import('@capacitor/screen-orientation')
				await ScreenOrientation.lock({ orientation: 'portrait' })
			} catch (e) {
				// Ignore
			}

			// Keyboard Resize Mode
			try {
				const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard')
				await Keyboard.setResizeMode({ mode: KeyboardResize.Body })
			} catch (e) {
				// Ignore
			}

			// Status Bar
			try {
				const { StatusBar, Style } = await import('@capacitor/status-bar')
				await StatusBar.setStyle({ style: Style.Dark })
				await StatusBar.setBackgroundColor({ color: '#000000' })
			} catch (e) {
				// Ignore
			}
		}

		// Prefetch pages immediately
		const prefetchPages = () => {
			const pages = [
				import('./pages/Home'), // Critical path
				import('./pages/Search'),
				import('./pages/Schedule'),
				import('./pages/Settings')
			]
			// We don't await here, just start fetching
			Promise.all(pages).catch(err => console.debug('Prefetch error:', err))
		}

		initNative()
		prefetchPages()
	}, [])

	const handlePreloaderFinish = async () => {
		// Force navigation to Home (root) when app starts
		window.location.hash = '/'
		setLoading(false)

		// Ukryj natywny splash screen po zakończeniu animacji
		try {
			const { SplashScreen } = await import('@capacitor/splash-screen')
			await SplashScreen.hide()
		} catch (e) {
			// Ignore if not on mobile
		}
	}

	return (
		<>
			{loading && <Preloader onFinish={handlePreloaderFinish} />}
			<Router>
				<Layout>
					<Suspense fallback={null}>
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/schedule" element={<SchedulePage />} />
							<Route path="/search" element={<SearchPage />} />
							<Route path="/settings" element={<SettingsPage />} />
							<Route path="/privacy" element={<PrivacyPage />} />
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
					</Suspense>
				</Layout>
			</Router>
		</>
	)
}

export default App
