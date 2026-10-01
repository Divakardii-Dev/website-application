const Template = require("../models/Template");
const Project = require("../models/Project");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const Order = require("../models/Order");

const {
  getTemplateAccess: getUserTemplateAccess,
} = require("../services/templateAccessService");

const uploadToS3 = require("../utils/uploadToS3");
const { uploadImageToS3 } = require("../services/s3UploadService");
const mongoose = require("mongoose");

// GET ALL TEMPLATES
exports.getTemplates = async (req, res) => {
  try {
    const { category, search, isPremium } = req.query;

    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isPremium !== undefined) {
      filter.isPremium = isPremium === "true";
    }

    const templates = await Template.find(filter).sort({
      createdAt: -1,
    });

    const formattedTemplates = templates.map((template) => ({
      _id: template._id,
      name: template.name,
      slug:
        template.slug ||
        template.name.toLowerCase().replace(/\s+/g, "-"),
      category: template.category,
      style: template.style || "Modern",
      description: template.description || "",
      thumbnail: template.thumbnail || template.imageUrl || "",
      previewPath: template.previewPath,
      isPremium: template.isPremium || false,
      tags: Array.isArray(template.tags) ? template.tags : [],
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedTemplates.length,
      templates: formattedTemplates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// UPLOAD TEMPLATE
exports.uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const imageUrl = await uploadImageToS3(req.file);

    const template = await Template.create({
      title: req.body.title,
      category: req.body.category,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Template uploaded successfully",
      data: template,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE TEMPLATE
exports.createTemplate = async (req, res) => {
  try {
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    const {
      name,
      description,
      category,
      thumbnail,
      builderData,
    } = req.body;

    let imageUrl = thumbnail || "";

    // Upload image to S3 if file is provided
    if (req.file) {
      imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const template = await Template.create({
      name,
      description,
      category: category?.trim().toLowerCase(),
      thumbnail: imageUrl,
      templateData: builderData,
      previewPath: "",
    });

    template.previewPath = `/templates/preview?id=${template._id}`;
    await template.save();

    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CLONE TEMPLATE
exports.cloneTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await Template.findById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const access = await getUserTemplateAccess(userId, id);

    if (!access.canEdit) {
      return res.status(403).json({
        success: false,
        code: "TEMPLATE_PURCHASE_REQUIRED",
        message: "Please purchase this template to edit it.",
        canEdit: false,
      });
    }
    const projectData = {
      userId,
      templateId: template._id,
      name: `${template.name} Project`,
      category: template.category,
      image: template.thumbnail,
      description: template.description,
      status: "draft",
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: "Template cloned successfully",
      projectId: project._id,
      data: {
        projectId: project._id,
        templateId: template._id,
        projectName: project.name,
        category: project.category,
        imageUrl: project.image,
        description: project.description,
        status: project.status,
      },
    });
  } catch (error) {
    console.error("Clone Template Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET TEMPLATE ACCESS
exports.getTemplateAccess = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const access = await getUserTemplateAccess(userId);

    return res.status(200).json({
      success: true,
      authenticated: true,
      userId,
      ...access,
    });
  } catch (error) {
    console.error("Get Template Access Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch template access",
      error: error.message,
    });
  }
};

// CHECK SINGLE TEMPLATE ACCESS
exports.checkSingleTemplateAccess = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const { templateId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID",
      });
    }

    const template = await Template.findById(templateId).select(
      "_id name"
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Get subscription + purchased template access from service
    const access = await getUserTemplateAccess(
      userId,
      templateId
    );

    return res.status(200).json({
      success: true,
      authenticated: true,
      userId,
      templateId: template._id,
      ...access,
    });
  } catch (error) {
    console.error(
      "Check Single Template Access Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to check template access",
      error: error.message,
    });
  }
};

// GET TEMPLATE BY ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        message: "Template not found",
      });
    }

    return res.status(200).json({
      template: {
        _id: template._id,
        name: template.name,
        slug: template.slug || "",
        previewPath: template.previewPath,
        category: template.category,
        style: template.style || "Modern",
        description: template.description || "",
        thumbnail: template.thumbnail || "",
        isPremium: template.isPremium || false,
        tags: template.tags || [],
        usageCount: template.usageCount || 0,
        sections: template.sections || [],
        pages: template.pages || [
          {
            id: "home",
            name: "Home",
            path: "/",
          },
        ],
        componentCount: template.componentCount || 0,
        builderData: template.templateData || {
          schemaVersion: 1,
          components: [],
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch template",
      error: error.message,
    });
  }
};

// UPDATE TEMPLATE
exports.updateTemplate = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    // Upload new image if provided
    if (req.file) {
      const imageUrl = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      updateData.thumbnail = imageUrl;
    }

    if (req.body.builderData) {
        updateData.templateData = req.body.builderData;
    }

    const template =
      await Template.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE TEMPLATE
exports.deleteTemplate = async (req, res) => {
  try {
    const template =
      await Template.findByIdAndDelete(
        req.params.id
      );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};