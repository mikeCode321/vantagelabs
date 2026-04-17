This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



#### SAVE FOR LATE USE (SEO AND METADATA)
// export const metadata: Metadata = {
//   title: "Vantage Personal",
//   description: "Plan and simulate your personal finances with Vantage Personal. Custom investment, savings, and retirement simulations.",
//   keywords: [
//     "personal finance",
//     "financial simulator",
//     "savings planner",
//     "investment simulator",
//     "retirement planning",
//     "Vantage Personal"
//   ],
//   authors: [{ name: "Vantage Labs", url: "https://vantage.com" }],

  // commented out for now - but useful for seo and social sharing when we have a public site
  // openGraph: {
  //   title: "Vantage Personal",
  //   description: "Custom personal finance simulations to plan your investments, savings, and retirement.",
  //   url: "https://personal.vantage.com",
  //   siteName: "Vantage Personal",
  //   type: "website",
  //   images: [
  //     {
  //       url: "https://personal.vantage.com/og-image.png",
  //       width: 1200,
  //       height: 630,
  //       alt: "Vantage Personal - Financial Simulation Dashboard",
  //     },
  //   ],
  // },
  
  // EXAMPLE: for social media card when sharing 
  // twitter: {
  //   card: "summary_large_image",
  //   title: "Vantage Personal",
  //   description: "Custom personal finance simulations to plan your investments, savings, and retirement.",
  //   images: ["https://personal.vantage.com/og-image.png"],
  //   creator: "@VantageLabs",
  // },
// };




current API output:
[
  {
    "year": 1,
    "net_worth": 436518.74,
    "total_cash": 106518.74,
    "total_income": 120000,
    "total_expenses": 32000,
    "sources": [
      {
        "id": "hysa_1",
        "name": "bank_of_america",
        "source_type": "liquid",
        "asset_value": 106518.74,
        "annual_cashflow": 1718.74,
        "start_value": null,
        "end_value": null
      },
      {
        "id": "job_1",
        "name": "Google",
        "source_type": "job",
        "asset_value": 0,
        "annual_cashflow": 120000,
        "start_value": 120000,
        "end_value": 123600
      },
      {
        "id": "exp_1",
        "name": "Living Expenses",
        "source_type": "expense",
        "asset_value": 0,
        "annual_cashflow": -32000,
        "start_value": 32000,
        "end_value": 32640
      },
      {
        "id": "rental_1",
        "name": "123 Lane St, Michigan 12345",
        "source_type": "rental",
        "asset_value": 330000,
        "annual_cashflow": 16800,
        "start_value": null,
        "end_value": null
      }
    ]
  },
  {
    "year": 2,
    "net_worth": 559696.04,
    "total_cash": 196696.04,
    "total_income": 123600,
    "total_expenses": 55000,
    "sources": [
      {
        "id": "hysa_1",
        "name": "bank_of_america",
        "source_type": "liquid",
        "asset_value": 196696.04,
        "annual_cashflow": 4777.3,
        "start_value": null,
        "end_value": null
      },
      {
        "id": "job_1",
        "name": "Google",
        "source_type": "job",
        "asset_value": 0,
        "annual_cashflow": 123600,
        "start_value": 123600,
        "end_value": 127308
      },
      {
        "id": "exp_1",
        "name": "Living Expenses",
        "source_type": "expense",
        "asset_value": 0,
        "annual_cashflow": -55000,
        "start_value": 55000,
        "end_value": 56925
      },
      {
        "id": "rental_1",
        "name": "123 Lane St, Michigan 12345",
        "source_type": "rental",
        "asset_value": 363000,
        "annual_cashflow": 16800,
        "start_value": null,
        "end_value": null
      }
    ]
  }
]


When state changes, what reruns exactly?

When you dispatch:

dispatch({ type: "SET_PLAYING", isPlaying: true });

or

dispatch({ type: "UPDATE_YEAR", ... });

this happens:

Step-by-step
dispatch is called

React calls:

simReducer(state, action)
New state is returned

React re-renders:

useSimulation()

Then React re-renders:

Dashboard()