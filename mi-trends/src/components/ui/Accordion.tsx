"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string | null;
  className?: string;
  /** When false, opening one row closes the others. */
  allowMultiple?: boolean;
}

export function Accordion({
  items,
  defaultOpen = null,
  className,
  allowMultiple = false,
}: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen ? [defaultOpen] : []);

  const toggle = (id: string) => {
    setOpen((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div className={cn("divide-y divide-hairline border-y border-hairline", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left transition-colors hover:text-accent"
            >
              <span className="text-label uppercase tracking-[0.1em] text-ink">
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: EASE_TACTILE }}
                className="shrink-0 text-muted"
              >
                <Plus className="h-5 w-5" aria-hidden />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-panel-${item.id}`}
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_TACTILE }}
                  className="overflow-hidden"
                >
                  <div className="pb-8 text-body-sm leading-relaxed text-muted">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
