import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	className?: string
	scrollable?: boolean
	hideCloseButton?: boolean
}

const modalTitleId = 'modal-title'

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className, scrollable = true, hideCloseButton = false }) => {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		return () => setMounted(false)
	}, [])

	// Scroll Lock
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	if (!mounted) return null

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, transition: { delay: 0.3, duration: 0.3 } }}
						transition={{ duration: 0.3 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/70 z-[9998]"
					/>

					<motion.div
						key="modal-drawer"
						initial={{ x: '100%' }}
						animate={{ x: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
						exit={{ x: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
						className="fixed inset-y-0 right-0 z-[9999] flex flex-col w-[90%] max-w-[600px] shadow-2xl"
						style={{ height: '100dvh' }}
						role="dialog"
						aria-modal="true"
						aria-labelledby={title ? modalTitleId : undefined}
					>
						<div
							className={cn(
								"flex-1 bg-surface border-l border-white/10 w-full h-full flex flex-col relative overflow-hidden shadow-[-20px_0_50px_0_rgba(0,0,0,0.3)]",
								className
							)}
						>
							{/* Close Handler / Header Area */}
							<div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5 mb-0 bg-surface/50">
								<div className="flex items-center gap-3">
									<button
										onClick={onClose}
										className="flex items-center gap-1 pl-2 pr-4 py-2 -ml-2 hover:bg-white/10 rounded-full transition-colors group active:scale-95"
										aria-label="Zamknij panel"
									>
										<ChevronRight size={24} className="text-white/70 group-hover:text-white transition-colors" />
										<span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors">Wróć</span>
									</button>
									{title && (
										<h3 id={modalTitleId} className="text-lg font-display font-bold text-white line-clamp-1 ml-2 border-l border-white/10 pl-4">{title}</h3>
									)}
								</div>

								{!hideCloseButton && !title && (
									<button
										onClick={onClose}
										className="p-2 hover:bg-white/5 rounded-full transition-colors"
										aria-label="Zamknij panel"
									>
										<X size={20} className="text-muted" />
									</button>
								)}
							</div>


							<div className={cn(
								"flex-1 min-h-0 flex flex-col",
								scrollable ? "overflow-y-auto" : "overflow-hidden",
								"px-0 pb-0"
							)}>
								{children}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	)
}

export default Modal
