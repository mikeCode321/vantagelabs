

import Link from "next/link";
import { getAllPosts } from "@/lib/blog/posts";

export default function Blog() {
  const posts = getAllPosts();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Firephin Blog</h1>

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="border-b border-slate-200 pb-6">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-xl font-semibold text-slate-900 hover:text-blue-600 mb-2">
                {post.title}
              </h2>
            </Link>
            <p className="text-slate-600 mb-2">{post.description}</p>
            <p className="text-sm text-slate-400">
              {new Date(post.publishedAt).toLocaleDateString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}


