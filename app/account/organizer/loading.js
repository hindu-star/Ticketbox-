import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="account-page">
        <div className="skeleton skeleton-text-xl" />
        <div className="skeleton skeleton-text-sm" style={{ marginTop: 8, marginBottom: 32 }} />

        <div className="skeleton skeleton-avatar-circle" style={{ marginBottom: 24 }} />

        <div className="auth-form">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-input" />
          ))}
          <div className="skeleton skeleton-btn-full" style={{ marginTop: 20 }} />
        </div>
      </div>
      <Footer />
    </>
  );
}
