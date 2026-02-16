import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface AnimatedButtonProps extends React.ComponentProps<typeof motion.button> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children?: React.ReactNode;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, onClick, ...props }, ref) => {

    // Ripple State
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);

    const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      if (onClick) onClick(e);

      // Clean up ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    // Base styles
    const baseStyles = "relative overflow-hidden inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none";

    // Variants
    const variantsStyles = {
      primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
      outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
      ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
    };

    // Sizes
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variantsStyles[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        onClick={addRipple}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {/* Ripple Container */}
        <span className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-md">
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute bg-white/30 rounded-full animate-ripple"
              // eslint-disable-next-line
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 0,
                height: 0,
              }}
            />
          ))}
        </span>

        {/* Content */}
        <span className="relative z-10 flex items-center">
          {isLoading && (
            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {children}
        </span>
      </motion.button>
    );
  }
);
AnimatedButton.displayName = "AnimatedButton";

export { AnimatedButton };
