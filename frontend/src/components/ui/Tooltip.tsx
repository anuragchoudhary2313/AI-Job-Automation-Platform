import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

export function Tooltip({ content, children, side = "right", className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (side) {
      case "right": return "left-full top-1/2 -translate-y-1/2 ml-2";
      case "left": return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "top": return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom": return "top-full left-1/2 -translate-x-1/2 mt-2";
      default: return "left-full top-1/2 -translate-y-1/2 ml-2";
    }
  };

  return (
    <div
      className={cn("relative flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15, delay: 0.2 }}
            className={cn(
              "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg dark:bg-gray-100 dark:text-gray-900 whitespace-nowrap pointer-events-none",
              getPositionStyles()
            )}
          >
            {content}
            {/* Arrow */}
            <div className={cn(
              "absolute w-0 h-0 border-4 border-transparent",
              side === "right" && "border-r-gray-900 dark:border-r-gray-100 right-full top-1/2 -translate-y-1/2 -mr-[1px]",
              side === "left" && "border-l-gray-900 dark:border-l-gray-100 left-full top-1/2 -translate-y-1/2 -ml-[1px]",
              side === "top" && "border-t-gray-900 dark:border-t-gray-100 top-full left-1/2 -translate-x-1/2 -mt-[1px]",
              side === "bottom" && "border-b-gray-900 dark:border-b-gray-100 bottom-full left-1/2 -translate-x-1/2 -mb-[1px]"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
