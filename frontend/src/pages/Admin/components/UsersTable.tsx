import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MoreHorizontal, Shield, UserCog, UserX, UserCheck, Trash2, Key } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import apiClient from '../../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended';
  joined: string;
}

export function UsersTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: 'User',
    plan: 'Free',
  });

  // Temp Password display
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  // Actions menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (search = '') => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<User[]>('/admin/users', {
        params: { search: search || undefined }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, fetchUsers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Click outside listener to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the click is not on a menu toggle or the menu itself, close it
      if (!(event.target as HTMLElement).closest('.user-menu-container')) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    try {
      const headers = ['ID,Name,Email,Role,Plan,Status,Joined'];
      const rows = users.map(u =>
        `"${u.id}","${u.name}","${u.email}",${u.role},${u.plan},${u.status},"${u.joined}"`
      );
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Users exported to CSV successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleAddUser = () => {
    setCreatedPassword(null);
    setNewUser({ role: 'User', plan: 'Free' });
    setIsAddUserOpen(true);
  };

  const saveNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/admin/users', {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        plan: newUser.plan
      });

      toast.success('User added successfully');
      setCreatedPassword(response.data.temp_password);
      fetchUsers(searchQuery);

      // We don't close the modal immediately so they can see the password
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to create user';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    const isActivating = user.status === 'Suspended';
    try {
      await apiClient.put(`/admin/users/${user.id}/status`, {
        is_active: isActivating
      });
      toast.success(`User ${isActivating ? 'activated' : 'suspended'} successfully`);
      setActiveMenuId(null);
      fetchUsers(searchQuery);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to update user status';
      toast.error(msg);
    }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!userId || userId === 'undefined') {
      console.error('Attempted to delete user with invalid ID:', userId, name);
      toast.error('Cannot delete: Invalid user ID');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      setActiveMenuId(null);
      fetchUsers(searchQuery);
    } catch (error: any) {
      console.error('Delete user failed:', error);
      const msg = error.response?.data?.detail || 'Failed to delete user';
      toast.error(msg);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users..." className="pl-9" value="" disabled />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>Export CSV</Button>
            <Button variant="primary" disabled>Add User</Button>
          </div>
        </div>
        <LoadingTable columnCount={6} headers={['User', 'Role', 'Plan', 'Status', 'Joined', 'Actions']} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={users.length === 0}>
            Export CSV
          </Button>
          <Button variant="primary" onClick={handleAddUser}>Add User</Button>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={searchQuery ? "No users found" : "No users"}
          description={searchQuery ? `No users match "${searchQuery}"` : "Get started by adding a new user to the platform."}
          action={{ label: "Add User", onClick: handleAddUser }}
        />
      ) : (
        <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950">
          <Table className="overflow-visible">
            <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id || `user-${index}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === 'Admin' ? <Shield className="h-3 w-3 text-blue-500" /> : <UserCog className="h-3 w-3 text-gray-400" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
                      {user.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'success' : 'danger'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{user.joined}</TableCell>
                  <TableCell className="text-right relative user-menu-container">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menuId = `${user.id}-${index}`;
                        setActiveMenuId(activeMenuId === menuId ? null : menuId);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {/* Simplified dropdown menu for actions */}
                    {activeMenuId === `${user.id}-${index}` && (
                      <div className="absolute right-8 top-10 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {user.status === 'Active' ? (
                              <><UserX className="h-4 w-4 mr-2" /> Suspend User</>
                            ) : (
                              <><UserCheck className="h-4 w-4 mr-2" /> Activate User</>
                            )}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete permanently
                          </button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          setIsAddUserOpen(false);
          setCreatedPassword(null);
        }}
        title="Add New User"
      >
        {createdPassword ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="text-green-800 dark:text-green-300 font-medium mb-1">User created successfully!</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                Please securely share these credentials with the new user. They will be forced to change their password on first login.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <div className="font-mono bg-white dark:bg-gray-950 p-2 rounded border dark:border-gray-800">{newUser.email}</div>

                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mt-3">
                  <Key className="w-3 h-3" /> Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-lg bg-white dark:bg-gray-950 p-2 rounded border dark:border-gray-800 select-all">
                    {createdPassword}
                  </code>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setIsAddUserOpen(false)} variant="primary">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={saveNewUser} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <Input
                placeholder="John Doe"
                value={newUser.name || ''}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newUser.email || ''}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="user-role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select
                  id="user-role"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 disabled:opacity-50"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  disabled={isSubmitting}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="user-plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <select
                  id="user-plan"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950 disabled:opacity-50"
                  value={newUser.plan}
                  onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as any })}
                  disabled={isSubmitting}
                >
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                Create User
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
