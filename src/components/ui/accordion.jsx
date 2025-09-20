import * as React from "react";
import { cn } from "@/lib/utils";

export function Accordion({ children, className, ...props }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export function AccordionItem({ children, className, ...props }) {
  return (
    <div className={cn("rounded-2xl border border-gray-200", className)} {...props}>
      {children}
    </div>
  );
}

export function AccordionTrigger({ children, onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-left font-semibold flex justify-between items-center hover:bg-gray-50 transition rounded-t-2xl"
    >
      <span>{children}</span>
      <span>{isOpen ? "−" : "+"}</span>
    </button>
  );
}

export function AccordionContent({ children, isOpen }) {
  return isOpen ? (
    <div className="p-4 border-t border-gray-200 rounded-b-2xl">{children}</div>
  ) : null;
}
