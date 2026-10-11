import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <section className="section">
        <h2> All Events</h2>
        <div className="events-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton skeleton-img" />
              <div className="skeleton-body">
                <div className="skeleton skeleton-text-sm" />
                <div className="skeleton skeleton-text-lg" />
                <div className="skeleton skeleton-text-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
