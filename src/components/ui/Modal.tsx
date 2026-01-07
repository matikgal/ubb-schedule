import React, { useEffect, useState, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
	hideBackButton?: boolean
}

const modalTitleId = 'modal-title'
const SWIPE_THRESHOLD = 80

const Modal: React.FC<ModalProps> = memo(({ isOpen, onClose, title, children, className, scrollable = true, hideBackButton = false }) => {
	const [mounted, setMounted] = useState(false)
	const touchStartX = useRef<number>(0)
	const [swipeOffset, setSwipeOffset] = useState(0)

	useEffect(() => {
		setMounted(true)
		return () => setMounted(false)
	}, [])

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

	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX
	}

	const handleTouchMove = (e: React.TouchEvent) => {
		const diff = e.touches[0].clientX - touchStartX.current
		if (diff > 0) {
			setSwipeOffset(diff)
		}
	}

	const handleTouchEnd = () => {
		if (swipeOffset > SWIPE_THRESHOLD) {
			onClose()
		}
		setSwipeOffset(0)
	}

	if (!mounted) return null

	return createPortal(
		<AnimatePresence mode="wait">
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/70 z-[9998]"
						style={{ willChange: 'opacity' }}
					/>

					<motion.div
						key="modal-drawer"
						initial={{ x: '100%' }}
						animate={{ x: swipeOffset }}
						exit={{ x: '100%' }}
						transition={{
							type: 'tween',
							duration: swipeOffset > 0 ? 0 : 0.2,
							ease: 'easeOut'
						}}
						className="fixed inset-y-0 right-0 z-[9999] flex flex-col w-[90%] max-w-[600px]"
						style={{
							height: '100dvh',
							willChange: 'transform',
							transform: 'translateZ(0)',
							backfaceVisibility: 'hidden'
						}}
						role="dialog"
						aria-modal="true"
						aria-labelledby={title ? modalTitleId : undefined}
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
					>
						<div
							className={cn(
								"flex-1 bg-surface border-l border-border w-full h-full flex flex-col relative overflow-hidden shadow-2xl",
								className
							)}
						>
							<div className="flex items-center justify-end px-6 pt-14 pb-4 shrink-0 border-b border-border bg-surface">
								{title && (
									<h3 id={modalTitleId} className="text-lg font-display font-bold text-main line-clamp-1">{title}</h3>
								)}
							</div>

							<div className={cn(
								"flex-1 min-h-0 flex flex-col pt-4",
								scrollable ? "overflow-y-auto" : "overflow-hidden",
								"px-0 pb-0"
							)}>
								{children}

								{!hideBackButton && (
									<div className="p-6 pt-4">
										<button
											onClick={onClose}
											className="w-full py-3 bg-hover border border-border text-muted rounded-2xl font-medium text-sm hover:text-main hover:bg-surface active:scale-[0.98] transition-colors"
										>
											Wróć
										</button>
									</div>
								)}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	)
})

Modal.displayName = 'Modal'

export default Modal
