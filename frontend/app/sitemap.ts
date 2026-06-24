import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://firephin.com", lastModified: new Date() },
    { url: "https://firephin.com/dashboard", lastModified: new Date() },
    { url: "https://firephin.com/settings", lastModified: new Date() },
  ];
}