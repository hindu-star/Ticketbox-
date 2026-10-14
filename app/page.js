import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EventCard from '../components/EventCard';
import Link from 'next/link';
import { getUpcomingPublishedEvents, addSoldOutFlags } from '../lib/events';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events = [];

  try {
    const all = await getUpcomingPublishedEvents();
    const withFlags = await addSoldOutFlags(all);
    events = withFlags.slice(0, 8);
  } catch (err) {
    console.error('Failed to load events:', err);
  }

  return (
    <>
      <Navbar />

      <section className="landing-hero">
        <div className="landing-hero-badge">
          🎟️ Nigeria&apos;s easiest way to sell event tickets
        </div>
        <h1 className="landing-hero-title">
          Sell tickets in minutes.
          <br />
          <span className="landing-hero-accent">Get paid the next day.</span>
        </h1>
        <p className="landing-hero-sub">
          Create your event, share the link, and let TicketBox handle the
          payments, tickets, and check-ins. You keep 95% of every sale.
        </p>
        <div className="landing-hero-ctas">
          <Link href="/create" className="landing-cta-primary">
            Create an event — free
          </Link>
          <Link href="/browse" className="landing-cta-secondary">
            Browse events →
          </Link>
        </div>
        <div className="landing-hero-proof">
          <span>✓ No setup fees</span>
          <span>✓ Instant Paystack payouts</span>
          <span>✓ Free QR check-in</span>
        </div>
      </section>

      <section className="section">
        <div className="landing-section-header">
          <h2>🔥 Trending now</h2>
          <Link href="/browse" className="landing-see-all">
            See all →
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="empty-state">
            <p>
              No events yet.{' '}
              <Link href="/create">Be the first to create one!</Link>
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((e) => (
              <EventCard
                key={e.id}
                event={{
                  id: e.id,
                  emoji: e.emoji || '🎉',
                  image_url: e.image_url,
                  soldOut: e.soldOut,
                  date: e.event_date
                    ? new Date(e.event_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Date TBA',
                  title: e.title,
                  location: e.location,
                  price: e.soldOut ? 'Sold out' : 'View tickets →',
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="landing-how">
        <div className="landing-how-inner">
          <div className="landing-how-label">How it works</div>
          <h2 className="landing-how-title">
            Three steps. That&apos;s the whole thing.
          </h2>

          <div className="landing-steps">
            <div className="landing-step">
              <div className="landing-step-num">1</div>
              <h3>Create your event</h3>
              <p>
                Add your event details, upload a cover image, and set your
                ticket types. Free, VIP, invite-only — your call.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-num">2</div>
              <h3>Share your link</h3>
              <p>
                Every event gets its own link. Share on WhatsApp, Instagram,
                Twitter — or anywhere. Buyers tap, pay, and get their tickets
                by email instantly.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step-num">3</div>
              <h3>Get paid &amp; scan</h3>
              <p>
                Money settles to your bank the next business day. On event day,
                scan QR codes with your phone at the door.
              </p>
            </div>
          </div>

          <div className="landing-how-cta">
            <Link href="/how-to-get-paid" className="landing-cta-secondary">
              Read the full guide →
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-why">
        <div className="landing-why-inner">
          <div className="landing-why-label">Why organizers pick TicketBox</div>
          <h2 className="landing-why-title">Built for Nigerian events.</h2>

          <div className="landing-features">
            <div className="landing-feature">
              <div className="landing-feature-icon">💰</div>
              <h3>Keep 95% of every sale</h3>
              <p>
                We charge the buyer a small service fee. Your ticket price is
                yours — no hidden deductions.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">⚡</div>
              <h3>Paid the next day</h3>
              <p>
                Money settles directly to your Nigerian bank account the next
                business day. No waiting weeks.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">🎟️</div>
              <h3>QR check-in at the door</h3>
              <p>
                Scan ticket QR codes with your phone. Works offline-friendly
                and stops duplicate entries.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">🔒</div>
              <h3>Secure payments</h3>
              <p>
                Powered by Paystack. Cards, transfers, USSD — all major
                Nigerian banks supported.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">📊</div>
              <h3>Live analytics</h3>
              <p>
                See sales, revenue, and ticket breakdowns in real time — from
                your phone.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature-icon">✨</div>
              <h3>Beautiful event pages</h3>
              <p>
                Pick a theme, upload your image, and get a page that looks like
                it was built by a designer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-testimonials">
        <div className="landing-testimonials-inner">
          <div className="landing-how-label">From organizers</div>
          <h2 className="landing-how-title">Loved by early users.</h2>

          <div className="landing-quotes">
            <div className="landing-quote">
              <p>
                &ldquo;I sold 200 tickets in 3 days. Payment landed in my
                account the next morning. No stories.&rdquo;
              </p>
              <div className="landing-quote-author">
                <div className="landing-quote-avatar">A</div>
                <div>
                  <div className="landing-quote-name">Adebayo O.</div>
                  <div className="landing-quote-role">
                    Lagos party organizer
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-quote">
              <p>
                &ldquo;The QR check-in at the door saved us hours. No more
                &lsquo;I&apos;m on the list&rsquo; drama.&rdquo;
              </p>
              <div className="landing-quote-author">
                <div className="landing-quote-avatar">C</div>
                <div>
                  <div className="landing-quote-name">Chidinma E.</div>
                  <div className="landing-quote-role">
                    Conference organizer
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-quote">
              <p>
                &ldquo;Setting up was easier than WhatsApp. I had my first
                ticket sold in 20 minutes.&rdquo;
              </p>
              <div className="landing-quote-author">
                <div className="landing-quote-avatar">T</div>
                <div>
                  <div className="landing-quote-name">Tunde A.</div>
                  <div className="landing-quote-role">Concert promoter</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-faq">
        <div className="landing-faq-inner">
          <h2 className="landing-how-title">Common questions</h2>

          <details className="landing-faq-item">
            <summary>How much does TicketBox charge?</summary>
            <p>
              TicketBox takes a <strong>5% service fee</strong> per paid
              ticket. The buyer pays it on top of your ticket price — so you
              keep 100% of what you set. Free events are always free.
            </p>
          </details>

          <details className="landing-faq-item">
            <summary>When do I receive my money?</summary>
            <p>
              Money settles directly to your Nigerian bank account the{' '}
              <strong>next business day</strong> after each sale. Weekends may
              push to Monday.
            </p>
          </details>

          <details className="landing-faq-item">
            <summary>What payment methods can buyers use?</summary>
            <p>
              Cards, bank transfers, USSD, and Paystack-supported digital
              wallets. All major Nigerian banks work.
            </p>
          </details>

          <details className="landing-faq-item">
            <summary>Can I run free events?</summary>
            <p>
              Yes — completely free. You still get QR codes for check-in, and
              buyers still get their tickets by email.
            </p>
          </details>

          <details className="landing-faq-item">
            <summary>
              What if my bank account name doesn&apos;t match my profile name?
            </summary>
            <p>
              Update your <strong>Personal profile</strong> to match your bank
              name exactly, then retry. For business accounts, use the business
              option on the payout page — we&apos;ll verify within 24 hours.
            </p>
          </details>
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="landing-final-cta-inner">
          <h2>Ready to sell your first ticket?</h2>
          <p>Create your event in under 5 minutes. No setup fee.</p>
          <Link href="/create" className="landing-cta-primary">
            Create an event — free
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
                  }
