import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">Ticket<span>Box</span></div>
          <p>The easiest way to find events and sell tickets in Nigeria.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Product</h4>
            <Link href="/browse">Browse events</Link>
            <Link href="/create">Create event</Link>
            <Link href="/login">Log in</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link href="/">About</Link>
            <Link href="/">Contact</Link>
            <Link href="/">Blog</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 TicketBox. Built with ❤️ in Nigeria.
      </div>
    </footer>
  );
    }
