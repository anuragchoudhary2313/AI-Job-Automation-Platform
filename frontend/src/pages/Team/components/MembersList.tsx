import { MoreHorizontal, Shield, Users } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface Member {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Member' | 'Viewer';
  status: 'Active' | 'Invited' | 'Offline';
  lastActive: string;
  avatar?: string;
}

const members: Member[] = [
  { id: 1, name: 'Alex Johnson', email: 'alex@company.com', role: 'Admin', status: 'Active', lastActive: 'Now', avatar: 'https://placehold.co/100x100/png?text=AJ' },
  { id: 2, name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Member', status: 'Active', lastActive: '2h ago', avatar: 'https://placehold.co/100x100/png?text=SW' },
  { id: 3, name: 'Mike Brown', email: 'mike@company.com', role: 'Viewer', status: 'Offline', lastActive: '2d ago', avatar: 'https://placehold.co/100x100/png?text=MB' },
  { id: 4, name: 'Emily Davis', email: 'emily@company.com', role: 'Member', status: 'Invited', lastActive: '-', avatar: undefined },
];

export function MembersList({ isLoading = false }: { isLoading?: boolean }) {
  if (isLoading) {
    return <LoadingTable columnCount={5} headers={['User', 'Role', 'Status', 'Last Active', 'Actions']} />;
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No users found"
        description="Invite information, or manage access to your team."
        action={{ label: "Invite Member", onClick: () => console.log("Invite clicked") }}
      />
    );
  }

  return (
    <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="p-4 border-b dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Team Members</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage who has access to this workspace.</p>
      </div>
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-gray-500">{member.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{member.role}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={member.status === 'Active' ? 'success' : member.status === 'Invited' ? 'warning' : 'secondary'}>
                  {member.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                {member.lastActive}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
