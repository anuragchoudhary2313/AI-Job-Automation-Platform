import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { useToast } from '../../components/ui/Toast';
import { PasswordStrengthMeter, getPasswordStrength } from '../../components/ui/PasswordStrengthMeter';
import { getErrorMessage } from '../../lib/api';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const password = watch("password");
  const strength = getPasswordStrength(password || "");

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);

      // Register user (with 10s timeout)
      const registeredUser = await authService.register({
        email: data.email,
        password: data.password,
        full_name: data.fullName
      });

      // Auto-login immediately after registration for a faster onboarding flow.
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const loginResponse = await authService.login(formData);
      localStorage.setItem('access_token', loginResponse.access_token);
      localStorage.setItem('refresh_token', loginResponse.refresh_token);
      // Mark that we just logged in to skip re-verification in AuthContext
      localStorage.setItem('skip_auth_verification', 'true');

      const user = loginResponse.user ?? registeredUser;
      login(user);

      toast.success('Account created successfully! Welcome aboard.');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Get started with automated job applications">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="space-y-4">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 text-[#171717]/40 dark:text-white/60" />
            <Input
              id="fullName"
              placeholder="Full Name"
              className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717] dark:border-white/25 dark:bg-[#0f172a] dark:text-white dark:placeholder:text-white/55"
              autoFocus
              autoComplete="name"
              {...register('fullName')}
              error={errors.fullName?.message}
              success={!errors.fullName && dirtyFields.fullName}
            />
          </div>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 text-[#171717]/40 dark:text-white/60" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717] dark:border-white/25 dark:bg-[#0f172a] dark:text-white dark:placeholder:text-white/55"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
              success={!errors.email && dirtyFields.email}
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 text-[#171717]/40 dark:text-white/60" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 pr-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717] dark:border-white/25 dark:bg-[#0f172a] dark:text-white dark:placeholder:text-white/55"
                autoComplete="new-password"
                {...register('password')}
                error={errors.password?.message}
                success={!errors.password && dirtyFields.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 z-20 text-[#171717]/45 transition hover:text-[#171717] focus:outline-none dark:text-white/70 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {/* Password Strength Meter */}
            {dirtyFields.password && !errors.password && (
              <div className="px-1">
                <PasswordStrengthMeter score={strength.score} />
                <p className="text-xs text-gray-500 mt-1 text-right">{strength.label}</p>
              </div>
            )}
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 z-10 h-5 w-5 text-[#171717]/40 dark:text-white/60" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717] dark:border-white/25 dark:bg-[#0f172a] dark:text-white dark:placeholder:text-white/55"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              success={!errors.confirmPassword && dirtyFields.confirmPassword}
            />
          </div>
        </div>

        <div className="text-xs text-[#171717]/65">
          By clicking create account, you agree to our <a href="#" className="underline underline-offset-2 hover:text-[#171717]">Terms of Service</a> and <a href="#" className="underline underline-offset-2 hover:text-[#171717]">Privacy Policy</a>.
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-[#171717] text-white hover:bg-black"
          size="lg"
          isLoading={loading}
          disabled={!isValid}
        >
          Create Account
        </Button>

        <div className="mt-6 text-center text-sm text-[#171717]/65">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#171717] underline-offset-4 transition hover:underline">
            Sign in
          </Link>
        </div>
      </motion.form>
    </AuthLayout>
  );
}

export default Register;
