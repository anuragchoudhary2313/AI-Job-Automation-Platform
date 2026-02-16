import { useState } from 'react';
import { Search, MoreHorizontal, Shield, UserCog } from 'lucide-react';
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

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended';
  joined: string;
}

const initialUsers: User[] = [
  { id: 1, name: 'Anurag', email: 'anurag@admin.com', role: 'Admin', plan: 'Enterprise', status: 'Active', joined: 'Jan 1, 2026' },
  { id: 2, name: 'John Doe', email: 'john@user.com', role: 'User', plan: 'Pro', status: 'Active', joined: 'Feb 12, 2026' },
  { id: 3, name: 'Jane Smith', email: 'jane@user.com', role: 'User', plan: 'Free', status: 'Active', joined: 'Feb 15, 2026' },
  { id: 4, name: 'Bad Actor', email: 'spam@bot.com', role: 'User', plan: 'Free', status: 'Suspended', joined: 'Feb 18, 2026' },
];

export function UsersTable({ isLoading = false }: { isLoading?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: 'User',
    plan: 'Free',
    status: 'Active'
  });

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID,Name,Email,Role,Plan,Status,Joined'];
      const rows = filteredUsers.map(u =>
        `${u.id},"${u.name}","${u.email}",${u.role},${u.plan},${u.status},"${u.joined}"`
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
    setIsAddUserOpen(true);
  };

  const saveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const userToAdd: User = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      name: newUser.name,
      email: newUser.email,
      role: (newUser.role as 'Admin' | 'User') || 'User',
      plan: (newUser.plan as 'Free' | 'Pro' | 'Enterprise') || 'Free',
      status: 'Active',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    setUsers([...users, userToAdd]);
    setIsAddUserOpen(false);
    setNewUser({ role: 'User', plan: 'Free', status: 'Active' }); // Reset form
    toast.success('User added successfully');
  };

  const handleUserAction = (userName: string) => {
    toast.info(`Opening actions menu for ${userName}`);
    // In a real app, this would open a dropdown menu with actions like Edit, Delete, etc.
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users..." className="pl-9" disabled />
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
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="primary" onClick={handleAddUser}>Add User</Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={searchQuery ? "No users found" : "No users"}
          description={searchQuery ? `No users match "${searchQuery}"` : "Get started by adding a new user to the platform."}
          action={{ label: "Add User", onClick: handleAddUser }}
        />
      ) : (
        <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
          <Table>
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
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUserAction(user.name)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
        onClose={() => setIsAddUserOpen(false)}
        title="Add New User"
      >
        <form onSubmit={saveNewUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <Input
              placeholder="John Doe"
              value={newUser.name || ''}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="user-role" className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                id="user-role"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="user-plan" className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
              <select
                id="user-plan"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-950"
                value={newUser.plan}
                onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as any })}
              >
                <option value="Free">Free</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
