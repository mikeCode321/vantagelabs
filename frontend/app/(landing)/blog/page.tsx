import Link from "next/link";
import { getAllPostsSorted, BlogPost } from "@/lib/blog/posts";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { RecentPostCard, formatDate } from "./components/PostCard";
import "./styles/blog.css";

function SpotlightPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-spotlight-card">
      <Link href={`/blog/${post.slug}`} className="blog-spotlight-link">
        <div className="blog-spotlight-image" aria-hidden="true" />
        <div className="blog-spotlight-body">
          <h2 className="blog-spotlight-title">{post.title}</h2>
          <p className="blog-spotlight-description">{post.description}</p>
          <p className="blog-spotlight-meta">{formatDate(post.publishedAt)}</p>
        </div>
      </Link>
    </article>
  );
}

function FeaturedPostItem({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-featured-item">
      <span className="blog-featured-title">{post.title}</span>
      <span className="blog-featured-date">{formatDate(post.publishedAt)}</span>
    </Link>
  );
}

export default function Blog() {
  const posts = getAllPostsSorted();
  const spotlightPost = posts.find((post) => post.slug === "intro-to-fire");
  const featuredPosts = posts.slice(0, 5);
  const recentPosts = posts.slice(0, 4);

  return (
    <div className="blog-page">
      <TopBar />

      <main className="blog-main">
        <div className="blog-landing">
          <div className="blog-hero-row">
            {spotlightPost && (
              <SpotlightPostCard post={spotlightPost} />
            )}

            <aside className="blog-featured-column">
              <h2 className="blog-featured-heading">Featured Posts</h2>
              <div className="blog-featured-list">
                {featuredPosts.map((post) => (
                  <FeaturedPostItem key={post.slug} post={post} />
                ))}
              </div>
            </aside>
          </div>

          <section className="blog-recent-section">
            <div className="blog-recent-header">
              <h2 className="blog-recent-heading">Recent Posts</h2>
              <Link href="/blog/all" className="blog-see-all">
                See all →
              </Link>
            </div>
            <div className="blog-recent-row">
              {recentPosts.map((post, index) => (
                <RecentPostCard
                  key={post.slug}
                  post={post}
                  variant={(index % 4) + 1}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}


