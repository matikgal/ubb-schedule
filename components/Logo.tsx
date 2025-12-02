import React from 'react'
import { motion } from 'framer-motion'

export const Logo = () => {
	const draw = {
		hidden: { pathLength: 0, opacity: 0 },
		visible: (i: number) => ({
			pathLength: 1,
			opacity: 1,
			transition: {
				pathLength: { delay: i * 0.2, duration: 1.5 },
				opacity: { delay: i * 0.2, duration: 0.01 },
			},
		}),
	}

	return (
		<motion.svg
			width="120"
			height="120"
			viewBox="0 0 100 100"
			initial="hidden"
			animate="visible"
			className="w-32 h-32 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
		>
			{/* Isometric U Shape */}
			{/* Left Face */}
			<motion.path
				d="M 20 20 L 20 80 L 50 95 L 50 35 L 20 20 Z"
				fill="none"
				stroke="#3b82f6"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={draw}
				custom={0}
			/>
			{/* Right Face (Inner) */}
			<motion.path
				d="M 50 95 L 80 80 L 80 20 L 50 35 L 50 95 Z"
				fill="none"
				stroke="#60a5fa"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={draw}
				custom={1}
			/>
			{/* Top Face (Left) */}
			<motion.path
				d="M 20 20 L 50 5 L 50 35 L 20 20 Z"
				fill="none"
				stroke="#93c5fd"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={draw}
				custom={2}
			/>
			{/* Top Face (Right) */}
			<motion.path
				d="M 50 5 L 80 20 L 50 35 L 50 5 Z"
				fill="none"
				stroke="#bfdbfe"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				variants={draw}
				custom={3}
			/>
			
			{/* Fill Animation (Optional overlay to fill color later) */}
			<motion.path
				d="M 20 20 L 20 80 L 50 95 L 80 80 L 80 20 L 50 35 L 20 20 L 50 5 Z"
				fill="#3b82f6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 0.1 }}
				transition={{ delay: 2, duration: 1 }}
			/>
		</motion.svg>
	)
}
