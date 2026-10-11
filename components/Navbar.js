'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { signOut } from '../lib/auth';

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

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        Ticket<span>Box</span>
      </Link>
      <div className="navbar-links">
        <Link href="/browse">Browse</Link>
        <Link href="/create" className="navbar-cta">+ Create</Link>
        {loading ? null : user ? (
          <>
            <span className="navbar-user" title={user.email}>
              {user.email?.split('@')[0]}
            </span>
            <button onClick={handleLogout} className="navbar-logout">Log out</button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
    }
