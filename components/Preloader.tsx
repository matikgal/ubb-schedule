import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  onFinish: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);
  // Adjusted total duration to sync perfectly with the end of the fill animation + buffer
  // Timeline:
  // 0.0s - 1.5s: Plan Zajęć
  // 1.2s - 3.2s: UBB Strokes (Draw)
  // 3.0s - 4.2s: Radial Fill (Finish)
  // 4.8s: Fade Out
  const totalDuration = 4800; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 800); 
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#0f1115] flex flex-col items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center justify-center w-full max-w-md mb-12">
        
        {/* Neon Glow Background */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full opacity-0 animate-[fadeIn_2s_ease-out_3.5s_forwards]"></div>

        {/* 1. "Plan Zajęć" */}
        <div className="relative z-10 mb-[-20px]">
           <svg width="320" height="80" viewBox="0 0 320 80" className="w-80 h-20">
               <text 
                  x="50%" 
                  y="65%" 
                  textAnchor="middle" 
                  className="font-cursive text-6xl fill-transparent stroke-white"
                  strokeWidth="0.8"
                  style={{ 
                      strokeDasharray: 600, 
                      strokeDashoffset: 600,
                      animation: 'draw-path 1.5s ease-in-out forwards'
                  }}
                >
                  Plan Zajęć
               </text>
               <text 
                  x="50%" 
                  y="65%" 
                  textAnchor="middle" 
                  className="font-cursive text-6xl fill-white stroke-none opacity-0"
                  style={{
                      animation: 'fadeIn 0.5s ease-out 1.2s forwards'
                  }}
                >
                  Plan Zajęć
               </text>
           </svg>
        </div>

        {/* 2. "UBB" - Sequential Draw & Radial Fill */}
        <div className="relative z-10 w-full h-40 flex items-center justify-center">
           <svg width="400" height="150" viewBox="0 0 400 150">
              <defs>
                 {/* Define the text shape for the mask/clip */}
                 <clipPath id="ubb-text-clip">
                    <text x="25%" y="80%" textAnchor="middle" className="font-anton text-9xl">U</text>
                    <text x="50%" y="80%" textAnchor="middle" className="font-anton text-9xl">B</text>
                    <text x="75%" y="80%" textAnchor="middle" className="font-anton text-9xl">B</text>
                 </clipPath>

                 {/* Gradient Fill */}
                 <linearGradient id="ubbGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" /> {/* blue-500 (Vibrant) */}
                    <stop offset="100%" stopColor="#172554" /> {/* blue-950 (Deep) */}
                 </linearGradient>
              </defs>

              <style>
                {`
                    @keyframes drawStroke {
                        from { stroke-dashoffset: 1500; }
                        to { stroke-dashoffset: 0; }
                    }

                    @keyframes strokeColorChange {
                        0% { stroke: white; }
                        60% { stroke: white; }
                        100% { stroke: #3b82f6; } /* Turns to Blue-500 */
                    }

                    @keyframes radialExpand {
                        from { r: 0; }
                        to { r: 550; } 
                    }

                    /* Text Drawing & Color Change Combined */
                    .letter-u { 
                        animation: 
                            drawStroke 2.0s ease-in-out 1.2s forwards,
                            strokeColorChange 2.0s ease-in-out 1.2s forwards;
                    }
                    .letter-b1 { 
                        animation: 
                            drawStroke 2.0s ease-in-out 1.5s forwards,
                            strokeColorChange 2.0s ease-in-out 1.5s forwards;
                    }
                    .letter-b2 { 
                        animation: 
                            drawStroke 2.0s ease-in-out 1.8s forwards,
                            strokeColorChange 2.0s ease-in-out 1.8s forwards;
                    }
                    
                    /* Fill Animation */
                    .fill-circle {
                        animation: radialExpand 1.2s ease-in-out 3.0s forwards;
                    }
                `}
              </style>

              {/* The Blue Gradient Fill (Masked by text) - Expanding Circle from Bottom Left */}
              <g clipPath="url(#ubb-text-clip)">
                  <circle 
                      cx="0" cy="150" r="0" 
                      fill="url(#ubbGradient)" 
                      className="fill-circle"
                  />
              </g>

              {/* The Outlines (Drawn on top, changing color) */}
              <g fill="transparent" strokeWidth="1.5">
                  <text 
                      x="25%" y="80%" textAnchor="middle" 
                      className="font-anton text-9xl letter-u"
                      style={{ strokeDasharray: 1500, strokeDashoffset: 1500 }}
                  >U</text>
                  
                  <text 
                      x="50%" y="80%" textAnchor="middle" 
                      className="font-anton text-9xl letter-b1"
                      style={{ strokeDasharray: 1500, strokeDashoffset: 1500 }}
                  >B</text>
                  
                  <text 
                      x="75%" y="80%" textAnchor="middle" 
                      className="font-anton text-9xl letter-b2"
                      style={{ strokeDasharray: 1500, strokeDashoffset: 1500 }}
                  >B</text>
              </g>
           </svg>
        </div>
      </div>

      {/* Footer: Version & Progress */}
      <div className="absolute bottom-12 w-full max-w-[280px] flex flex-col gap-2">
          <div className="flex justify-between items-end text-[10px] font-bold tracking-widest text-gray-500 uppercase">
              <span>Wersja 2.4.1</span>
              <span>Sync: 15 Paź</span>
          </div>
          
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ 
                      width: '0%',
                      animation: `progressFill ${totalDuration}ms linear forwards` 
                  }}
              ></div>
          </div>
          <style>
            {`
                @keyframes progressFill {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}
          </style>
      </div>
      
    </div>
  );
};

export default Preloader;