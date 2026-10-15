import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="auth-page" style={{ maxWidth: 520 }}>
        <div className="skeleton skeleton-text-xl" />
        <div className="skeleton skeleton-text-sm" style={{ marginTop: 8, marginBottom: 32 }} />

        <div className="checkout-card">
          <div className="skeleton skeleton-text-lg" />
          <div className="skeleton skeleton-text-sm" style={{ marginTop: 8, width: '60%' }} />
        </div>

        <div className="checkout-card">
          <div className="skeleton skeleton-text-lg" />
          <div className="skeleton skeleton-text-sm" style={{ marginTop: 8, marginBottom: 20 }} />
          <div className="skeleton skeleton-text-sm" />
        </div>

        <div className="checkout-summary">
          <div className="skeleton skeleton-text-sm" style={{ marginBottom: 12 }} />
          <div className="skeleton skeleton-text-sm" style={{ marginBottom: 12 }} />
          <div className="skeleton skeleton-text-lg" />
        </div>

        <div className="skeleton skeleton-btn-full" />
      </div>
      <Footer />
    </>
  );
  }
