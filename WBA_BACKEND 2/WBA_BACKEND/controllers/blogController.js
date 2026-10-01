const Blog = require("../models/Blog");
const slugify = require("slugify");
const { uploadImage } = require("../services/s3Service");   //ding for s3
const generateSitemap =
require("../utils/generateSitemap");   //adding for sitemap


// =============================
// Create Blog
// =============================
exports.createBlog = async (req, res) => {
   console.log("========== CREATE BLOG ==========");
   console.log("Body:", req.body);console.log("File:", req.file);  
   console.log("=== CREATE BLOG API HIT ===");
    console.log(req.body);
  
  try {
    const title = req.body.title.trim();

    // Validate workspaceId
    if (!req.body.workspaceId) {
      return res.status(400).json({
        success: false,
        message: "workspaceId is required",
      });
    }

    // Check duplicate title within the same workspace
    const existingBlog = await Blog.findOne({
      title,
      workspaceId: req.body.workspaceId,
    });

    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "Blog title already exists",
      });
    }

    // Upload image to S3
    let imageUrl =
  req.body.featuredImage ||
  req.body.coverImage ||
  "";

     if (req.file) {
      imageUrl = await uploadImage(req.file);
       console.log("Image URL:", imageUrl); //adding for debug

    }
   
    // Generate slug
    const slug = slugify(title, {
      lower: true,
      strict: true,
    });

    // Create blog
    const blog = await Blog.create({
      title,
      slug,
      workspaceId: req.body.workspaceId,
      content: req.body.content,

      featuredImage: imageUrl,

      seoTitle:
      req.body.seoTitle || req.body.seo?.title,

     seoDescription:
     req.body.seoDescription || req.body.seo?.description,

     seoKeywords:
     req.body.seoKeywords ||
     req.body.seo?.keywords,

      ogTitle: req.body.ogTitle || title,
      ogDescription:
        req.body.ogDescription || req.body.seoDescription,
      ogImage: req.body.ogImage || imageUrl,
      ogType: req.body.ogType || "article",
      twitterCard:
        req.body.twitterCard || "summary_large_image",
      canonicalUrl:
       req.body.canonicalUrl ||
       `https://yourdomain.com/blog/${req.body.workspaceId}/${slug}`,

      status: req.body.status,
    });

    res.status(201).json({
      success: true,
      data: blog,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =============================
// Get All Blogs
// =============================
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;
    const sort = req.query.sort || "newest";

// Validate workspaceId
if (!req.params.workspaceId) {
  return res.status(400).json({
    success: false,
    message: "workspaceId is required",
  });
}

const query = {
  workspaceId: req.params.workspaceId,
};
     if (search) {
     query.title = {
    $regex: search,
    $options: "i",
    };
     }
     if (status) {
  query.status = status;
}
let sortOption = {
  createdAt: -1,
};
if (sort === "oldest") {
  sortOption = {
    createdAt: 1,
  };
}

const skip = (page - 1) * limit;
const blogs = await Blog.find(query)
  .select("-__v")
  .sort(sortOption)
  .skip(skip)
  .limit(limit)
  .lean();
  const totalBlogs = await Blog.countDocuments(query);

    res.status(200).json({
  success: true,
  currentPage: page,
  totalPages: Math.ceil(totalBlogs / limit),
  totalBlogs,
  data: blogs,
})

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// Get Blog By Slug
// =============================
exports.getBlogBySlug = async (req, res) => {
  try {

    // Validate workspaceId
    if (!req.params.workspaceId) {
      return res.status(400).json({
        success: false,
        message: "workspaceId is required",
      });
    }

    const blog = await Blog.findOne({
      workspaceId: req.params.workspaceId,
      slug: req.params.slug,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// =============================
// Update Blog
// =============================
exports.updateBlog = async (req, res) => {
  try {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const updatedData = {};
    if (req.body.workspaceId)
  updatedData.workspaceId = req.body.workspaceId;

    // Update title
    if (req.body.title) {

      const title = req.body.title.trim();

      const existingBlog = await Blog.findOne({
  title,
  workspaceId: blog.workspaceId,
  _id: { $ne: req.params.id },
});

      if (existingBlog) {
        return res.status(400).json({
          success: false,
          message: "Blog title already exists",
        });
      }

      updatedData.title = title;

      updatedData.slug = slugify(title, {
        lower: true,
        strict: true,
      });

      // Open Graph defaults
      updatedData.ogTitle = req.body.ogTitle || title;

      updatedData.canonicalUrl =
       req.body.canonicalUrl ||
       `https://yourdomain.com/blog/${updatedData.workspaceId || blog.workspaceId}/${updatedData.slug}`;
    }

    // Update image
    if (req.body.featuredImage || req.body.coverImage) {
  updatedData.featuredImage =
    req.body.featuredImage || req.body.coverImage;
}
    if (req.file) {
      updatedData.featuredImage = await uploadImage(req.file);
    }

    // Update remaining fields
    if (req.body.content)
      updatedData.content = req.body.content;

    if (req.body.seoTitle)
      updatedData.seoTitle = req.body.seoTitle;

    if (req.body.seoDescription) {
      updatedData.seoDescription = req.body.seoDescription;

      updatedData.ogDescription =
        req.body.ogDescription || req.body.seoDescription;
    }

    if (req.body.seoKeywords)
      updatedData.seoKeywords = req.body.seoKeywords;

    // Open Graph Fields
    if (req.body.ogTitle)
      updatedData.ogTitle = req.body.ogTitle;

    if (req.body.ogDescription)
      updatedData.ogDescription = req.body.ogDescription;

    if (req.body.ogImage)
      updatedData.ogImage = req.body.ogImage;

    if (req.body.ogType)
      updatedData.ogType = req.body.ogType;

    if (req.body.twitterCard)
      updatedData.twitterCard = req.body.twitterCard;

    if (req.body.canonicalUrl)
      updatedData.canonicalUrl = req.body.canonicalUrl;

    if (req.body.status)
      updatedData.status = req.body.status;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (updatedBlog.status === "published") {
      await generateSitemap();
    }

    res.status(200).json({
      success: true,
      data: updatedBlog,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
 // --- Publish Blog----//
 exports.publishBlog = async (req, res) => {

try{

const blog = await Blog.findById(req.params.id);

if(!blog){

return res.status(404).json({

success:false,

message:"Blog not found"

});

}

blog.status="published";



await blog.save();

await generateSitemap();

res.status(200).json({

success:true,

message:"Blog published successfully",

data:blog

});

}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

} // end 
// =============================
// Delete Blog
// =============================
exports.deleteBlog = async (req, res) => {
  try {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

