'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { AdminLogin } from '@/components/admin/login';
import { AdminDashboard } from '@/components/admin/dashboard';

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
