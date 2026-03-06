const Order = require('../models/Order');
const Product = require('../models/Product');
const Image = require('../models/Image');
const fs = require('fs').promises;
const path = require('path');

exports.createOrder = async (req, res) => {
  try {
    const { clientName, phone, address, assignedDesigner, products } = req.body;

    // Validation
    if (!clientName || !phone) {
      return res.status(400).json({ error: 'Client name and phone are required' });
    }

    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    // Create order
    const order = await Order.create({
      clientName,
      phone,
      address: address || null,
      assignedDesigner: assignedDesigner || null
    });

    // Create products for this order
    const createdProducts = [];
    for (const productData of products) {
      const product = await Product.create({
        orderId: order.id,
        type: productData.type,
        quantity: productData.quantity,
        unitPrice: productData.unitPrice,
        status: 'En attente'
      });
      createdProducts.push(product);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        products: createdProducts
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error while creating order' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { role, id } = req.user;

    let orders;
    if (role === 'admin') {
      orders = await Order.getAll();
    } else {
      orders = await Order.getByDesigner(id);
    }

    // Get products for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const products = await Product.findByOrderId(order.id);
        
        // Get images for each product
        const productsWithImages = await Promise.all(
          products.map(async (product) => {
            const images = await Image.findByProductId(product.id);
            const clientImages = images.filter(img => img.type === 'client');
            const designerImages = images.filter(img => img.type === 'designer');
            
            return { 
              ...product, 
              clientImages: clientImages.length,
              designerImages: designerImages.length,
              images 
            };
          })
        );

        return { ...order, products: productsWithImages };
      })
    );

    res.json({ orders: ordersWithProducts });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error while fetching orders' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && order.assigned_designer !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get products
    const products = await Product.findByOrderId(order.id);

    // Get images for each product
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await Image.findByProductId(product.id);
        return { ...product, images };
      })
    );

    res.json({
      order: {
        ...order,
        products: productsWithImages
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientName, phone, address, assignedDesigner } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission (admin only for now)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const updatedOrder = await Order.update(id, {
      clientName,
      phone,
      address,
      assignedDesigner
    });

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission (admin only)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get all products to delete their images
    const products = await Product.findByOrderId(id);
    for (const product of products) {
      const images = await Image.findByProductId(product.id);
      for (const image of images) {
        try {
          await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', image.filename));
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    await Order.delete(id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = await Product.updateStatus(productId, status);
    res.json({ message: 'Product status updated', product: updatedProduct });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type } = req.body; // 'client' or 'designer'

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!type || !['client', 'designer'].includes(type)) {
      return res.status(400).json({ error: 'Invalid image type. Must be "client" or "designer"' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Save image records
    const images = [];
    for (const file of req.files) {
      const image = await Image.create({
        productId,
        filename: file.filename,
        type,
        uploadedBy: req.user.id
      });
      images.push(image);
    }

    res.json({ message: 'Images uploaded successfully', images });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.delete(imageId);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete physical file
    try {
      await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', image.filename));
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};