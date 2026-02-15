import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { useToast } from '../../components/ui/Toast';
import { PasswordStrengthMeter, getPasswordStrength } from '../../components/ui/PasswordStrengthMeter';
import apiClient, { getErrorMessage } from '../../lib/api';

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

      // Register user
      await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.fullName
      });

      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Get started with automated job applications">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              placeholder="Full Name"
              className="pl-10"
              autoFocus
              {...register('fullName')}
              error={errors.fullName?.message}
              success={!errors.fullName && dirtyFields.fullName}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              type="email"
              placeholder="name@company.com"
              className="pl-10"
              {...register('email')}
              error={errors.email?.message}
              success={!errors.email && dirtyFields.email}
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pl-10 pr-10"
                {...register('password')}
                error={errors.password?.message}
                success={!errors.password && dirtyFields.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-20 focus:outline-none"
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
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="pl-10"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              success={!errors.confirmPassword && dirtyFields.confirmPassword}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          By clicking create account, you agree to our <a href="#" className="underline hover:text-gray-900 dark:hover:text-white">Terms of Service</a> and <a href="#" className="underline hover:text-gray-900 dark:hover:text-white">Privacy Policy</a>.
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={loading}
          disabled={!isValid}
        >
          Create Account
        </Button>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
