const productModel = require("../models/productModel")
const vendorModel = require("../models/vendorModel");
const userModel = require("../models/userModel");

// Add Product //
const addProduct = async (req, res) => {
    try {
        // extract the fields from body // 
        const { name, price, description, category, stock, image } = req.body;
        //  get vendor id from logged-in user //
        const vendorId = req.user.id

        // check all fields //
        if (!name || !price || !description || !category || stock == null || !image) {
            return res.status(403).json({ success: false, message: "all fields are required" })
        }
        // ckeck vendor in database //
        const vendor = await vendorModel.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        // create the new product //
        const product = await productModel.create({ name, price, description, category, stock, image, vendor: req.user.id, });

        // push the product id in the vendor product list  //
        vendor.products.push(product._id);
        await vendor.save();

        res.status(201).json({ success: true, message: "New product added successfully!", data: product, });

    } catch (error) {
        res.status(500).json({ success: false, message: "error adding product", error: error.message });
    }
};

// Update product //
const updateProduct = async (req, res) => {
    try {
        // Extract product ID from request parameters //
        const { id } = req.params;
        // find product in database //
        const product = await productModel.findById(id);
        // if product not found //
        if (!product) {
            return res.status(404).json({ message: "product not found" });
        }
        // Check permission — only admin or the vendor who owns it can update //
        if (req.user.role !== "admin" && product.vendor.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "You can only update your own products" });
        }
        // update product //
        const updatedProduct = await productModel.findByIdAndUpdate(id, req.body, { new: true })
        res.status(200).json({ success: true, message: "product updated successfully!", data: updatedProduct })

    } catch (error) {
        res.status(500).json({ success: false, message: "error update product ", error: error.message })
    }
};

// delete product //
const deleteProduct = async (req, res) => {
    try {
        // Extract product ID from request parameters //
        const { id } = req.params;
        // find product in database //
        const product = await productModel.findById(id);
        // if product not found //
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Check permission — only admin or the vendor who owns it can delete //
        if (req.user.role !== "admin" && product.vendor.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own products" });
        }
        //delete product //
        await productModel.findByIdAndDelete(id);
        // delete product from vendor list //
        await vendorModel.findByIdAndUpdate(product.vendor, { $pull: { products: product._id } });

        res.status(200).json({ success: true, message: "Product deleted" });

    } catch (error) {
        res.status(500).json({ success: false, message: "error delete product", error: error.message })

    }
}
//  Get All Products (pagination + filtering + sorting) //
const getProducts = async (req, res) => {
    try {
        // --pagination-- //

        //  Get current page and limit (with default values and safe range) //
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        // products to skip //
        const skip = (page - 1) * limit;

        // --filtering-- //

        const filter = {};

        // Filter by category (exact match) //
        if (req.query.category) filter.category = req.query.category;

        // Filter by price range (min and/or max) //
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }

        // Full-text search (on name, description, etc.) //
        if (req.query.q) filter.$text = { $search: req.query.q };

        // --sorting --//

        const sortField = req.query.sort || "createdAt";
        const sortOrder = req.query.order === "desc" ? -1 : 1;

        // Run product search and total count at the same time for efficiency //
        const [products, total] = await Promise.all([
            productModel.find(filter)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limit)
                .populate("vendor", "storeName email"),
            productModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({
            success: true,
            total,          // total products matching the filter
            page,           // current page
            limit,          // products per page
            totalPages,     // total number of pages
            count: products.length, // number of products in this page
            hasNextPage,
            hasPrevPage,
            products,       // actual products data
        })


    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching products", error: error.message, });
    }
};

module.exports = { addProduct, updateProduct, deleteProduct, getProducts };
