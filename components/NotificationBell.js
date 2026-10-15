'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/notifications';

export default function NotificationBell() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef(null);
  const router = useRouter();

  // Load user once
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

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    async function refresh() {
      try {
        const count = await getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (err) {
        console.error('Unread count error:', err);
      }
    }

    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  async function toggleOpen() {
    if (!user) return;

    if (!open) {
      try {
        const list = await getNotifications(user.id, 20);
        setNotifications(list);
      } catch (err) {
        console.error('Load notifications error:', err);
      }
    }
    setOpen(!open);
  }

  async function handleNotificationClick(n) {
    // Mark as read
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        setNotifications(
          notifications.map((x) =>
            x.id === n.id ? { ...x, read: true } : x
          )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }

    // Navigate if there's a link
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.id);
      setNotifications(
        notifications.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  }

  if (loading || !user) return null;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notif-bell"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-all"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔔</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="notif-dot-wrap">
                    {!n.read && <span className="notif-dot" />}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    {n.body && (
                      <div className="notif-body">{n.body}</div>
                    )}
                    <div className="notif-time">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
          }
