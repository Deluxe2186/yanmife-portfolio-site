'use client';

import { useEffect, useState } from 'react';
import { Trash2, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages(data ?? []);
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('messages').delete().eq('id', id);
    load();
  };

  if (loading) {
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Messages ({messages.length})</h2>
        <Button size="sm" variant="outline" onClick={load}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No messages yet. When someone submits the contact form, their message will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{msg.name}</h3>
                    <a href={`mailto:${msg.email}`} className="text-sm text-primary hover:underline">{msg.email}</a>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{msg.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => del(msg.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
