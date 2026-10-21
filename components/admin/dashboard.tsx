'use client';

import { useState } from 'react';
import { LogOut, FolderKanban, Wrench, Briefcase, Mail, Home, UserCircle, Tags } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useAdminSessionGuard } from '@/hooks/use-admin-session-guard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProjectsManager } from '@/components/admin/projects-manager';
import { CategoriesManager } from '@/components/admin/categories-manager';
import { SkillsManager } from '@/components/admin/skills-manager';
import { ExperienceManager } from '@/components/admin/experience-manager';
import { ProfileManager } from '@/components/admin/profile-manager';
import { CvManager } from '@/components/admin/cv-manager';
import { MessagesManager } from '@/components/admin/messages-manager';

type Tab = 'projects' | 'categories' | 'skills' | 'experience' | 'profile' | 'messages';

const tabs: { id: Tab; label: string; icon: typeof FolderKanban }[] = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'profile', label: 'Profile & CV', icon: UserCircle },
  { id: 'messages', label: 'Messages', icon: Mail },
];

export function AdminDashboard() {
  const { signOut, user } = useAuth();
  const { secondsLeft, stayActive } = useAdminSessionGuard();
  const [activeTab, setActiveTab] = useState<Tab>('projects');

  return (
    <div className="min-h-screen bg-background">
      {secondsLeft !== null && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Session about to end"
          className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-xl"
        >
          <p className="text-sm font-medium">
            You will be signed out in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            There has been no activity for a while. This keeps your admin safe.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={stayActive}>Stay signed in</Button>
            <Button size="sm" variant="ghost" onClick={() => signOut()}>Sign out now</Button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              Y
            </span>
            <span className="text-sm font-semibold">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/">
                <Home className="mr-1.5 h-4 w-4" />
                View site
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="mb-6 text-sm text-muted-foreground">
          Signed in as {user?.email}
        </p>

        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'projects' && <ProjectsManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'skills' && <SkillsManager />}
        {activeTab === 'experience' && <ExperienceManager />}
        {activeTab === 'profile' && (
          <div className="space-y-12">
            <ProfileManager />
            <div className="border-t border-border pt-10">
              <CvManager />
            </div>
          </div>
        )}
        {activeTab === 'messages' && <MessagesManager />}
      </div>
    </div>
  );
}
