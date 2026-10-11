import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EventCard from '../../components/EventCard';

const events = [
  { id: 'lagos-music-festival', emoji: '🎵', date: 'Sat, Dec 14', title: 'Lagos Music Festival', location: 'Eko Hotel, Lagos', price: 'From ₦5,000' },
  { id: 'comedy-night-live', emoji: '🎤', date: 'Fri, Dec 20', title: 'Comedy Night Live', location: 'Terra Kulture, Lagos', price: 'From ₦3,000' },
  { id: 'tech-startup-summit', emoji: '💼', date: 'Tue, Jan 7', title: 'Tech Startup Summit', location: 'Landmark Centre, Lagos', price: 'From ₦10,000' },
  { id: 'art-culture-expo', emoji: '🎨', date: 'Sun, Jan 12', title: 'Art & Culture Expo', location: 'Nike Art Gallery', price: 'Free' },
  { id: 'afrobeats-night', emoji: '🎧', date: 'Fri, Jan 17', title: 'Afrobeats Night', location: 'Hard Rock Cafe, Lagos', price: 'From ₦7,500' },
  { id: 'startup-pitch-night', emoji: '🚀', date: 'Thu, Jan 23', title: 'Startup Pitch Night', location: 'Co-Creation Hub, Yaba', price: 'Free' },
  { id: 'lagos-food-festival', emoji: '🍲', date: 'Sat, Feb 1', title: 'Lagos Food Festival', location: 'Victoria Island', price: 'From ₦2,000' },
  { id: 'youth-conference', emoji: '🙏', date: 'Sun, Feb 9', title: 'Youth Conference 2026', location: 'Tafawa Balewa Square', price: 'Free' },
];

export default function BrowsePage() {
  return (
    <>
      <Navbar />
      <section className="section">
        <h2>🎟️ All Events</h2>
        <div className="events-grid">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>
      <Footer />
    </>
  );
    }
