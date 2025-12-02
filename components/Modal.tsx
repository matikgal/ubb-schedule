import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className, scrollable = true, hideCloseButton = false }) => {
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

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
					/>
					
					{/* Modal Content */}
					<motion.div
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ type: 'spring', damping: 25, stiffness: 300 }}
						className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none p-4 pt-[15vh]"
					>
						<div 
							className={cn(
								"bg-surface border border-border rounded-3xl w-full max-w-md shadow-2xl pointer-events-auto max-h-[85vh] flex flex-col relative overflow-hidden",
								className
							)}
						>
							{/* Close Button (Absolute) */}
							{!title && !hideCloseButton && (
								<button 
									onClick={onClose} 
									className="absolute top-4 right-4 p-2 hover:bg-hover rounded-full transition-colors z-10"
								>
									<X size={20} className="text-muted" />
								</button>
							)}

							{/* Header (if title exists) */}
							{title && (
								<div className="flex justify-between items-center p-6 pb-2 shrink-0">
									<h3 className="text-xl font-display font-bold text-main">{title}</h3>
									<button 
										onClick={onClose} 
										className="p-2 hover:bg-hover rounded-full transition-colors"
									>
										<X size={20} className="text-muted" />
									</button>
								</div>
							)}

							<div className={cn(
								"flex-1 min-h-0 flex flex-col",
								scrollable ? "overflow-y-auto" : "overflow-hidden",
								title ? "px-6 pb-6" : (scrollable ? "p-6" : "")
							)}>
								{children}
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}

export default Modal
