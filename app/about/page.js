import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'About — TicketBox',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="content-page">
        <h1>About TicketBox</h1>
        <p className="content-lead">
          TicketBox is the easiest way to find events and sell tickets in Nigeria.
        </p>

        <div className="content-section">
          <h2>Our mission</h2>
          <p>
            We believe anyone with a great event idea should be able to sell tickets
            without stress. No paperwork. No long setup. Just create your event,
            set your prices, and share the link.
          </p>
        </div>

        <div className="content-section">
          <h2>For attendees</h2>
          <p>
            Discover concerts, parties, conferences, workshops and community events
            happening around you. Buy tickets in seconds with secure payment.
          </p>
        </div>

        <div className="content-section">
          <h2>For organizers</h2>
          <p>
            Whether you're hosting a small meetup or a 5,000-person festival,
            TicketBox gives you the tools to sell tickets, manage guests, and
            track your sales — all from your phone.
          </p>
        </div>

        <div className="content-section">
          <h2>Get started</h2>
          <p>
            Ready to sell your first ticket?
          </p>
          <div className="content-cta">
            <Link href="/create" className="content-btn-primary">
              Create an event
            </Link>
            <Link href="/browse" className="content-btn-secondary">
              Browse events
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
