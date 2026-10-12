import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'TicketBox <onboarding@resend.dev>';

export async function sendWelcomeEmail({ to, name }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to TicketBox 🎟️',
    html: `<h1>Welcome to TicketBox!</h1><p>Hi ${name || 'there'},</p><p>You're now part of the easiest way to find events and sell tickets in Nigeria.</p>`,
  });
}

export async function sendTicketEmail({ to, name, event, ticket, orderId, quantity, total }) {
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Date TBA';

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your ticket for ${event.title} 🎟️`,
    html: `
      <h1>You're going! 🎉</h1>
      <p>Hi ${name || 'there'},</p>
      <p>Your ticket for <strong>${event.title}</strong> is confirmed.</p>
      <p><strong>${ticket.name}</strong></p>
      <p>📅 ${formattedDate}<br/>
      🕐 ${event.event_time || 'Time TBA'}<br/>
      📍 ${event.location}<br/>
      🎟️ ${quantity} ticket${quantity === 1 ? '' : 's'}</p>
      <p>Order: ${orderId}</p>
      <p>Total: ₦${Number(total).toLocaleString()}</p>
    `,
  });
}
