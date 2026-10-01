const Blog = require("../models/Blog");

const generateSitemap = async () => {
  const blogs = await Blog.find({
    status: "published",
  });

  const baseUrl =
    process.env.BASE_URL || "http://localhost:5000";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;

  xml += `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  blogs.forEach((blog) => {
    xml += `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${
      blog.updatedAt
        ? blog.updatedAt.toISOString()
        : blog.createdAt.toISOString()
    }</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
};

module.exports = generateSitemap;