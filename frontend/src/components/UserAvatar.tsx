import React from 'react';
import { Users } from 'lucide-react';

interface UserAvatarProps {
  user: {
    username: string;
    avatar?: string | null;
    equipped_frame?: string | null;
    frame_animation?: string | null;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  avatarOverride?: string | null;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '', avatarOverride }) => {
  if (user?.frame_animation) {
    console.log(`[Debug] User: ${user.username}, Frame Animation: ${user.frame_animation}`);
  }

  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
  };

  if (!user) {
    return (
      <div className={`rounded-full bg-slate-100 flex items-center justify-center text-slate-400 ${sizeClasses[size]} ${className}`}>
        <Users className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center rounded-full ${sizeClasses[size]} ${className}`}>
      {/* Avatar Container */}
      <div className={`
        relative h-full w-full rounded-full overflow-hidden
        bg-gradient-to-tr from-primary-500/10 to-accent-violet/10 
        flex items-center justify-center text-primary-600
        border border-white/20
      `}>
        {(avatarOverride || user.avatar) ? (
          <img 
            src={avatarOverride || user.avatar || ''} 
            alt={user.username} 
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-bold opacity-50 uppercase">{user.username?.charAt(0)}</span>
        )}
      </div>

      {/* Frame - Overlaid on top */}
      {user.equipped_frame && (
        <div className={`absolute inset-[-10%] z-10 pointer-events-none select-none ${user.frame_animation || ''}`}>
          <img 
            src={user.equipped_frame} 
            alt="Frame" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};
