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
          <h2>Why we built this</h2>
          <p>
            Organizing an event in Nigeria has always been harder than it should be.
            Selling tickets often means printing paper, chasing payments on WhatsApp,
            and manually tracking who paid and who didn&apos;t.
          </p>
          <p>
            We built TicketBox to fix that. One link. One platform. Everything you
            need to sell tickets, manage guests, and grow your event.
          </p>
        </div>

        <div className="content-section">
          <h2>For attendees</h2>
          <p>
            Discover concerts, parties, conferences, workshops, church events and
            community gatherings happening around you. Buy tickets in seconds with
            a secure checkout — no long queues, no paper tickets, no wahala.
          </p>
        </div>

        <div className="content-section">
          <h2>For organizers</h2>
          <p>
            Whether you&apos;re hosting a 50-person meetup or a 5,000-person festival,
            TicketBox gives you the tools to succeed. Create your event, set your own
            ticket types and prices, upload photos, and share the link anywhere.
          </p>
          <p>
            You get a dashboard to track your events, edit on the fly, and delete
            anything you no longer need — all from your phone.
          </p>
        </div>

        <div className="content-section">
          <h2>Built in Nigeria, for Nigeria</h2>
          <p>
            TicketBox was built by a Nigerian, for Nigerian event organizers and
            attendees. We understand the market because we&apos;re part of it.
            Our mission is simple: make hosting events easier and more profitable
            for everyone.
          </p>
        </div>

        <div className="content-section">
          <h2>Get started</h2>
          <p>
            Ready to sell your first ticket or find your next event?
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
