import { useState, useRef, useEffect, useCallback } from 'react';
import { MoreHorizontal, Shield, Users, Edit2, Trash2, Mail } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingTable } from '../../../components/ui/LoadingTable';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../components/ui/Toast';
import { EditMemberModal } from './EditMemberModal';
import apiClient from '../../../lib/api';

export interface Member {
  id: string;
  _id?: string;
  full_name?: string;
  name?: string;
  email: string;
  role: string;
  is_active?: boolean;
  status?: 'Active' | 'Invited' | 'Offline';
  lastActive?: string;
  avatar?: string;
  username?: string;
}

interface MembersListProps {
  isLoading?: boolean;
  refreshKey?: number;
}

export function MembersList({ isLoading: externalLoading = false, refreshKey = 0 }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/teams/members');
      setMembers(response.data);
    } catch (error: any) {
      // If 403 or no team, show empty list
      if (error?.response?.status !== 403) {
        console.error('Failed to fetch team members:', error);
      }
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers, refreshKey]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getMemberId = (member: Member): string => {
    return member._id || member.id;
  };

  const getMemberName = (member: Member): string => {
    return member.full_name || member.name || member.username || member.email;
  };

  const getMemberRole = (member: Member): string => {
    const role = member.role || 'user';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getMemberStatus = (member: Member): 'Active' | 'Invited' | 'Offline' => {
    if (member.status) return member.status;
    return member.is_active ? 'Active' : 'Offline';
  };

  const handleEditRole = (member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSaveRole = async (memberId: number | string, newRole: string) => {
    const id = String(memberId);
    try {
      setActionLoading(id);
      // Map display role names to backend values
      const roleMap: Record<string, string> = {
        'Admin': 'admin',
        'Member': 'user',
        'Viewer': 'user',
        'admin': 'admin',
        'user': 'user',
      };
      const backendRole = roleMap[newRole] || newRole.toLowerCase();

      await apiClient.put(`/teams/members/${id}/role`, { role: backendRole });
      toast.success(`Role updated successfully`);

      // Update local state
      setMembers(prev => prev.map(m =>
        getMemberId(m) === id ? { ...m, role: backendRole } : m
      ));
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to update role';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (member: Member) => {
    const id = getMemberId(member);
    const name = getMemberName(member);

    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) {
      setActiveMenuId(null);
      return;
    }

    try {
      setActionLoading(id);
      await apiClient.delete(`/teams/members/${id}`);
      toast.success(`${name} removed from team`);

      // Remove from local state
      setMembers(prev => prev.filter(m => getMemberId(m) !== id));
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to remove member';
      toast.error(message);
    } finally {
      setActionLoading(null);
      setActiveMenuId(null);
    }
  };

  const handleResendInvite = async (member: Member) => {
    try {
      setActionLoading(getMemberId(member));
      await apiClient.post('/teams/invite', {
        email: member.email,
        role: member.role || 'user'
      });
      toast.success(`Invitation resent to ${member.email}`);
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to resend invite';
      toast.error(message);
    } finally {
      setActionLoading(null);
      setActiveMenuId(null);
    }
  };

  const isProcessing = externalLoading || loading;

  if (isProcessing) {
    return <LoadingTable columnCount={5} headers={['User', 'Role', 'Status', 'Last Active', 'Actions']} />;
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No team members"
        description="Invite team members to collaborate on job automation."
        action={{ label: "Invite Member", onClick: () => console.log("Invite clicked") }}
      />
    );
  }

  return (
    <>
      <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden relative min-h-[400px]">
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
            {members.map((member) => {
              const id = getMemberId(member);
              const name = getMemberName(member);
              const displayRole = getMemberRole(member);
              const status = getMemberStatus(member);
              const isCurrentAction = actionLoading === id;

              return (
                <TableRow key={id} className={isCurrentAction ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 overflow-hidden flex items-center justify-center">
                        {member.avatar ? (
                          <img src={member.avatar} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">{name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{displayRole}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status === 'Active' ? 'success' : status === 'Invited' ? 'warning' : 'secondary'}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {member.lastActive || '-'}
                  </TableCell>
                  <TableCell className="text-right relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isCurrentAction}
                      className={activeMenuId === id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === id ? null : id);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>

                    {activeMenuId === id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-10 w-48 rounded-md shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleEditRole(member)}
                            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-left"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleResendInvite(member)}
                            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-left"
                          >
                            <Mail className="h-4 w-4" />
                            Resend Invite
                          </button>
                          <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-left"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
        }}
        member={editingMember ? {
          id: Number(editingMember._id || editingMember.id) || 0,
          name: getMemberName(editingMember),
          email: editingMember.email,
          role: getMemberRole(editingMember) as 'Admin' | 'Member' | 'Viewer',
          status: getMemberStatus(editingMember),
          lastActive: editingMember.lastActive || '-',
          avatar: editingMember.avatar,
        } : null}
        onSave={(memberId, newRole) => {
          // Use the actual MongoDB ID from the editingMember
          const actualId = editingMember ? getMemberId(editingMember) : String(memberId);
          handleSaveRole(actualId, newRole);
        }}
      />
    </>
  );
}
