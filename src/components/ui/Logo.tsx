import React from 'react'
import { motion } from 'framer-motion'

export const Logo = () => {
	const draw = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: (i: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: {
				pathLength: { delay: i * 0.3, duration: 1.2 },
				opacity: { delay: i * 0.3, duration: 0.01 },
			},
		}),
	}

	return (
		<motion.svg
			width="160"
			height="160"
			viewBox="0 0 100 100"
			initial="hidden"
			animate="visible"
			className="w-40 h-40 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]"
		>
			{/* Isometric Cube Outlines */}
			<g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
				{/* Top Face Outline */}
				<motion.path
					d="M 10 30 L 50 10 L 90 30 L 50 50 L 10 30 Z"
					stroke="#93c5fd"
					variants={draw}
					custom={0}
				/>
				{/* Bottom Left Face Outline */}
				<motion.path
					d="M 10 30 L 50 50 L 50 90 L 10 70 L 10 30 Z"
					stroke="#3b82f6"
					variants={draw}
					custom={1}
				/>
				{/* Bottom Right Face Outline */}
				<motion.path
					d="M 50 50 L 90 30 L 90 70 L 50 90 L 50 50 Z"
					stroke="#1d4ed8"
					variants={draw}
					custom={2}
				/>
			</g>

			{/* Letters with Professional Font */}
			<g style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
				{/* "U" on Top Face */}
				<motion.text
					x="50"
					y="30"
					textAnchor="middle"
					dominantBaseline="middle"
					fill="#bfdbfe"
					fontSize="28"
					transform="rotate(-45, 50, 30) scale(1, 0.58)"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.2, duration: 0.5 }}
				>
					U
				</motion.text>
				
				{/* "B" on Bottom Left Face */}
				<motion.text
					x="28"
					y="62"
					textAnchor="middle"
					dominantBaseline="middle"
					fill="#60a5fa"
					fontSize="28"
					transform="skewY(26.5)"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.4, duration: 0.5 }}
				>
					B
				</motion.text>

				{/* "B" on Bottom Right Face */}
				<motion.text
					x="72"
					y="62"
					textAnchor="middle"
					dominantBaseline="middle"
					fill="#93c5fd"
					fontSize="28"
					transform="skewY(-26.5)"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.6, duration: 0.5 }}
				>
					B
				</motion.text>
			</g>

			{/* Subtle Fill Fade In */}
			<motion.path
				d="M 10 30 L 50 10 L 90 30 L 50 50 Z"
				fill="#3b82f6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.1 }}
				transition={{ delay: 2, duration: 1 }}
			/>
			<motion.path
				d="M 10 30 L 50 50 L 50 90 L 10 70 Z"
				fill="#1d4ed8"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.1 }}
				transition={{ delay: 2.2, duration: 1 }}
			/>
			<motion.path
				d="M 50 50 L 90 30 L 90 70 L 50 90 Z"
				fill="#172554"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.1 }}
				transition={{ delay: 2.4, duration: 1 }}
			/>
		</motion.svg>
	)
}
