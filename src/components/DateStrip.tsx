
import React from "react";
import { cn } from "@/lib/utils";

interface DateStripProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateSelect }) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  const toYYYYMMDD = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="bg-card border border-border rounded-lg p-2 shadow-sm">
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const dateString = toYYYYMMDD(date);
          const isSelected = dateString === selectedDate;
          const isToday = toYYYYMMDD(new Date()) === dateString;

          return (
            <button
              key={dateString}
              onClick={() => onDateSelect(dateString)}
              className={cn(
                "px-2 py-3 rounded-md font-medium transition-all text-sm sm:text-base",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isToday && !isSelected && "border border-primary"
              )}
            >
              <div>{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div>{date.getDate()}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateStrip;
