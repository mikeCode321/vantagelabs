import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, getAllPosts, BlogPost } from "@/lib/blog/posts";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import "../styles/blog.css";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | Firephin Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const allPosts = getAllPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 5);

  if (!post) {
    notFound();
  }

  return (
    <div className="blog-page">
      <TopBar />

      <main className="blog-main">
        <div className="blog-layout">
          <article className="blog-content">
            <Link href="/blog" className="blog-post-back">
              ← Back to blog
            </Link>

            <header className="blog-post-header">
              <h1 className="blog-post-title">{post.title}</h1>
              <p className="blog-post-meta">
                Published on {new Date(post.publishedAt).toLocaleDateString()}
              </p>
            </header>

            <div className="blog-post-content">
              {post.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="blog-post-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <aside className="blog-sidebar">
            <section className="blog-sidebar-section">
              <h2 className="blog-sidebar-title">Related Posts</h2>
              <div className="blog-sidebar-list">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="blog-sidebar-link"
                  >
                    {related.title}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
