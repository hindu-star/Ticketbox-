'use client';

import { useState } from 'react';

export default function InviteUnlocker({ inviteTickets, onUnlock }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!inviteTickets || inviteTickets.length === 0) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const unlocked = [];

      for (const ticket of inviteTickets) {
        const res = await fetch('/api/paystack/verify-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: ticket.id, password }),
        });

        if (res.ok) unlocked.push(ticket.id);
      }

      if (unlocked.length === 0) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      onUnlock(unlocked);
      setOpen(false);
      setPassword('');
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="invite-unlocker">
      {!open ? (
        <button
          type="button"
          className="invite-unlock-link"
          onClick={() => setOpen(true)}
        >
          🎫 Have an invite code?
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="invite-form">
          <input
            type="text"
            placeholder="Enter invite password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Unlock'}
          </button>
          <button
            type="button"
            className="invite-cancel"
            onClick={() => {
              setOpen(false);
              setPassword('');
              setError('');
            }}
          >
            Cancel
          </button>
          {error && <div className="invite-error">{error}</div>}
        </form>
      )}
    </div>
  );
    }
