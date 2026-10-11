import Link from 'next/link';

export default function EventCard({ event }) {
  return (
    <Link href={`/event/${event.id}`} className="event-card">
      <div className="event-card-img">{event.emoji}</div>
      <div className="event-card-body">
        <div className="event-card-date">{event.date}</div>
        <div className="event-card-title">{event.title}</div>
        <div className="event-card-loc">📍 {event.location}</div>
        <div className="event-card-price">{event.price}</div>
      </div>
    </Link>
  );
  }
