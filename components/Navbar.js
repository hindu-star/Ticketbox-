import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        🎟️ Ticket<span>Box</span>
      </Link>
      <div className="navbar-links">
        <Link href="/browse">Browse</Link>
        <Link href="/create" className="navbar-cta">+ Create</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}
