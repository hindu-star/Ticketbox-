import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'How to get paid — TicketBox',
  description:
    'A complete guide for organizers on setting up payouts, creating events, and getting paid on TicketBox.',
};

export default function HowToGetPaidPage() {
  return (
    <>
      <Navbar />
      <div className="guide-page">
        <h1>How to get paid on TicketBox</h1>
        <p className="guide-lead">
          A complete walkthrough for organizers — from signing up to receiving
          money in your bank account.
        </p>

        {/* STEP 1 */}
        <div className="guide-step">
          <div className="guide-step-num">1</div>
          <h2 className="guide-step-title">Create your account</h2>
          <div className="guide-step-body">
            <p>
              Go to{' '}
              <Link href="/login" className="guide-link">
                ticketbox.com.ng/login
              </Link>{' '}
              and sign up with:
            </p>
            <ul>
              <li>
                Your <strong>full legal name</strong> (as it appears on your
                bank account)
              </li>
              <li>Your email address</li>
              <li>A password (at least 6 characters)</li>
            </ul>
            <p>
              We&apos;ll send you a confirmation email — click the link inside
              to activate your account.
            </p>
          </div>
        </div>

        {/* STEP 2 */}
        <div className="guide-step">
          <div className="guide-step-num">2</div>
          <h2 className="guide-step-title">Set up your payout account</h2>
          <div className="guide-step-body">
            <p>
              This is where your ticket money will be sent. Open the ☰ menu →{' '}
              <strong>Account → Payout account</strong>.
            </p>
            <ol>
              <li>
                Select your <strong>bank</strong> from the list
              </li>
              <li>
                Enter your <strong>10-digit account number</strong>
              </li>
              <li>
                Your <strong>account name</strong> will auto-fill from your bank
              </li>
              <li>
                Tap <strong>Save payout account</strong>
              </li>
            </ol>
            <div className="guide-note">
              <strong>Important:</strong> Your bank account name must match the
              name you used to sign up. If they don&apos;t match, we can&apos;t
              verify you, and your account won&apos;t be approved.
            </div>
            <p>Once saved, you&apos;re ready to receive money. 💰</p>
          </div>
        </div>

        {/* STEP 3 */}
        <div className="guide-step">
          <div className="guide-step-num">3</div>
          <h2 className="guide-step-title">Create your event</h2>
          <div className="guide-step-body">
            <p>
              Open the ☰ menu → <strong>+ Create event</strong>. Fill in three
              quick steps:
            </p>
            <ul>
              <li>
                <strong>Step 1 — Details:</strong> Event name, description,
                location, format, category, and schedule
              </li>
              <li>
                <strong>Step 2 — Appearance:</strong> Upload a cover image and
                pick a theme for your event page
              </li>
              <li>
                <strong>Step 3 — Tickets:</strong> Add your ticket types —
                Regular, VIP, VVIP, Free, whatever suits your event
              </li>
            </ul>
            <p>
              When you&apos;re ready, tap <strong>Publish event</strong>. If you
              want to save it for later, tap <strong>Save as draft</strong>{' '}
              instead.
            </p>
          </div>
        </div>

        {/* STEP 4 */}
        <div className="guide-step">
          <div className="guide-step-num">4</div>
          <h2 className="guide-step-title">Share and sell</h2>
          <div className="guide-step-body">
            <p>
              On your event page, tap <strong>Share event</strong> to send the
              link to WhatsApp, Instagram, Twitter, or wherever your audience
              is.
            </p>
            <p>Buyers can pay in three ways:</p>
            <ul>
              <li>
                <strong>Card</strong> (any Nigerian debit or credit card)
              </li>
              <li>
                <strong>Bank transfer</strong>
              </li>
              <li>
                <strong>USSD</strong>
              </li>
            </ul>
            <p>
              No Paystack account needed for buyers. They pay directly on your
              event page.
            </p>
          </div>
        </div>

        {/* STEP 5 */}
        <div className="guide-step">
          <div className="guide-step-num">5</div>
          <h2 className="guide-step-title">Get paid</h2>
          <div className="guide-step-body">
            <p>Here&apos;s how the money works:</p>
            <ul>
              <li>
                For every ticket sold, you receive{' '}
                <strong>95% of the ticket price</strong>
              </li>
              <li>
                TicketBox takes a <strong>5% service fee</strong>, which the
                buyer pays on top (so you keep your full price)
              </li>
              <li>
                Money is settled{' '}
                <strong>directly to your bank account</strong> the next
                business day after each sale
              </li>
            </ul>
            <div className="guide-note">
              <strong>Example:</strong> You sell a ₦5,000 ticket → buyer pays
              ₦5,250 → you receive ₦5,000 in your bank the next day.
            </div>
          </div>
        </div>

        {/* STEP 6 */}
        <div className="guide-step">
          <div className="guide-step-num">6</div>
          <h2 className="guide-step-title">Scan tickets at the door</h2>
          <div className="guide-step-body">
            <p>
              On event day, open the ☰ menu → <strong>My Events</strong> → tap{' '}
              <strong>Check-in</strong> on your event.
            </p>
            <ol>
              <li>
                Set a 4-digit PIN — share this with whoever is scanning at the
                door
              </li>
              <li>
                Tap <strong>Start scanning</strong> → point your phone at each
                buyer&apos;s QR code
              </li>
              <li>
                <strong>Green ✅</strong> = valid ticket ·{' '}
                <strong>Red ❌</strong> = already used or invalid
              </li>
            </ol>
            <p>
              Buyers receive their QR codes by email immediately after purchase.
              Each ticket has its own QR code that can only be scanned once.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="guide-faq">
          <h2>Common questions</h2>

          <div className="guide-faq-item">
            <div className="guide-faq-q">
              What if my bank name doesn&apos;t match my signup name?
            </div>
            <div className="guide-faq-a">
              Contact support at <strong>ticketboxhq@gmail.com</strong>. We can
              update the record or help you sort it with your bank.
            </div>
          </div>

          <div className="guide-faq-item">
            <div className="guide-faq-q">
              When do I actually receive the money?
            </div>
            <div className="guide-faq-a">
              Money settles to your bank the next business day after each sale.
              Weekends may push to Monday.
            </div>
          </div>

          <div className="guide-faq-item">
            <div className="guide-faq-q">Can I sell free tickets?</div>
            <div className="guide-faq-a">
              Yes — free tickets skip payment entirely. You still get a QR code
              for each attendee, and you can still check them in at the door.
            </div>
          </div>

          <div className="guide-faq-item">
            <div className="guide-faq-q">Can I refund a buyer?</div>
            <div className="guide-faq-a">
              Contact support — refunds are handled manually for now.
            </div>
          </div>

          <div className="guide-faq-item">
            <div className="guide-faq-q">Can I make a ticket invite-only?</div>
            <div className="guide-faq-a">
              Yes. When creating a ticket, check the &quot;Invite-only&quot;
              box and set a password. Only people you share the password with
              can see and buy that ticket.
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="guide-cta">
          <h2>Ready to sell?</h2>
          <p>Create your first event in under 5 minutes.</p>
          <Link href="/create" className="content-btn-primary">
            Create an event
          </Link>
        </div>

        <div className="guide-contact">
          <p>
            Questions? Email us at{' '}
            <a
              href="mailto:ticketboxhq@gmail.com"
              className="guide-link"
            >
              ticketboxhq@gmail.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
                }
