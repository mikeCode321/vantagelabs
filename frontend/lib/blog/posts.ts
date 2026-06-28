export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "intro-to-fire",
    title: "What Is FIRE?",
    description: "A simple introduction to Financial Independence, Retire Early.",
    publishedAt: "2026-06-15",
    content: `FIRE stands for Financial Independence, Retire Early. It is a movement focused on saving and investing aggressively so you can live off your portfolio sooner than the traditional retirement age.

The core idea is simple: control your expenses, grow your income, and invest the difference. Over time, your investments produce enough passive income to cover your living costs.

There are many flavors of FIRE, including Lean FIRE, Fat FIRE, and Coast FIRE. Each one reflects a different lifestyle goal and risk tolerance.`,
  },
  {
    slug: "mortgage-vs-invest",
    title: "Should You Pay Off Your Mortgage or Invest?",
    description: "How to compare mortgage prepayments with investing in the market.",
    publishedAt: "2026-06-20",
    content: `This is one of the most common personal finance questions. The answer depends on your interest rate, risk tolerance, and time horizon.

If your mortgage rate is low, investing in a diversified portfolio may earn a higher return over the long run. If your rate is high, paying down the mortgage gives you a guaranteed, risk-free return.

A good approach is to compare the after-tax cost of your mortgage with your expected investment return. Use the Firephin mortgage calculator to run the numbers.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts;
}
