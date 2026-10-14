'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const CONTACT_EMAIL = 'ticketboxhq@gmail.com';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const subject = encodeURIComponent(`TicketBox enquiry from ${name}`);
    const body = encodeURIComponent(
      `${message}\n\n—\nFrom: ${name}\nReply to: ${email}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <div className="content-page">
        <h1>Contact us</h1>
        <p className="content-lead">
          Questions, feedback, or partnership ideas? We&apos;d love to hear from
          you.
        </p>

        <div className="content-section">
          <h2>Email us</h2>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="content-link">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            We usually respond within 24 hours.
          </p>
        </div>

        <div className="content-section">
          <h2>Send us a message</h2>

          {sent ? (
            <div className="auth-success">
              Your email app should now be open with your message ready to send.
              If it didn&apos;t open, email us directly at {CONTACT_EMAIL}.
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <textarea
                placeholder="Your message"
                rows="5"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <button type="submit">Send message</button>
            </form>
          )}
        </div>

        <div className="content-section">
          <h2>For organizers</h2>
          <p>
            Need help setting up your first event, or planning something large?
            Reach out — we&apos;re happy to walk you through it.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
            }
