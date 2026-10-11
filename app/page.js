import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';

const events = [
  { id: 'lagos-music-festival', emoji: '🎵', date: 'Sat, Dec 14', title: 'Lagos Music Festival', location: 'Eko Hotel, Lagos', price: 'From ₦5,000' },
  { id: 'comedy-night-live', emoji: '🎤', date: 'Fri, Dec 20', title: 'Comedy Night Live', location: 'Terra Kulture, Lagos', price: 'From ₦3,000' },
  { id: 'tech-startup-summit', emoji: '💼', date: 'Tue, Jan 7', title: 'Tech Startup Summit', location: 'Landmark Centre, Lagos', price: 'From ₦10,000' },
  { id: 'art-culture-expo', emoji: '🎨', date: 'Sun, Jan 12', title: 'Art & Culture Expo', location: 'Nike Art Gallery', price: 'Free' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <div className="hero">
        <h1>Find events <span>near you</span></h1>
        <p>Discover concerts, parties, conferences and more. Buy tickets in seconds.</p>
        <div className="search-bar">
          <input type="text" placeholder="Search events or cities..." />
          <button>Search</button>
        </div>
      </div>

      <section className="section">
        <h2>🔥 Trending now</h2>
        <div className="events-grid">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>

      <div className="cta">
        <h2>Hosting an event?</h2>
        <p>Create your event and start selling tickets in minutes.</p>
        <button>Create an event</button>
      </div>

      <Footer />
    </>
  );
    }
