import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { usePoints } from "../hooks/usePoints";
import clsx from "clsx";

const PointsDock = () => {
  const points = usePoints();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Outside click close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Pulse on points update
  useEffect(() => {
    if (!points) return;

    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [
    points,
    points?.reformerPoints,
    points?.matPoints,
    points?.hotPoints,
    points?.nutritionPoints,
  ]);

  if (!points) return null;

  const total =
    points.reformerPoints +
    points.matPoints +
    points.hotPoints +
    points.nutritionPoints;

  return (
    <div ref={ref} className="fixed top-[72px] right-4 z-40">
      <div
        className={clsx(
          "overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 ease-out",
          open ? "w-[300px]" : "w-[60px]"
        )}
      >
        {/* Trigger */}
        <button
          onClick={() => setOpen((p) => !p)}
          className={clsx(
            "flex h-[48px] w-full items-center justify-center text-sm font-semibold transition",
            pulse && "animate-pulse"
          )}
        >
          {total}
        </button>

        {/* Expandable */}
        <div
          className={clsx(
            "transition-all duration-300 ease-out",
            open ? "max-h-[260px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Your Points</h3>
              <button onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Reformer" value={points.reformerPoints} />
              <Row label="Mat Pilates & Hatha Yoga" value={points.matPoints} />
              <Row label="Hot Yoga & Hot Pilates" value={points.hotPoints} />
              <Row label="Nutritional" value={points.nutritionPoints} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between rounded-md border px-3 py-2">
    <span>{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default PointsDock;
