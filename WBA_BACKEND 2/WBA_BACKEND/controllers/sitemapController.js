const generateSitemap = require("../utils/generateSitemap");

exports.getSitemap = async (req, res) => {
  try {
    const sitemap = await generateSitemap();

    res.header("Content-Type", "application/xml");
    res.send(sitemap);

  } catch (error) {
    res.status(500).send(error.message);
  }
};