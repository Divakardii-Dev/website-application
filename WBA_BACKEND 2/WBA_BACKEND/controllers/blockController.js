const Block = require("../models/Block");

// Get All Blocks
exports.getBlocks = async (req, res) => {
  try {
    const blocks = await Block.find();

    res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Block
exports.createBlock = async (req, res) => {
  try {
    const block = await Block.create(req.body);

    res.status(201).json({
      success: true,
      message: "Block created successfully",
      block,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Blocks By View
exports.getBlocksByView = async (req, res) => {
  try {
    const { view } = req.query;

    const blocks = await Block.find({
      view,
    });

    res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Search Blocks
exports.searchBlocks = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    let filter = {};

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    let query = Block.find(filter);

    if (sort === "name") {
      query = query.sort({ name: 1 });
    }

    if (sort === "latest") {
      query = query.sort({ createdAt: -1 });
    }

    const blocks = await query;

    res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//adding for e-commerce block

exports.getBlockById = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Block not found",
      });
    }

    res.status(200).json({
      success: true,
      block,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Block
exports.updateBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Block not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Block updated successfully",
      block,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Delete Block
exports.deleteBlock = async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(
      req.params.id
    );

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Block not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Block deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//end 