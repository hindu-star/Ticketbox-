import { Resend } from 'resend';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'TicketBox <noreply@ticketbox.com.ng>';

export async function sendWelcomeEmail({ to, name }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to TicketBox 🎟️',
    html: welcomeTemplate(name),
  });
}

export async function sendTicketEmail({
  to,
  name,
  event,
  ticket,
  orderId,
  quantity,
  total,
  ticketIds,
}) {
  // ticketIds is an array of individual ticket row IDs.
  // If missing (older flow), synthesize from orderId + quantity.
  const ids = Array.isArray(ticketIds) && ticketIds.length > 0
    ? ticketIds
    : Array.from({ length: quantity || 1 }, (_, i) => `${orderId}::${i + 1}`);

  const attachments = [];
  const qrImages = [];

  for (let i = 0; i < ids.length; i++) {
    const t = ids[i];
    const qrData = JSON.stringify({
      ticketId: t,
      orderId,
      event: event.title,
      eventId: event.id,
      ticket: ticket.name,
      number: i + 1,
      total: ids.length,
    });

    const qrBuffer = await QRCode.toBuffer(qrData, {
      width: 260,
      margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    });

    const cid = `qr-${i}`;
    attachments.push({
      filename: `ticket-${i + 1}.png`,
      content: qrBuffer,
      content_id: cid,
    });

    qrImages.push({
      cid,
      index: i + 1,
      total: ids.length,
    });
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject:
      ids.length > 1
        ? `Your ${ids.length} tickets for ${event.title} 🎟️`
        : `Your ticket for ${event.title} 🎟️`,
    html: ticketTemplate({
      name,
      event,
      ticket,
      orderId,
      quantity,
      total,
      qrImages,
    }),
    attachments,
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

          <a href="https://ticketbox.com.ng/create"
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

function ticketTemplate({ name, event, ticket, orderId, quantity, total, qrImages }) {
  const displayName = name || 'there';
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date TBA';

  const ticketBlocks = qrImages
    .map(
      (q) => `
      <div style="background:#fff;border:2px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
        ${
          qrImages.length > 1
            ? `<p style="font-size:11px;font-weight:700;color:#2563eb;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">
                Ticket ${q.index} of ${q.total}
              </p>`
            : ''
        }
        <img src="cid:${q.cid}" alt="QR code" width="220" height="220" style="display:block;margin:0 auto;border-radius:8px;" />
      </div>
    `
    )
    .join('');

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
            Hi ${displayName}, your ${qrImages.length === 1 ? 'ticket is' : `${qrImages.length} tickets are`} confirmed. ${
              qrImages.length > 1
                ? 'Each ticket has its own QR code below.'
                : 'Show the QR code below at the entrance.'
            }
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

          ${ticketBlocks}

          <div style="background:#f1f5f9;border-radius:12px;padding:16px;text-align:center;margin-top:20px;">
            <p style="font-size:12px;color:#64748b;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">
              Total paid
            </p>
            <p style="font-size:20px;font-weight:800;color:#111;margin:0;">
              ₦${Number(total).toLocaleString()}
            </p>
          </div>

          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:32px 0 0;">
            ${
              qrImages.length > 1
                ? 'Each QR code is unique and can only be scanned once. Forward each QR to the person using it, or bring them all on one device.'
                : "Please don't share this QR code with anyone — it's your unique entry pass."
            }
          </p>

          <p style="color:#94a3b8;font-size:11px;margin:12px 0 0;font-family:monospace;text-align:center;">
            Order: ${orderId}
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
