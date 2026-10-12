import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'TicketBox — Find Events Near You',
  description: 'Discover concerts, parties, conferences and more. Buy tickets in seconds.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎟️</text></svg>',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
