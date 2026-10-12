'use client';

import { useState } from 'react';

export default function ShareButton({ eventId, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${baseUrl}/event/${eventId}`;
  const text = `Check out "${title}" on TicketBox 🎟️`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        setOpen(false);
      } catch (err) {
        // User cancelled — do nothing
      }
    } else {
      copyLink();
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  return (
    <div className="share-wrap">
      <button
        type="button"
        className="share-btn"
        onClick={() => setOpen(!open)}
      >
        📤 Share event
      </button>

      {open && (
        <div className="share-menu">
          <button
            type="button"
            className="share-item"
            onClick={nativeShare}
          >
            <span>📱</span> Share via...
          </button>
          <button
            type="button"
            className="share-item"
            onClick={copyLink}
          >
            <span>{copied ? '✅' : '🔗'}</span>
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-item"
          >
            <span>💬</span> WhatsApp
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-item"
          >
            <span>🐦</span> Twitter / X
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-item"
          >
            <span>📘</span> Facebook
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-item"
          >
            <span>✈️</span> Telegram
          </a>
        </div>
      )}
    </div>
  );
    }
