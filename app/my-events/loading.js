import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <div className="skeleton skeleton-text-xl" />
            <div className="skeleton skeleton-text-sm" style={{ marginTop: 8 }} />
          </div>
          <div className="skeleton skeleton-btn" />
        </div>

        <div className="dash-tabs">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-tab" />
          ))}
        </div>

        <div className="dashboard-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-row">
              <div className="skeleton skeleton-thumb" />
              <div className="dashboard-row-info">
                <div className="skeleton skeleton-text-lg" />
                <div className="skeleton skeleton-text-sm" style={{ marginTop: 8 }} />
                <div className="skeleton skeleton-text-sm" style={{ marginTop: 6, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
