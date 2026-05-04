import { Navigation2 } from "lucide-react";

interface RouteDetailsProps {
  path: string[] | null | undefined;
  distanceUnits: number;
  onClear: () => void;
}

export default function RouteDetails({ path, distanceUnits, onClear }: RouteDetailsProps) {
  if (!path || path.length < 2) return null;

  // Assuming 1 map unit = 0.5 meters
  const distanceMeters = Math.round(distanceUnits * 0.5);
  // Average walking speed ~1.4 m/s => 84 meters/min
  const timeMinutes = Math.max(1, Math.ceil(distanceMeters / 84));

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[60] bg-white dark:bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] p-4 border border-gray-100 dark:border-border transition-transform animate-in slide-in-from-bottom-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full text-blue-600 dark:text-blue-400 shadow-sm">
            <Navigation2 size={24} className="fill-blue-600 dark:fill-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 dark:text-foreground leading-none mb-1">
              {timeMinutes} min
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-muted-foreground leading-none">
              ({distanceMeters} m)
            </span>
          </div>
        </div>

        <button
          onClick={onClear}
          className="bg-gray-100 dark:bg-muted text-gray-700 dark:text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-muted/80 transition-colors shadow-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
