import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="analytics-page">
        <div className="analytics-header">
          <div className="skeleton skeleton-text-sm" style={{ width: 160, marginBottom: 12 }} />
          <div className="skeleton skeleton-text-xl" />
          <div className="skeleton skeleton-text-sm" style={{ marginTop: 8, width: 120 }} />
        </div>

        <div className="analytics-summary">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="analytics-card">
              <div className="skeleton skeleton-text-sm" />
              <div className="skeleton skeleton-text-lg" style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>

        <div className="analytics-section">
          <div className="skeleton skeleton-text-lg" style={{ marginBottom: 16 }} />
          <div className="skeleton skeleton-ticket" />
          <div className="skeleton skeleton-ticket" />
        </div>

        <div className="analytics-section">
          <div className="skeleton skeleton-text-lg" style={{ marginBottom: 16 }} />
          <div className="skeleton skeleton-ticket" />
          <div className="skeleton skeleton-ticket" />
          <div className="skeleton skeleton-ticket" />
        </div>
      </div>
      <Footer />
    </>
  );
  }
