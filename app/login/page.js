import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <div className="auth-page">
        <h1>Welcome back</h1>
        <p>Log in to manage your events and tickets.</p>
        <form className="auth-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="button">Log in</button>
        </form>
        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/login">Sign up</Link>
        </p>
      </div>
      <Footer />
    </>
  );
    }
