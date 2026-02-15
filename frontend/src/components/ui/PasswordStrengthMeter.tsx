import { cn } from "../../lib/utils";

interface PasswordStrengthMeterProps {
  score: number; // 0 to 4
}

export function PasswordStrengthMeter({ score }: PasswordStrengthMeterProps) {
  return (
    <div className="flex gap-1 h-1 w-full mt-2">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={cn(
            "h-full flex-1 rounded-full transition-all duration-300",
            score >= level
              ? score <= 2
                ? "bg-red-500"
                : score === 3
                  ? "bg-yellow-500"
                  : "bg-emerald-500"
              : "bg-gray-200 dark:bg-gray-800"
          )}
        />
      ))}
    </div>
  );
}

export function getPasswordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "Enter password" };

  let score = 0;
  if (password.length > 6) score++;
  if (password.length > 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4
  if (score > 4) score = 4;

  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  return { score, label: labels[score] || "Weak" };
}
