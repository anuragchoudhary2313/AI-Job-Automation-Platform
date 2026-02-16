import * as React from "react"
import { cn } from "../../lib/utils"
import { Check, AlertCircle } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, success, id, ...props }, ref) => {
    // Generate simple ID if needed for label association
    const inputId = id || props.name || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-600 transition-all duration-200",
              error && "border-red-500 focus-visible:ring-red-500 pr-10",
              success && "border-emerald-500 focus-visible:ring-emerald-500 pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {success && !error && (
            <div className="absolute right-3 top-2.5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200">
              <Check className="h-5 w-5" />
            </div>
          )}
          {error && (
            <div className="absolute right-3 top-2.5 text-red-500 animate-in fade-in zoom-in-50 duration-200">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1 duration-200 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
