import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface SuccessPulseProps {
  trigger?: boolean;
  color?: string;
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

export function SuccessPulse({
  trigger = false,
  color = "bg-green-500",
  duration = 0.6,
  className,
  children
}: SuccessPulseProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {trigger && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-lg pointer-events-none",
            color
          )}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
