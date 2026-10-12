import { Resend } from 'resend';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'TicketBox <onboarding@resend.dev>';

export async function sendWelcomeEmail({ to, name }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to TicketBox 🎟️',
    html: welcomeTemplate(name),
  });
}

export async function sendTicketEmail({ to, name, event, ticket, orderId, quantity, total }) {
  // Generate QR code as a base64 data URL
  const qrData = JSON.stringify({
    orderId,
    event: event.title,
    eventId: event.id,
    ticket: ticket.name,
    quantity,
  });

  const qrDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#111111', light: '#ffffff' },
  });

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ticket for ${event.title} 🎟️`,
    html: ticketTemplate({ name, event, ticket, orderId, quantity, total, qrDataUrl }),
  });
}

function welcomeTemplate(name) {
  const displayName = name || 'there';
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#fff;border-radius:16px;padding:40px;border:1px solid #e2e8f0;">
          <div style="font-weight:800;font-size:22px;margin-bottom:24px;">
            Ticket<span style="color:#2563eb;">Box</span>
          </div>

          <h1 style="font-size:24px;font-weight:800;margin:0 0 16px;color:#111;">
            Welcome to TicketBox, ${displayName}! 🎟️
          </h1>

          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">
            You're now part of the easiest way to find events and sell tickets in Nigeria.
          </p>

          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Here's what you can do right now:
          </p>

          <ul style="color:#334155;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
            <li>Browse events happening around you</li>
            <li>Create your own event and start selling tickets</li>
            <li>Manage everything from your dashboard</li>
          </ul>

          <a href="https://ticketbox-lgsn.vercel.app/create"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">
            Create your first event
          </a>

          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:32px 0 0;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </div>

        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
          © 2026 TicketBox. Built with ❤️ in Nigeria.
        </p>
      </div>
    </body>
    </html>
  `;
}

function ticketTemplate({ name, event, ticket, orderId, quantity, total, qrDataUrl }) {
  const displayName = name || 'there';
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date TBA';

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
      <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
        <div style="background:#fff;border-radius:16px;padding:40px;border:1px solid #e2e8f0;">
          <div style="font-weight:800;font-size:22px;margin-bottom:24px;">
            Ticket<span style="color:#2563eb;">Box</span>
          </div>

          <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;color:#111;">
            You're going! 🎉
          </h1>

          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hi ${displayName}, your ticket is confirmed. Show the QR code below at the entrance.
          </p>

          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="font-size:12px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
              ${ticket.name}
            </div>
            <div style="font-size:16px;font-weight:700;color:#111;margin-bottom:16px;">
              ${event.title}
            </div>
            <div style="font-size:14px;color:#334155;line-height:1.8;">
              📅 ${formattedDate}<br/>
              🕐 ${event.event_time || 'Time TBA'}<br/>
              📍 ${event.location}<br/>
              🎟️ ${quantity} ticket${quantity === 1 ? '' : 's'}
            </div>
          </div>

          <div style="background:#fff;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
            <p style="font-size:12px;color:#64748b;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">
              Your Entry Pass
            </p>
            <img src="${qrDataUrl}" alt="QR code" style="width:220px;height:220px;display:block;margin:0 auto;" />
            <p style="font-size:11px;color:#94a3b8;margin:12px 0 0;font-family:monospace;">
              ${orderId}
            </p>
          </div>

          <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;">
            <p style="font-size:12px;color:#64748b;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">
              Total paid
            </p>
            <p style="font-size:20px;font-weight:800;color:#111;margin:0;">
              ₦${Number(total).toLocaleString()}
            </p>
          </div>

          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:32px 0 0;">
            Please don't share this QR code with anyone — it's your unique entry pass.
          </p>
        </div>

        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:24px;">
          © 2026 TicketBox. Built with ❤️ in Nigeria.
        </p>
      </div>
    </body>
    </html>
  `;
}
