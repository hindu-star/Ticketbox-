'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function DraftBanner({ eventId }) {
  const [state, setState] = useState('checking'); // checking | owner | not_owner
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setState('not_owner');
        return;
      }

      const { data: event } = await supabase
        .from('events')
        .select('organizer_id')
        .eq('id', eventId)
        .single();

      if (event && event.organizer_id === user.id) {
        setState('owner');
      } else {
        setState('not_owner');
      }
    }
    check();
  }, [eventId]);

  useEffect(() => {
    if (state === 'not_owner') {
      router.replace('/404');
    }
  }, [state, router]);

  if (state === 'checking' || state === 'not_owner') {
    return null;
  }

  return (
    <div className="draft-banner">
      📝 This event is a <strong>draft</strong> — only you can see it. Publish it
      from <a href="/my-events">My Events</a> to make it public.
    </div>
  );
}
