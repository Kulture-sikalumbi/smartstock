import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accent?: "default" | "amber" | "emerald";
}

export function StatCard({ title, value, icon: Icon, accent = "default" }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            accent === "amber" && "text-amber-500",
            accent === "emerald" && "text-emerald-600",
            accent === "default" && "text-zinc-400"
          )}
        />
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      </CardContent>
    </Card>
  );
}
