const Product = require("../models/Product");
const Template = require("../models/Template");
const mongoose = require("mongoose");

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    const {
      workspaceId,
      name,
      slug,
      description,
      price,
      currency,
      images,
      category,
      inventory,
      status,
      salePrice,
      sku,
      image,
      templateId,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required",
      });
    }

    const imageArray = Array.isArray(images) ? images : [];

    if (templateId) {
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid templateId",
        });
      }

      const templateExists = await Template.exists({
        _id: templateId,
      });

      if (!templateExists) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    }

    const product = await Product.create({
      workspaceId: workspaceId || undefined,
      name: name.trim(),
      slug:
        req.body.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: description || "",
      price: Number(price),
      currency: currency || "INR",

      image: imageArray[0] || "",     
      images: imageArray,            

      category: category || "",
      inventory: inventory !== undefined ? Number(inventory) : 0,
      status: status || "active",
      salePrice:
        salePrice !== undefined && salePrice !== null
          ? Number(salePrice)
          : null,
      sku: sku || "",
      templateId: templateId || null,
    });
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const formattedProducts = products.map((product) => {
      const data = product.toObject();

      return {
        ...data,
        images: data.image ? [data.image] : [],
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET STOREFRONT PRODUCTS
exports.getStorefrontProducts = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const products = await Product.find();

    const formattedProducts = products.map((product) => {
      const data = product.toObject();

      return {
        ...data,
        id: data._id.toString(),
        images: data.image ? [data.image] : [],
      };
    });

    return res.status(200).json({
      workspaceId,
      products: formattedProducts,
      pagination: {
        page: 1,
        limit: formattedProducts.length,
        total: formattedProducts.length,
        pages: 1
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

// GET SINGLE PRODUCT
exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID"
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};