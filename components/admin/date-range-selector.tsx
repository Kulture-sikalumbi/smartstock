"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangeOption = "today" | "last7days" | "thismonth" | "alltime";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeSelectorProps {
  selectedRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption, dates: DateRange) => void;
}

function getDateRange(option: DateRangeOption): DateRange {
  const now = new Date();
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  let startDate: Date;

  switch (option) {
    case "today":
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      break;
    case "last7days":
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "thismonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case "alltime":
      startDate = new Date(0);
      break;
  }

  return { startDate, endDate };
}

function getOptionLabel(option: DateRangeOption): string {
  switch (option) {
    case "today":
      return "Today";
    case "last7days":
      return "Last 7 days";
    case "thismonth":
      return "This month";
    case "alltime":
      return "All time";
  }
}

const OPTIONS: DateRangeOption[] = ["today", "last7days", "thismonth", "alltime"];

export function DateRangeSelector({
  selectedRange,
  onRangeChange,
}: DateRangeSelectorProps) {
  return (
    <Select
      value={selectedRange}
      onValueChange={(value) => {
        const option = value as DateRangeOption;
        const dates = getDateRange(option);
        onRangeChange(option, dates);
      }}
    >
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="Select date range" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {getOptionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
