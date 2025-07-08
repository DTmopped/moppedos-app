import React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[180px] w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
