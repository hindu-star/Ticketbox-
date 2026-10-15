'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const initial = user?.email ? user.email[0].toUpperCase() : '';
  const avatarColor = user?.email
    ? getAvatarColor(user.email)
    : '#333';

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        Ticket<span>Box</span>
      </Link>

      {/* Desktop links */}
      <div className="navbar-links navbar-desktop">
        <Link href="/browse">Browse</Link>
        {!loading && user && (
          <Link href="/my-events">My Events</Link>
        )}
        <Link href="/create" className="navbar-cta">
          + Create
        </Link>
        {loading ? null : user ? (
          <>
            <div
              className="navbar-avatar"
              style={{ background: avatarColor }}
              title={user.email}
            >
              {initial}
            </div>
            <button
              onClick={handleLogout}
              className="navbar-logout"
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>

      {/* Mobile: avatar + hamburger */}
      <div className="navbar-mobile">
        {!loading && user && (
          <div
            className="navbar-avatar"
            style={{ background: avatarColor }}
            title={user.email}
          >
            {initial}
          </div>
        )}
        <button
          className="navbar-burger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`burger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line ${menuOpen ? 'open' : ''}`}></span>
          <span className={`burger-line ${menuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="navbar-drawer">
          <Link href="/">Home</Link>

          {loading ? null : user ? (
            <>
              <Link href="/browse">Browse</Link>
              <Link href="/my-events">My Events</Link>

              <button
                type="button"
                className={`drawer-account-toggle ${
                  accountOpen ? 'open' : ''
                }`}
                onClick={() => setAccountOpen(!accountOpen)}
              >
                <span>Account</span>
                <span
                  className={`drawer-chevron ${
                    accountOpen ? 'open' : ''
                  }`}
                >
                  ›
                </span>
              </button>

              {accountOpen && (
                <div className="drawer-account-items">
                  <Link href="/account/personal">Personal profile</Link>
                  <Link href="/account/organizer">Organizer profile</Link>
                  <Link href="/account/password">Set password</Link>
                  <Link href="/account/payouts">Payout account</Link>
                </div>
              )}

              <Link href="/create">+ Create event</Link>
              <Link href="/how-to-get-paid">How to get paid</Link>
              <Link href="/contact">Help</Link>
              <button
                onClick={handleLogout}
                className="drawer-logout"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/browse">Browse</Link>
              <Link href="/create">Create event</Link>
              <Link href="/login">Login</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
