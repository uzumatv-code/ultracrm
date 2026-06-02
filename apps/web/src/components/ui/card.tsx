import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-950", className)} {...props} />;
}
