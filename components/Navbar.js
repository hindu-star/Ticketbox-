'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';

const AVATAR_COLORS = [
  '#f97316', '#2563eb', '#16a34a', '#dc2626',
  '#9333ea', '#0891b2', '#ca8a04', '#db2777',
];

function getAvatarColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  const initial = user?.email ? user.email[0].toUpperCase() : '';
  const avatarColor = user?.email ? getAvatarColor(user.email) : '#333';

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        Ticket<span>Box</span>
      </Link>
      <div className="navbar-links">
        <Link href="/browse">Browse</Link>
        {!loading && user && <Link href="/my-events">My Events</Link>}
        <Link href="/create" className="navbar-cta">+ Create</Link>
        {loading ? null : user ? (
          <>
            <Link href="/my-events" className="navbar-avatar" style={{ background: avatarColor }} title={user.email}>
              {initial}
            </Link>
            <button onClick={handleLogout} className="navbar-logout">Log out</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
          }
