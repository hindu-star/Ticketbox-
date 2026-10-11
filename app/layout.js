import './globals.css';

export const metadata = {
  title: 'TicketBox — Find Events Near You',
  description: 'Discover concerts, parties, conferences and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
