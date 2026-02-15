import { useState } from 'react';
import { TeamStats } from './components/TeamStats';
import { MembersList } from './components/MembersList';
import { InviteModal } from './components/InviteModal';
import { Button } from '../../components/ui/Button';
import { UserPlus } from 'lucide-react';

export function Team() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Team Collaboration</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your team and permissions.</p>
        </div>
        <Button variant="primary" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <TeamStats />
      <MembersList />

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}

export default Team;
