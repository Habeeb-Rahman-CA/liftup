'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { UserProfile } from '@liftup/types';

interface UserProfileMenuProps {
  user: UserProfile;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user }) => {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initialChar = (user.name?.trim() || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Top Bar Trigger Button (Rounded Profile Avatar) */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-emerald-600/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all select-none group"
        title="User Profile Menu"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="relative h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 border border-emerald-600/50 flex items-center justify-center shadow-sm">
          {user.avatar && !avatarError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt={user.name || user.email}
              onError={() => setAvatarError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-mono font-bold text-xs sm:text-sm text-emerald-100">
              {initialChar}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform duration-200 hidden sm:block ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 z-50 animate-in fade-in-50 zoom-in-95 duration-150 space-y-3">
          {/* User Info Header */}
          <div className="flex items-start gap-3 pb-3 border-b border-zinc-850">
            <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 border border-emerald-600/50 flex items-center justify-center shadow-inner">
              {user.avatar && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || user.email}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-mono font-bold text-base text-emerald-100">
                  {initialChar}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-sm text-zinc-100 truncate">
                  {user.name || 'Athlete'}
                </h4>
                {user.role === 'ADMIN' && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold bg-purple-950 text-purple-300 border border-purple-800/80">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Menu Action Items */}
          <div className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
