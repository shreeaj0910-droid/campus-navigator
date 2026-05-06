import React from 'react';

interface MapFloorToggleProps {
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
}

export default function MapFloorToggle({ activeFloor, setActiveFloor }: MapFloorToggleProps) {
  const floors = [
    { label: 'G', value: 0 },
    { label: '1', value: 1 },
    { label: '2', value: 2 },
  ];

  return (
    <div className="absolute bottom-24 right-4 z-50 flex items-center p-1.5 space-x-1.5 rounded-full bg-slate-900 border border-slate-700/50 shadow-xl backdrop-blur-sm">
      {floors.map((floor) => {
        const isActive = activeFloor === floor.value;
        return (
          <button
            key={floor.value}
            onClick={() => setActiveFloor(floor.value)}
            className={`
              relative flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full transition-all duration-300 ease-in-out
              ${isActive 
                ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.8)]' 
                : 'bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700'
              }
            `}
            aria-label={`Floor ${floor.label}`}
            aria-pressed={isActive}
          >
            {floor.label}
          </button>
        );
      })}
    </div>
  );
}
