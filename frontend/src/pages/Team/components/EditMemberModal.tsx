import { X, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useState, useEffect } from 'react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
  status: 'Active' | 'Invited' | 'Offline';
  lastActive: string;
  avatar?: string;
}

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSave: (memberId: number, newRole: Member['role']) => void;
}

export function EditMemberModal({ isOpen, onClose, member, onSave }: EditMemberModalProps) {
  const [role, setRole] = useState<Member['role']>('Member');

  useEffect(() => {
    if (member) {
      setRole(member.role);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSave = () => {
    onSave(member.id, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Team Member</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-gray-500">{member.name.substring(0, 2)}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{member.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="member-role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <select
                id="member-role"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 pl-10 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-50 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-900"
                value={role}
                onChange={(e) => setRole(e.target.value as Member['role'])}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admins have full access. Members can manage jobs and bots. Viewers can only see reports.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
