import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { getErrorMessage } from '../../lib/api';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  });

  const { login } = useAuth();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);

      // OAuth2 requires form data with 'username' field (not 'email')
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      // Login and get tokens (with 10s timeout)
      const response = await authService.login(formData);

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      // Mark that we just logged in to skip re-verification in AuthContext
      localStorage.setItem('skip_auth_verification', 'true');

      // Use user from login response; if missing, create minimal user object to avoid extra API call
      const user = response.user || {
        id: 'unknown',
        email: data.email,
        full_name: 'User',
        username: data.email,
        role: 'user',
        is_active: true
      };
      login(user);

      toast.success('Welcome back! Logged in successfully.');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your automation dashboard">
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="space-y-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-[#171717]/40 z-10" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717]"
              autoFocus
              autoComplete="username"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-[#171717]/40 z-10" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-11 rounded-xl border-[#171717]/15 bg-white/90 pl-10 pr-10 text-[#171717] placeholder:text-[#171717]/45 focus-visible:ring-[#171717]"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-[#171717]/45 transition hover:text-[#171717] z-20 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-[#171717]/72">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 rounded border-[#171717]/25 text-[#171717] focus:ring-[#171717] transition-colors"
              {...register('remember')}
            />
            <span className="transition-colors group-hover:text-[#171717]">Remember me</span>
          </label>
          <Link to="/forgot-password" className="font-semibold text-[#171717] underline-offset-4 transition hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-[#171717] text-white hover:bg-black"
          size="lg"
          isLoading={loading || isSubmitting}
          disabled={!isValid}
        >
          Sign In
        </Button>

        <div className="mt-6 text-center text-sm text-[#171717]/65">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-[#171717] underline-offset-4 transition hover:underline">
            Create account
          </Link>
        </div>
      </motion.form>
    </AuthLayout>
  );
}

export default Login;
