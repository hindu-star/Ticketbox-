import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ShareButton from '../../../components/ShareButton';
import { getEvent, getTicketTypes } from '../../../lib/events';

export default async function EventPage({ params }) {
  let event;
  let tickets = [];

  try {
    event = await getEvent(params.id);
    tickets = await getTicketTypes(params.id);
  } catch (err) {
    notFound();
  }

  if (!event) notFound();

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date coming soon';

  return (
    <>
      <Navbar />
      <div className="event-detail">
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className="event-hero-img" />
        ) : (
          <div className="event-hero">{event.emoji || '🎉'}</div>
        )}
        <div className="event-info">
          <div className="event-title-row">
            <h1>{event.title}</h1>
            <ShareButton eventId={event.id} title={event.title} />
          </div>
          <div className="event-meta">
            <div>📅 {formattedDate}</div>
            <div>🕐 {event.event_time || 'Time TBA'}</div>
            <div>📍 {event.location}</div>
          </div>
          <p className="event-desc">
            {event.description || 'Full details coming soon.'}
          </p>

          <h2 className="ticket-heading">Tickets</h2>
          <div className="ticket-list">
            {tickets.length === 0 ? (
              <p style={{ color: '#64748b' }}>No tickets available yet.</p>
            ) : (
              tickets.map((t) => {
                const remaining = t.capacity
                  ? t.capacity - (t.quantity_sold || 0)
                  : null;
                const soldOut = remaining !== null && remaining <= 0;
                const isFree = t.ticket_kind === 'free' || Number(t.price) === 0;
                const isInvite = t.ticket_kind === 'invite';
                const perks = Array.isArray(t.perks) ? t.perks : [];

                return (
                  <div key={t.id} className="ticket-row">
                    <div className="ticket-row-main">
                      <div className="ticket-name">
                        {t.name}
                        {t.ticket_kind === 'invite' && (
                          <span className="ticket-badge">Invite-only</span>
                        )}
                      </div>
                      <div className="ticket-desc">
                        {t.description || 'General admission'}
                      </div>

                      {perks.length > 0 && (
                        <ul className="ticket-perks">
                          {perks.map((p, idx) => (
                            <li key={idx}>✓ {p}</li>
                          ))}
                        </ul>
                      )}

                      {t.capacity && (
                        <div className={`ticket-remaining ${soldOut ? 'sold-out' : ''}`}>
                          {soldOut
                            ? 'Sold out'
                            : `${remaining} of ${t.capacity} remaining`}
                        </div>
                      )}
                      {t.order_limit && t.order_limit > 1 && (
                        <div className="ticket-order-limit">
                          Max {t.order_limit} per person
                        </div>
                      )}
                    </div>
                    <div className="ticket-right">
                      <div className="ticket-price">
                        {isFree ? 'Free' : `₦${Number(t.price).toLocaleString()}`}
                      </div>
                      {soldOut ? (
                        <span className="ticket-soldout-btn">Sold out</span>
                      ) : isInvite ? (
                        <span className="ticket-soldout-btn">Invite only</span>
                      ) : (
                        <Link
                          href={`/checkout/${event.id}/${t.id}`}
                          className="ticket-buy"
                        >
                          Buy
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
          }
