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
  {
    slug: "emergency-fund",
    title: "How Big Should Your Emergency Fund Be?",
    description: "Why an emergency fund matters and how to size it for your situation.",
    publishedAt: "2026-06-22",
    content: `An emergency fund is cash you set aside for unexpected expenses like job loss, medical bills, or car repairs. It keeps you from going into debt when life surprises you.

A common rule of thumb is three to six months of essential expenses. If your job is stable, three months may be enough. If your income is irregular, aim for six months or more.

Keep your emergency fund in a safe, accessible place such as a high-yield savings account. It should be easy to reach but separate from your daily spending account.`,
  },
  {
    slug: "budget-50-30-20",
    title: "The 50/30/20 Budget Rule",
    description: "A simple framework for splitting your income between needs, wants, and savings.",
    publishedAt: "2026-06-24",
    content: `The 50/30/20 rule is a simple way to budget your after-tax income. You spend 50% on needs, 30% on wants, and 20% on savings and debt payoff.

Needs include rent, groceries, utilities, and minimum debt payments. Wants are dining out, entertainment, and hobbies. Savings covers emergency funds, retirement, and extra debt payments.

If your current split is off, you can adjust gradually. The goal is to make your money align with your priorities.`,
  },
  {
    slug: "index-funds",
    title: "Why Index Funds Work for Most Investors",
    description: "A look at low-cost diversification and why index funds are a popular long-term choice.",
    publishedAt: "2026-06-26",
    content: `Index funds pool money from many investors to buy a broad slice of the market. Instead of picking individual stocks, you own hundreds or thousands of companies at once.

This approach gives you instant diversification and lower fees than most actively managed funds. Over time, many index funds outperform the average active fund because costs are so low.

For long-term investors, index funds are a simple, hands-off way to build wealth. You can start with broad market funds and add bond or international funds as your portfolio grows.`,
  },
  {
    slug: "coast-fire",
    title: "What Is Coast FIRE?",
    description: "How Coast FIRE lets you stop saving aggressively and let compound growth do the rest.",
    publishedAt: "2026-06-27",
    content: `Coast FIRE is the point where you have saved enough for retirement that you no longer need to contribute another dollar. Compound growth is expected to carry you the rest of the way.

The trick is to invest early and consistently. Once you reach Coast FIRE, you can shift your focus to covering current expenses without worrying about adding to retirement accounts.

It is a flexible milestone. You can use it to take a lower-paying job, work part time, or simply enjoy more financial breathing room.`,
  },
  {
    slug: "compound-interest",
    title: "The Power of Compound Interest",
    description: "Why starting early matters more than how much you save at first.",
    publishedAt: "2026-06-28",
    content: `Compound interest is the interest you earn on both your original investment and the interest it has already earned. Over time, this snowball effect can turn small contributions into substantial wealth.

The key factor is time. Someone who starts investing in their twenties can contribute less total money and still end up ahead of someone who starts in their thirties with larger contributions.

That is why starting early, even with small amounts, is often more powerful than waiting until you have more to invest.`,
  },
  {
    slug: "high-yield-savings",
    title: "Are High-Yield Savings Accounts Worth It?",
    description: "How to earn more on your emergency fund without extra risk.",
    publishedAt: "2026-06-29",
    content: `High-yield savings accounts pay significantly more interest than traditional savings accounts. They are a safe place to park money you might need soon, like an emergency fund or short-term savings.

The main benefit is liquidity. Your money is accessible, and in many cases the account is FDIC insured. The trade-off is that returns are lower than what you might expect from long-term investments.

For goals within the next few years, a high-yield savings account is usually a better choice than the stock market.`,
  },
  {
    slug: "credit-card-rewards",
    title: "How to Use Credit Card Rewards Without Going Into Debt",
    description: "A practical guide to earning points and cashback responsibly.",
    publishedAt: "2026-06-30",
    content: `Credit card rewards can be a great way to earn cashback, points, or travel perks. But they only make sense if you pay off your balance in full every month.

Interest charges on carried balances quickly erase any rewards you earn. The best strategy is to treat your credit card like a debit card and only spend what you can pay off.

Pick a card that matches your actual spending. If you spend a lot on groceries, a grocery rewards card may beat a general travel card.`,
  },
  {
    slug: "roth-vs-traditional-ira",
    title: "Roth IRA vs. Traditional IRA",
    description: "How to choose between tax-free growth and a tax deduction today.",
    publishedAt: "2026-07-01",
    content: `Both Roth and Traditional IRAs help you save for retirement, but they treat taxes differently. Traditional contributions may be tax-deductible now, while Roth withdrawals are tax-free in retirement.

If you expect to be in a higher tax bracket in retirement, a Roth IRA is often the better choice. If you expect to be in a lower bracket, a Traditional IRA may save you more today.

Many people use a mix of both to give themselves flexibility when they retire.`,
  },
  {
    slug: "tax-loss-harvesting",
    title: "What Is Tax-Loss Harvesting?",
    description: "How to turn investment losses into tax savings without changing your strategy.",
    publishedAt: "2026-07-02",
    content: `Tax-loss harvesting is the practice of selling investments at a loss to offset capital gains taxes. When done correctly, it can lower your tax bill without materially changing your portfolio.

The key is to avoid the wash-sale rule, which disallows a loss if you buy the same or a substantially identical security within 30 days. Many investors use a similar but not identical fund to maintain market exposure.

It is most useful in taxable accounts and is typically automated by robo-advisors or managed portfolios.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return posts;
}

export function getAllPostsSorted(): BlogPost[] {
  return [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
