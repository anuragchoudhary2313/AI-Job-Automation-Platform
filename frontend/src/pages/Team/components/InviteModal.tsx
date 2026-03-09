import { useState } from 'react';
import { X, Mail, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { toast } from '../../../components/ui/Toast';
import apiClient from '../../../lib/api';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
}

export function InviteModal({ isOpen, onClose, onInvited }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/teams/invite', { email, role });
      toast.success(response.data.message || 'Invitation sent!');
      setEmail('');
      setRole('user');
      onInvited?.();
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      const message = axiosError?.response?.data?.detail || 'Failed to send invitation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('user');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="colleague@company.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <select
                id="invite-role"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admins have full access. Members can manage jobs and bots.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={loading} disabled={!email.trim()}>
            Send Invitation
          </Button>
        </div>
      </div>
    </div>
  );
}
