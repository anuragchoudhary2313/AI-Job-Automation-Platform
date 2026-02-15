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

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  plan: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended';
  joined: string;
}

const allUsers: User[] = [
  { id: 1, name: 'Anurag', email: 'anurag@admin.com', role: 'Admin', plan: 'Enterprise', status: 'Active', joined: 'Jan 1, 2026' },
  { id: 2, name: 'John Doe', email: 'john@user.com', role: 'User', plan: 'Pro', status: 'Active', joined: 'Feb 12, 2026' },
  { id: 3, name: 'Jane Smith', email: 'jane@user.com', role: 'User', plan: 'Free', status: 'Active', joined: 'Feb 15, 2026' },
  { id: 4, name: 'Bad Actor', email: 'spam@bot.com', role: 'User', plan: 'Free', status: 'Suspended', joined: 'Feb 18, 2026' },
];

export function UsersTable({ isLoading = false }: { isLoading?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const users = allUsers; // Using constant data for now

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleExportCSV = () => {
    console.log('Export CSV clicked!');
    toast.info('Exporting users to CSV...');
    // In a real app, this would generate and download a CSV file
    setTimeout(() => {
      toast.success('CSV export completed!');
    }, 1000);
  };

  const handleAddUser = () => {
    console.log('Add User clicked!');
    toast.info('Add user dialog would open here');
    // In a real app, this would open a modal/dialog to add a new user
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
    </div>
  );
}
