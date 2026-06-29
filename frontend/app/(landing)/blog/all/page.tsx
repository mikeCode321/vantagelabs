import Link from "next/link";
import { getAllPostsSorted } from "@/lib/blog/posts";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import { RecentPostCard } from "../components/PostCard";
import "../styles/blog.css";

export default function AllPostsPage() {
  const posts = getAllPostsSorted();

  return (
    <div className="blog-page">
      <TopBar />

      <main className="blog-main">
        <div className="blog-all-container">
          <header className="blog-all-header">
            <Link href="/blog" className="blog-all-back">
              ← Back to blog
            </Link>
            <h1 className="blog-all-title-page">All Posts</h1>
          </header>

          <div className="blog-all-grid">
            {posts.map((post, index) => (
              <RecentPostCard
                key={post.slug}
                post={post}
                variant={(index % 4) + 1}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
