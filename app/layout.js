import './globals.css';

export const metadata = {
  title: 'TicketBox — Find Events Near You',
  description:
    'Discover concerts, parties, conferences and more. Buy tickets in seconds.',
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%232563eb'/%3E%3Ctext x='50' y='50' font-family='Arial, Helvetica, sans-serif' font-size='62' font-weight='900' fill='%23ffffff' text-anchor='middle' dominant-baseline='central'%3ET%3C/text%3E%3C/svg%3E",
      },
    ],
    shortcut: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%232563eb'/%3E%3Ctext x='50' y='50' font-family='Arial, Helvetica, sans-serif' font-size='62' font-weight='900' fill='%23ffffff' text-anchor='middle' dominant-baseline='central'%3ET%3C/text%3E%3C/svg%3E",
      },
    ],
    apple: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%232563eb'/%3E%3Ctext x='50' y='50' font-family='Arial, Helvetica, sans-serif' font-size='62' font-weight='900' fill='%23ffffff' text-anchor='middle' dominant-baseline='central'%3ET%3C/text%3E%3C/svg%3E",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
