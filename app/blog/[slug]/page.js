import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { posts, getPost } from '../../../lib/posts';

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} — TicketBox Blog`,
    description: post.excerpt,
  };
}

function renderContent(content) {
  const blocks = content.trim().split('\n\n');

  return blocks.map((block, i) => {
    const trimmed = block.trim();

    if (trimmed.startsWith('## ')) {
      return <h2 key={i} className="post-heading">{trimmed.replace('## ', '')}</h2>;
    }

    if (trimmed.startsWith('- [ ] ')) {
      const items = trimmed.split('\n').filter((l) => l.trim());
      return (
        <ul key={i} className="post-checklist">
          {items.map((item, j) => (
            <li key={j}>{item.replace('- [ ] ', '')}</li>
          ))}
        </ul>
      );
    }

    if (trimmed.startsWith('- ')) {
      const items = trimmed.split('\n').filter((l) => l.trim());
      return (
        <ul key={i} className="post-list">
          {items.map((item, j) => (
            <li key={j}>{item.replace('- ', '')}</li>
          ))}
        </ul>
      );
    }

    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="post-quote">
          {trimmed.replace('> ', '')}
        </blockquote>
      );
    }

    return <p key={i} className="post-paragraph">{trimmed}</p>;
  });
}

export default function PostPage({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <article className="post-page">
        <Link href="/blog" className="post-back">
          ← Back to blog
        </Link>

        <div className="post-meta">
          {post.date} · {post.readTime}
        </div>
        <h1 className="post-title">{post.title}</h1>
        <p className="post-excerpt">{post.excerpt}</p>

        <div className="post-body">
          {renderContent(post.content)}
        </div>

        <div className="post-cta">
          <h3>Ready to host your own event?</h3>
          <p>Create your event on TicketBox in minutes.</p>
          <Link href="/create" className="content-btn-primary">
            Create an event
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
        }
