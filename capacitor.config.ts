import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.unischedule.app',
	appName: 'UniSchedule',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
		// LIVE RELOAD - wyłączony (normalna aplikacja offline)
		// url: 'http://192.168.1.122:5173',
		// cleartext: true,
	},
	plugins: {
		SplashScreen: {
			launchShowDuration: 0, // Wyłącz natywny splash - używamy własnego
			backgroundColor: '#0f1115', // Tło takie jak w Preloader
			androidSplashResourceName: 'splash',
			androidScaleType: 'CENTER_CROP',
			showSpinner: false,
			androidSpinnerStyle: 'large',
			iosSpinnerStyle: 'small',
			spinnerColor: '#999999',
			splashFullScreen: true,
			splashImmersive: true,
			launchAutoHide: false, // Ręczne ukrywanie po animacji
		},
		StatusBar: {
			style: 'dark',
			backgroundColor: '#000000',
		},
	},
}

export default config
