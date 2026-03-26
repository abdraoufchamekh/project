const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Photo = require('../models/Photo');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const pool = require('../config/database');
const { getCachedStats, setCachedStats, invalidateStatsCache } = require('../utils/statsCache');

function mapSummaryOrderRow(row) {
  const {
    __total,
    product_count,
    products_subtotal,
    client_photos_count,
    designer_photos_count,
    ...rest
  } = row;
  return {
    ...rest,
    products: [],
    photos: [],
    product_count,
    products_subtotal: Number(products_subtotal) || 0,
    clientPhotosCount: client_photos_count,
    designerPhotosCount: designer_photos_count
  };
}

// Configure Cloudinary (it will use the env vars implicitly if not configured here, but it's safe to require it)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      clientName, firstName, lastName, phone, phone2, address, wilaya, commune,
      deliveryType, stopDeskAgency, isFreeDelivery, hasExchange,
      hasInsurance, declaredValue, products,
      deliveryFee, discount, source, versement
    } = req.body;

    const assignedDesigner = req.body.assignedDesigner !== undefined ? req.body.assignedDesigner : req.body.assigned_designer;
    const finalClientName = clientName || `${firstName || ''} ${lastName || ''}`.trim() || 'Client Anonyme';

    if (!products || products.length === 0) {
      client.release();
      return res.status(400).json({ error: 'At least one product is required' });
    }

    await client.query('BEGIN');

    for (const productData of products) {
      if (productData.inventoryItemId) {
        const item = await Stock.getItemById(productData.inventoryItemId, client);
        if (!item) {
           await client.query('ROLLBACK');
           client.release();
           return res.status(404).json({ error: `Article de stock introuvable pour ${productData.type}` });
        }
        if (item) {
          productData.imageUrl = item.image_url;
        }
      }
    }

    const freeDelivery = isFreeDelivery === true || isFreeDelivery === 'true';
    const rawDeliveryFee = req.body.deliveryFee ?? req.body.delivery_fee ?? 0;
    const orderDeliveryFee = freeDelivery ? 0 : (Number(rawDeliveryFee) || 0);
    const orderDiscount = Math.max(0, Number(req.body.discount ?? 0) || 0);

    const order = await Order.create({
      clientName: finalClientName,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      phone2: phone2 || null,
      address: address || null,
      wilaya: wilaya || null,
      commune: commune || null,
      deliveryType: deliveryType || 'domicile',
      stopDeskAgency: stopDeskAgency || null,
      isFreeDelivery: freeDelivery,
      hasExchange: hasExchange || false,
      hasInsurance: hasInsurance || false,
      declaredValue: declaredValue || null,
      assignedDesigner: assignedDesigner || null,
      deliveryFee: orderDeliveryFee,
      discount: orderDiscount,
      source: source || 'admin',
      versement: Math.max(0, Number(versement) || 0)
    }, client);

    const createdProducts = [];
    for (const productData of products) {
      const safeQuantity = productData.quantity != null ? Number(productData.quantity) : 1;
      const rawPrice = productData.unitPrice ?? productData.unit_price;
      const safeUnitPrice = (rawPrice !== undefined && rawPrice !== null && rawPrice !== '')
        ? Number(rawPrice)
        : 0;

      const product = await Product.create({
        orderId: order.id,
        type: productData.type,
        quantity: safeQuantity,
        unitPrice: safeUnitPrice,
        status: 'En attente',
        imageUrl: productData.imageUrl
      }, client);
      createdProducts.push(product);

      if (productData.inventoryItemId) {
        await Stock.updateItemQuantity(productData.inventoryItemId, -productData.quantity, client);
      }
    }

    await client.query('COMMIT');
    client.release();
    invalidateStatsCache();

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        products: createdProducts
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error while creating order' });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const cached = getCachedStats();
    if (cached) {
      res.set('Cache-Control', 'private, max-age=25');
      return res.json(cached);
    }
    const stats = await Order.getStats();
    setCachedStats(stats);
    res.set('Cache-Control', 'private, max-age=25');
    res.json(stats);
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Server error while fetching stats' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      excludeStatus: req.query.excludeStatus,
      wilaya: req.query.wilaya,
      date: req.query.date,
      source: req.query.source
    };

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = (page - 1) * limit;

    const rows = await Order.getSummaryPage(filters, limit, offset);

    if (rows.length === 0) {
      res.set('Cache-Control', 'private, max-age=5');
      return res.json({ orders: [], totalOrders: 0, totalPages: 0, currentPage: page });
    }

    const totalOrders = parseInt(rows[0].__total, 10);
    const ordersWithDetails = rows.map(mapSummaryOrderRow);

    res.set('Cache-Control', 'private, max-age=5');
    res.json({
      orders: ordersWithDetails,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    });
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

    // Get products and photos
    const products = await Product.findByOrderId(order.id);
    const photos = await Photo.findByOrderId(order.id);

    res.json({
      order: {
        ...order,
        products,
        photos
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
    const clientName = req.body.clientName || req.body.client_name;
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;
    const phone = req.body.phone;
    const phone2 = req.body.phone2;
    const address = req.body.address;
    const wilaya = req.body.wilaya;
    const commune = req.body.commune;
    const deliveryType = req.body.deliveryType || req.body.delivery_type;
    const stopDeskAgency = req.body.stopDeskAgency || req.body.stop_desk_agency;
    const isFreeDelivery = req.body.isFreeDelivery !== undefined ? req.body.isFreeDelivery : req.body.is_free_delivery;
    const hasExchange = req.body.hasExchange !== undefined ? req.body.hasExchange : req.body.has_exchange;
    const hasInsurance = req.body.hasInsurance !== undefined ? req.body.hasInsurance : req.body.has_insurance;
    const declaredValue = req.body.declaredValue || req.body.declared_value;

    const assignedDesigner = req.body.assignedDesigner !== undefined ? req.body.assignedDesigner : req.body.assigned_designer;
    const status = req.body.status;
    const deliveryFee = req.body.deliveryFee !== undefined ? req.body.deliveryFee : req.body.delivery_fee;
    const discount = req.body.discount;
    const source = req.body.source;
    const versement = req.body.versement;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission - now admin and designers can update
    if (req.user.role !== 'admin' && req.user.role !== 'designer') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatedOrder = await Order.update(id, {
      clientName: clientName || order.client_name,
      firstName: firstName !== undefined ? firstName : order.first_name,
      lastName: lastName !== undefined ? lastName : order.last_name,
      phone: phone || order.phone,
      phone2: phone2 !== undefined ? phone2 : order.phone2,
      address: address !== undefined ? address : order.address,
      wilaya: wilaya !== undefined ? wilaya : order.wilaya,
      commune: commune !== undefined ? commune : order.commune,
      deliveryType: deliveryType !== undefined ? deliveryType : order.delivery_type,
      stopDeskAgency: stopDeskAgency !== undefined ? stopDeskAgency : order.stop_desk_agency,
      isFreeDelivery: isFreeDelivery !== undefined ? isFreeDelivery : order.is_free_delivery,
      hasExchange: hasExchange !== undefined ? hasExchange : order.has_exchange,
      hasInsurance: hasInsurance !== undefined ? hasInsurance : order.has_insurance,
      declaredValue: declaredValue !== undefined ? declaredValue : order.declared_value,
      status: status || order.status,
      assignedDesigner: assignedDesigner !== undefined ? assignedDesigner : order.assigned_designer,
      deliveryFee: deliveryFee !== undefined ? (Number(deliveryFee) || 0) : order.delivery_fee,
      discount: discount !== undefined ? (Number(discount) || 0) : order.discount,
      source: source !== undefined ? source : order.source,
      versement: versement !== undefined ? versement : order.versement
    });

    invalidateStatsCache();
    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission (admin or designer)
    if (req.user.role !== 'admin' && req.user.role !== 'designer') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get all photos to delete their physical files
    const photos = await Photo.findByOrderId(id);
    for (const photo of photos) {
      try {
        if (photo.filename && photo.filename.startsWith('http')) {
          const parts = photo.filename.split('/');
          const fileWithExt = parts[parts.length - 1];
          const publicId = `aurea-deco-uploads/${fileWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } else {
          await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', photo.filename));
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    await Order.delete(id);
    invalidateStatsCache();
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

exports.updateProductImage = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = req.file.path || req.file.filename;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = await Product.updateImage(productId, imageUrl);
    res.json({ message: 'Product image updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({ error: 'Server error updating product image' });
  }
};

exports.uploadPhotos = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { type } = req.body; // 'client' or 'designer'

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (!type || !['client', 'designer'].includes(type)) {
      return res.status(400).json({ error: 'Invalid photo type. Must be "client" or "designer"' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Save photo records
    const photos = [];
    for (const file of req.files) {
      const photo = await Photo.create({
        orderId,
        filename: file.path || file.filename,
        type,
        uploadedBy: req.user.id
      });
      photos.push(photo);
    }

    res.json({ message: 'Photos uploaded successfully', photos });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.delete(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete physical file
    try {
      if (photo.filename && photo.filename.startsWith('http')) {
        const parts = photo.filename.split('/');
        const fileWithExt = parts[parts.length - 1];
        const publicId = `aurea-deco-uploads/${fileWithExt.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } else {
        await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', photo.filename));
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};