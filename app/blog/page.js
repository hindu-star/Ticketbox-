import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata = {
  title: 'Blog — TicketBox',
};

const upcomingPosts = [
  {
    title: 'How to price your event tickets in Nigeria',
    excerpt: 'A practical guide to setting prices that fill your venue without leaving money on the table.',
    date: 'Coming soon',
  },
  {
    title: '5 ways to promote your event on WhatsApp',
    excerpt: 'WhatsApp is the biggest social network in Nigeria. Here is how to use it to sell tickets.',
    date: 'Coming soon',
  },
  {
    title: 'The complete checklist for first-time event organizers',
    excerpt: 'From venue to vendors to tickets — everything you need to plan your first event.',
    date: 'Coming soon',
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <div className="content-page">
        <h1>Blog</h1>
        <p className="content-lead">
          Tips, guides and stories for event organizers in Nigeria.
        </p>

        <div className="blog-list">
          {upcomingPosts.map((post, i) => (
            <div key={i} className="blog-card">
              <div className="blog-date">{post.date}</div>
              <h3 className="blog-title">{post.title}</h3>
              <p className="blog-excerpt">{post.excerpt}</p>
            </div>
          ))}
        </div>

        <div className="content-section">
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>
            More posts coming soon. Want to be notified? Follow us on social media.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
