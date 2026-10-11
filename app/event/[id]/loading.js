import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="event-detail">
        <div className="skeleton skeleton-event-hero" />
        <div className="event-info">
          <div className="skeleton skeleton-text-xl" />
          <div className="skeleton skeleton-text-sm" />
          <div className="skeleton skeleton-text-sm" />
          <div className="skeleton skeleton-text-lg" />
          <div className="skeleton skeleton-ticket" />
          <div className="skeleton skeleton-ticket" />
        </div>
      </div>
      <Footer />
    </>
  );
    }
