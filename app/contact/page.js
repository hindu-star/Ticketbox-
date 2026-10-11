'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // For now, we open the user's mail app with a pre-filled email
    const subject = encodeURIComponent(`TicketBox contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} (${email})`);
    window.location.href = `mailto:hello@ticketbox.ng?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <div className="content-page">
        <h1>Contact us</h1>
        <p className="content-lead">
          Questions, feedback, or partnership ideas? We'd love to hear from you.
        </p>

        <div className="content-section">
          <h2>Email</h2>
          <p>
            <a href="mailto:hello@ticketbox.ng" className="content-link">
              hello@ticketbox.ng
            </a>
          </p>
        </div>

        <div className="content-section">
          <h2>Send us a message</h2>

          {sent ? (
            <div className="auth-success">
              Your email app should now be open. If not, email us directly at
              hello@ticketbox.ng
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
      </div>
      <Footer />
    </>
  );
    }
