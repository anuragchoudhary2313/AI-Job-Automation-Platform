import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
// Using simple portal-less implementation for minimal dependency requirement
// In production, use Radix Dialog or React Portal

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn("relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-950 dark:border dark:border-gray-800", className)}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm hover:bg-gray-100 p-1 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {title && (
          <div className="mb-4 text-lg font-semibold leading-none tracking-tight">
            {title}
          </div>
        )}

        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
