import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import EventCard from '../../../components/EventCard';
import {
  getOrganizerByUsername,
  getOrganizerUpcomingEvents,
} from '../../../lib/profile';
import { addSoldOutFlags } from '../../../lib/events';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  try {
    const profile = await getOrganizerByUsername(params.username);

    if (!profile) {
      return { title: 'Organizer not found — TicketBox' };
    }

    const name = profile.display_name || profile.username;
    const description =
      profile.about ||
      `See upcoming events from ${name} on TicketBox.`;

    return {
      title: `${name} — Events on TicketBox`,
      description: description.slice(0, 160),
      openGraph: {
        title: `${name} — TicketBox`,
        description: description.slice(0, 160),
        url: `https://ticketbox.com.ng/u/${profile.username}`,
        siteName: 'TicketBox',
        images: profile.profile_picture_url
          ? [{ url: profile.profile_picture_url }]
          : [],
      },
      twitter: {
        card: 'summary',
        title: name,
        description: description.slice(0, 160),
        images: profile.profile_picture_url
          ? [profile.profile_picture_url]
          : [],
      },
    };
  } catch (err) {
    return { title: 'Organizer — TicketBox' };
  }
}

function getInitial(name) {
  if (!name) return '?';
  return name.trim()[0].toUpperCase();
}

function normalizeSocialUrl(value, platform) {
  if (!value) return null;
  const v = value.trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  // Handle handles like "@akim" or "akim"
  const handle = v.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    default:
      return v;
  }
}

export default async function OrganizerPage({ params }) {
  const profile = await getOrganizerByUsername(params.username);

  if (!profile || !profile.username) {
    notFound();
  }

  const events = await getOrganizerUpcomingEvents(profile.id);
  const eventsWithFlags = await addSoldOutFlags(events);

  const displayName =
    profile.display_name || profile.username;
  const avatarUrl = profile.profile_picture_url;

  const instagramUrl = normalizeSocialUrl(
    profile.instagram_url,
    'instagram'
  );
  const twitterUrl = normalizeSocialUrl(profile.twitter_url, 'twitter');
  const facebookUrl = normalizeSocialUrl(
    profile.facebook_url,
    'facebook'
  );
  const websiteUrl = profile.website_url;

  return (
    <>
      <Navbar />
      <div className="organizer-page">
        {/* PROFILE HEADER */}
        <div className="organizer-header">
          <div className="organizer-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} />
            ) : (
              <span>{getInitial(displayName)}</span>
            )}
          </div>
          <h1 className="organizer-name">{displayName}</h1>
          <div className="organizer-username">@{profile.username}</div>

          {profile.about && (
            <p className="organizer-about">{profile.about}</p>
          )}

          {/* Social links */}
          {(instagramUrl ||
            twitterUrl ||
            facebookUrl ||
            websiteUrl) && (
            <div className="organizer-socials">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="organizer-social"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="organizer-social"
                  aria-label="Twitter"
                >
                  Twitter / X
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="organizer-social"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
              )}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="organizer-social"
                  aria-label="Website"
                >
                  Website
                </a>
              )}
            </div>
          )}
        </div>

        {/* UPCOMING EVENTS */}
        <div className="organizer-events">
          <h2 className="organizer-events-title">
            Upcoming events
          </h2>

          {eventsWithFlags.length === 0 ? (
            <div className="organizer-empty">
              <p>
                No upcoming events from {displayName} right now. Check back
                later.
              </p>
            </div>
          ) : (
            <div className="events-grid">
              {eventsWithFlags.map((e) => (
                <EventCard
                  key={e.id}
                  event={{
                    id: e.id,
                    emoji: e.emoji || '🎉',
                    image_url: e.image_url,
                    soldOut: e.soldOut,
                    date: e.event_date
                      ? new Date(e.event_date).toLocaleDateString(
                          'en-GB',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }
                        )
                      : 'Date TBA',
                    title: e.title,
                    location: e.location,
                    price: e.soldOut ? 'Sold out' : 'View tickets →',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER CTA */}
        <div className="organizer-footer-cta">
          <p>Hosting events too?</p>
          <Link href="/create" className="content-btn-primary">
            Create your own event on TicketBox
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
          }
