import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ShareButton from '../../../components/ShareButton';
import EventTickets from '../../../components/EventTickets';
import { getEvent, getTicketTypes } from '../../../lib/events';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

  const isDraft = event.status === 'draft';
  let isOwner = false;

  if (isDraft) {
    // Check if the current viewer is the organizer
    const { data: { user } } = await supabaseAdmin.auth.getUser();
    if (!user || user.id !== event.organizer_id) {
      notFound();
    }
    isOwner = true;
  }

  const theme = event.theme || 'classic';

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
      {isDraft && isOwner && (
        <div className="draft-banner">
          📝 This event is a <strong>draft</strong> — only you can see it.
          Publish it from <a href="/my-events">My Events</a> to make it public.
        </div>
      )}
      <div className={`event-detail theme-${theme}`}>
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

          <div
            className="event-desc"
            dangerouslySetInnerHTML={{
              __html: event.description || '<p>Full details coming soon.</p>',
            }}
          />

          <h2 className="ticket-heading">Tickets</h2>
          <EventTickets eventId={event.id} tickets={tickets} />
        </div>
      </div>
      <Footer />
    </>
  );
}
