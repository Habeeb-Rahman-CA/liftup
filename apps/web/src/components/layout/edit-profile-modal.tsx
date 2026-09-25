'use client';

import React, { useState, useEffect } from 'react';
import { User, Image as ImageIcon, Globe, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usersApi } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import type { UserProfile } from '@liftup/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [timezone, setTimezone] = useState(
    user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      setError(null);
      setAvatarError(false);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await usersApi.updateProfile({
        name: name.trim() || undefined,
        avatar: avatar.trim() || undefined,
        timezone: timezone.trim() || undefined,
      });
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initialChar = (name.trim() || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Edit Profile</h3>
              <p className="text-[11px] text-zinc-400">Update your name, avatar, and timezone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Avatar Preview & URL */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-emerald-900 to-teal-800 border-2 border-emerald-500/40 shadow-inner">
              {avatar && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name || 'Avatar'}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-bold font-mono text-xl text-emerald-200">{initialChar}</span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />
                Avatar Image URL
              </label>
              <Input
                type="url"
                value={avatar}
                onChange={e => {
                  setAvatar(e.target.value);
                  setAvatarError(false);
                }}
                placeholder="https://example.com/avatar.jpg"
                className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 rounded-lg"
              />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="h-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 rounded-xl"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Email Address (Read-only)</label>
            <Input
              type="email"
              disabled
              value={user.email}
              className="h-9 bg-zinc-900/50 border-zinc-850 text-xs text-zinc-500 rounded-xl cursor-not-allowed"
            />
          </div>

          {/* Timezone Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-zinc-400" />
              Timezone
            </label>
            <Input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York, Asia/Kolkata"
              className="h-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 rounded-xl"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs h-8 px-3 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 text-xs h-8 px-4 rounded-xl font-medium gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
