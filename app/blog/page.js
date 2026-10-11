import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { posts } from '../../lib/posts';

export const metadata = {
  title: 'Blog — TicketBox',
};

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
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="blog-card"
            >
              <div className="blog-date">
                {post.date} · {post.readTime}
              </div>
              <h3 className="blog-title">{post.title}</h3>
              <p className="blog-excerpt">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
