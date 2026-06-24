import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/settings"], // lock these down once auth is added
    },
    sitemap: "https://firephin.com/sitemap.xml",
  };
}