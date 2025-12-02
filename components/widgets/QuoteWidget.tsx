import React, { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'

const QUOTES = [
	{ text: "Twoja przyszłość zależy od tego, co robisz dzisiaj.", author: "Mahatma Gandhi" },
	{ text: "Nie musisz być wielki, żeby zacząć, ale musisz zacząć, żeby być wielki.", author: "Zig Ziglar" },
	{ text: "Sukces to suma niewielkich wysiłków powtarzanych dzień po dniu.", author: "Robert Collier" },
	{ text: "Jedyny sposób na wykonanie wielkiej pracy to kochanie tego, co robisz.", author: "Steve Jobs" },
	{ text: "Edukacja to najpotężniejsza broń, której możesz użyć, aby zmienić świat.", author: "Nelson Mandela" },
	{ text: "Najlepszą zemstą jest ogromny sukces.", author: "Frank Sinatra" },
	{ text: "Wszystko wydaje się niemożliwe, dopóki nie zostanie zrobione.", author: "Nelson Mandela" }
]

const QuoteWidget: React.FC = () => {
	const [quote, setQuote] = useState(QUOTES[0])

	useEffect(() => {
		// Random quote on mount
		const random = QUOTES[Math.floor(Math.random() * QUOTES.length)]
		setQuote(random)
	}, [])

	return (
		<div className="bg-surface p-5 rounded-2xl border border-border relative overflow-hidden h-full flex flex-col justify-between group hover:border-primary/30 transition-colors">
			{/* Decorative blob */}
			<div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-colors"></div>

			<div className="relative z-10">
				<Quote size={20} className="text-purple-400 mb-2 opacity-80" />
				<p className="text-sm font-medium text-main leading-relaxed italic">
					"{quote.text}"
				</p>
			</div>

			<div className="relative z-10 mt-3 text-right">
				<span className="text-[10px] font-bold text-muted uppercase tracking-wide">
					— {quote.author}
				</span>
			</div>
		</div>
	)
}

export default QuoteWidget
