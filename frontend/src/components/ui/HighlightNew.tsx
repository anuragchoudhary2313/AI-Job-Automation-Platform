import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface HighlightNewProps {
  isNew?: boolean;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}

export function HighlightNew({
  isNew = false,
  duration = 2000,
  children,
  className
}: HighlightNewProps) {
  const [showHighlight, setShowHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), duration);
      return () => clearTimeout(timer);
    } else {
      setShowHighlight(false);
    }
  }, [isNew, duration]);

  return (
    <motion.div
      className={className}
      animate={{
        backgroundColor: showHighlight
          ? "rgba(34, 197, 94, 0.1)" // green-500 with 10% opacity
          : "rgba(0, 0, 0, 0)"
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
