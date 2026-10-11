import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="hero">
        <h1>Find events <span>near you</span></h1>
        <p>Discover concerts, parties, conferences and more. Buy tickets in seconds.</p>
      </div>
      <section className="section">
        <h2>🔥 Trending now</h2>
        <div className="events-grid">
          {[...Array(4)].map((_, i) => (
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
