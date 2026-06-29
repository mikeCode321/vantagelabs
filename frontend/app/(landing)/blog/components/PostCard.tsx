import Link from "next/link";
import { BlogPost } from "@/lib/blog/posts";

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RecentPostCard({
  post,
  variant,
}: {
  post: BlogPost;
  variant: number;
}) {
  return (
    <article className="blog-recent-card">
      <Link href={`/blog/${post.slug}`} className="blog-recent-link">
        <div
          className={`blog-recent-image blog-recent-image--variant-${variant}`}
          aria-hidden="true"
        />
        <div className="blog-recent-body">
          <h3 className="blog-recent-title">{post.title}</h3>
          <p className="blog-recent-description">{post.description}</p>
          <p className="blog-recent-meta">{formatDate(post.publishedAt)}</p>
        </div>
      </Link>
    </article>
  );
}
