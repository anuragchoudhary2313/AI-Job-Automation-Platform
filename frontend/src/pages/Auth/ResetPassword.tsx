import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthLayout } from './AuthLayout';
import { authService } from '../../services/auth.service';
import { toast } from '../../components/ui/Toast';
import { getErrorMessage } from '../../lib/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password has been reset successfully. You can now login.');
      navigate('/login');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="The password reset link is invalid or missing">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Please make sure you copied the full link from your email, or request a new one.
          </p>
          <div className="w-full space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate('/forgot-password')}
            >
              Request new link
            </Button>
            <Link to="/login" className="flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Please enter your new password">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-20 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              className="pl-10 pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          Reset Password
        </Button>

        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;
