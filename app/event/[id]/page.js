import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

const eventsData = {
  'lagos-music-festival': {
    emoji: '🎵',
    title: 'Lagos Music Festival',
    date: 'Saturday, December 14, 2026',
    time: '6:00 PM – 11:00 PM',
    location: 'Eko Hotel, Victoria Island, Lagos',
    description: 'The biggest night in Lagos music. Live performances from top Afrobeats artists, food, drinks and good vibes.',
    tickets: [
      { name: 'Regular', price: 5000, desc: 'General admission' },
      { name: 'VIP', price: 15000, desc: 'Front row + free drink' },
      { name: 'Table for 4', price: 50000, desc: 'Private table + bottle service' },
    ],
  },
  'comedy-night-live': {
    emoji: '🎤',
    title: 'Comedy Night Live',
    date: 'Friday, December 20, 2026',
    time: '8:00 PM – 10:30 PM',
    location: 'Terra Kulture, Victoria Island, Lagos',
    description: 'An evening of non-stop laughter with Nigeria top comedians.',
    tickets: [
      { name: 'Regular', price: 3000, desc: 'General admission' },
      { name: 'VIP', price: 8000, desc: 'Front rows + drink' },
    ],
  },
  'tech-startup-summit': {
    emoji: '💼',
    title: 'Tech Startup Summit',
    date: 'Tuesday, January 7, 2026',
    time: '9:00 AM – 5:00 PM',
    location: 'Landmark Centre, Lagos',
    description: 'Meet founders, investors and builders shaping Africa tech future.',
    tickets: [
      { name: 'Regular', price: 10000, desc: 'Full day access' },
      { name: 'Founder Pass', price: 25000, desc: 'VIP + investor mixer' },
    ],
  },
  'art-culture-expo': {
    emoji: '🎨',
    title: 'Art & Culture Expo',
    date: 'Sunday, January 12, 2026',
    time: '11:00 AM – 6:00 PM',
    location: 'Nike Art Gallery, Lekki',
    description: 'Celebrating Nigerian art, craft and culture. Free entry for all.',
    tickets: [
      { name: 'Free Entry', price: 0, desc: 'Register to attend' },
    ],
  },
};

const fallback = {
  emoji: '🎉',
  title: 'Event',
  date: 'Date coming soon',
  time: 'Time TBA',
  location: 'Lagos, Nigeria',
  description: 'Full details coming soon.',
  tickets: [{ name: 'Regular', price: 5000, desc: 'General admission' }],
};

export default function EventPage({ params }) {
  const event = eventsData[params.id] || fallback;

  return (
    <>
      <Navbar />
      <div className="event-detail">
        <div className="event-hero">{event.emoji}</div>
        <div className="event-info">
          <h1>{event.title}</h1>
          <div className="event-meta">
            <div>📅 {event.date}</div>
            <div>🕐 {event.time}</div>
            <div>📍 {event.location}</div>
          </div>
          <p className="event-desc">{event.description}</p>

          <h2 className="ticket-heading">Tickets</h2>
          <div className="ticket-list">
            {event.tickets.map((t, i) => (
              <div key={i} className="ticket-row">
                <div>
                  <div className="ticket-name">{t.name}</div>
                  <div className="ticket-desc">{t.desc}</div>
                </div>
                <div className="ticket-right">
                  <div className="ticket-price">
                    {t.price === 0 ? 'Free' : `₦${t.price.toLocaleString()}`}
                  </div>
                  <button className="ticket-buy">Buy</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
    }
