import React from 'react';

interface FloorIslandProps {
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
}

export default function FloorIsland({ activeFloor, setActiveFloor }: FloorIslandProps) {
  // Ordered top-to-bottom as requested: '2' (Top), '1' (Middle), and 'G' (Bottom)
  const floors = [
    { label: '2', value: 2 },
    { label: '1', value: 1 },
    { label: 'G', value: 0 },
  ];

  return (
    <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-lg shadow-cyan-900/20">
      {floors.map((floor) => {
        const isActive = activeFloor === floor.value;
        return (
          <button
            key={floor.value}
            onClick={() => setActiveFloor(floor.value)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300
              ${isActive 
                ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.6)]' 
                : 'text-slate-300 hover:bg-slate-800'
              }
            `}
            aria-label={`Floor ${floor.label}`}
          >
            {floor.label}
          </button>
        );
      })}
    </div>
  );
}
