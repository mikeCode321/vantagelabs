import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, getAllPosts, BlogPost } from "@/lib/blog/posts";

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

  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block"
      >
        ← Back to blog
      </Link>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{post.title}</h1>
        <p className="text-slate-500 text-sm">
          Published on {new Date(post.publishedAt).toLocaleDateString()}
        </p>
      </header>

      <div className="prose prose-slate max-w-none">
        {post.content.split("\n\n").map((paragraph, index) => (
          <p key={index} className="mb-4 leading-relaxed text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
