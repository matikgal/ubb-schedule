import React from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <span className="text-3xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-display font-bold text-main mb-2">
                        Coś poszło nie tak
                    </h1>
                    <p className="text-sm text-muted mb-6 max-w-xs">
                        Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć aplikację.
                    </p>
                    <button
                        onClick={this.handleReload}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw size={16} />
                        Odśwież aplikację
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
