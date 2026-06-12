const Order = require('../models/Order');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Photo = require('../models/Photo');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;
const pool = require('../config/database');
const { getCachedStats, setCachedStats, invalidateStatsCache } = require('../utils/statsCache');
const yalidineService = require('../services/yalidineService');

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
      wilaya_id, commune_id,
      deliveryType, delivery_type, stop_desk_agency,
      isFreeDelivery, hasExchange,
      hasInsurance, declaredValue, products,
      deliveryFee, discount, source, versement, agency_id
    } = req.body;

    // Log to verify fields are received
    console.log('ORDER FIELDS:', {
      wilaya, wilaya_id,
      commune, commune_id,
      deliveryType: deliveryType || delivery_type,
      stop_desk_agency,
      agency_id
    });

    const assignedDesigner = req.body.assignedDesigner !== undefined ? req.body.assignedDesigner : req.body.assigned_designer;
    const finalClientName = clientName || `${firstName || ''} ${lastName || ''}`.trim() || 'Client Anonyme';

    if (!products || products.length === 0) {
      client.release();
      return res.status(400).json({ error: 'At least one product is required' });
    }

    const hasZeroPriceProduct = products.some(p => {
      const rawPrice = p.unitPrice ?? p.unit_price;
      const safeUnitPrice = (rawPrice !== undefined && rawPrice !== null && rawPrice !== '')
        ? Number(rawPrice)
        : 0;
      return safeUnitPrice === 0;
    });

    if (hasZeroPriceProduct) {
      client.release();
      return res.status(400).json({ error: 'Le prix unitaire d\'un produit ne peut pas être 0.' });
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
      wilaya_id: wilaya_id || null,
      commune: commune || null,
      commune_id: commune_id || null,
      stop_desk_agency: stop_desk_agency || req.body.stopDeskAgency || null,
      agency_id: agency_id || null,
      stopDeskAgency: stop_desk_agency || req.body.stopDeskAgency || null,
      deliveryType: deliveryType || delivery_type || 'domicile',
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
        imageUrl: productData.imageUrl,
        articleType: productData.article_type || 'stock',
        inventoryItemId: productData.inventoryItemId || productData.inventory_item_id
      }, client);
      createdProducts.push(product);

      const invId = productData.inventoryItemId || productData.inventory_item_id;
      if (invId) {
        await Stock.updateItemQuantity(invId, -productData.quantity, client);
      }
    }

    await client.query('COMMIT');
    client.release();
    invalidateStatsCache();

    // Trigger Yalidine Sync for Admins
    let yalidineResult = null;
    if (req.user && req.user.role === 'admin') {
      try {
        yalidineResult = await yalidineService.syncOrderAuto(order.id);
      } catch (syncErr) {
        console.error('[Yalidine Sync] Non-blocking error during order creation:', syncErr);
        // Not throwing since order is already committed in database
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        products: createdProducts,
        ...(yalidineResult || {})
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
    let stats = getCachedStats();
    if (!stats) {
      stats = await Order.getStats();
      setCachedStats(stats);
    }

    let scopedStats = { ...stats };
    if (req.user && req.user.role === 'admin') {
      scopedStats = {
        global: stats.admin || {},
        admin: stats.admin || {},
        atelier: {}
      };
    }

    res.set('Cache-Control', 'private, max-age=25');
    res.json(scopedStats);
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

    if (req.user) {
      if (req.user.role === 'admin') {
        filters.source = 'admin';
      } else if (req.user.role === 'designer') {
        if (req.query.source === 'admin') {
          filters.source = 'admin';
        } else {
          filters.source = 'atelier';
        }
      }
    }

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

    if (req.user && req.user.role === 'admin' && order.source === 'atelier') {
      return res.status(403).json({ error: 'Access denied. Admins cannot view atelier orders.' });
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
  const client = await pool.connect();
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
      client.release();
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permission - now admin and designers can update
    if (req.user.role !== 'admin' && req.user.role !== 'designer') {
      client.release();
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (req.user.role === 'admin' && order.source === 'atelier') {
      client.release();
      return res.status(403).json({ error: 'Access denied. Admins cannot update atelier orders.' });
    }

    await client.query('BEGIN');

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
    }, client);

    // Process products if present in request body
    if (req.body.products && Array.isArray(req.body.products)) {
      if (req.user.role !== 'admin' && req.user.role !== 'designer') {
        await client.query('ROLLBACK');
        client.release();
        return res.status(403).json({ error: 'Seul l\'administrateur ou l\'atelier peut modifier les produits de la commande.' });
      }

      const oldProducts = await Product.findByOrderId(id);
      const newProducts = req.body.products;

      // Identify removed products and delete them, returning stock
      const newProductIds = newProducts.map(p => Number(p.id)).filter(Boolean);
      const removedProducts = oldProducts.filter(op => !newProductIds.includes(Number(op.id)));

      for (const op of removedProducts) {
        if (op.article_type === 'stock' && op.inventory_item_id) {
          await Stock.updateItemQuantity(op.inventory_item_id, op.quantity, client);
        }
        await Product.delete(op.id, client);
      }

      // Process new and existing products
      for (const p of newProducts) {
        const safeQuantity = p.quantity != null ? Number(p.quantity) : 1;
        const rawPrice = p.unitPrice ?? p.unit_price;
        const safeUnitPrice = (rawPrice !== undefined && rawPrice !== null && rawPrice !== '')
          ? Number(rawPrice)
          : 0;
        const invId = p.inventoryItemId || p.inventory_item_id || null;

        if (!p.id) {
          // Fetch product stock image if available
          let imageUrl = p.imageUrl || p.image_url || null;
          if (invId) {
            const item = await Stock.getItemById(invId, client);
            if (item) {
              imageUrl = item.image_url;
            }
          }

          // New product
          await Product.create({
            orderId: id,
            type: p.type,
            quantity: safeQuantity,
            unitPrice: safeUnitPrice,
            status: p.status || 'En attente',
            imageUrl: imageUrl,
            articleType: p.article_type || 'stock',
            inventoryItemId: invId
          }, client);

          // Deduct stock if applicable
          if ((p.article_type || 'stock') === 'stock' && invId) {
            await Stock.updateItemQuantity(invId, -safeQuantity, client);
          }
        } else {
          // Existing product
          const oldP = oldProducts.find(op => Number(op.id) === Number(p.id));
          if (oldP) {
            // Handle stock logic if inventory item or quantity changed, or if article type changed
            const oldInvId = oldP.inventory_item_id;
            const newInvId = invId;
            const oldIsStock = oldP.article_type === 'stock' && oldInvId;
            const newIsStock = (p.article_type || oldP.article_type) === 'stock' && newInvId;

            if (oldIsStock && newIsStock && Number(oldInvId) === Number(newInvId)) {
              // Same inventory item, adjust difference
              const qtyDiff = oldP.quantity - safeQuantity;
              if (qtyDiff !== 0) {
                await Stock.updateItemQuantity(oldInvId, qtyDiff, client);
              }
            } else {
              // Different inventory items, or changed stock type
              if (oldIsStock) {
                // Return old quantity to old stock
                await Stock.updateItemQuantity(oldInvId, oldP.quantity, client);
              }
              if (newIsStock) {
                // Deduct new quantity from new stock
                await Stock.updateItemQuantity(newInvId, -safeQuantity, client);
              }
            }

            // Fetch current imageUrl (ensure it doesn't get wiped if not provided)
            let imageUrl = p.imageUrl || p.image_url || oldP.image_url || null;
            // If stock item changed, update image to new stock item image
            if (newIsStock && Number(oldInvId) !== Number(newInvId)) {
              const item = await Stock.getItemById(newInvId, client);
              if (item) {
                imageUrl = item.image_url;
              }
            }

            await Product.update(p.id, {
              type: p.type || oldP.type,
              quantity: safeQuantity,
              unitPrice: safeUnitPrice,
              status: p.status || oldP.status,
              articleType: p.article_type || oldP.article_type,
              inventoryItemId: invId,
              imageUrl: imageUrl
            }, client);
          }
        }
      }
    }

    await client.query('COMMIT');
    client.release();
    invalidateStatsCache();

    // Fetch full updated order with updated products and photos
    const finalOrder = await Order.findById(id);
    const finalProducts = await Product.findByOrderId(id);
    const finalPhotos = await Photo.findByOrderId(id);

    res.json({
      message: 'Order updated successfully',
      order: {
        ...finalOrder,
        products: finalProducts || [],
        photos: finalPhotos || []
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
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

    if (req.user && req.user.role === 'admin' && order.source === 'atelier') {
      return res.status(403).json({ error: 'Access denied. Admins cannot delete atelier orders.' });
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

    // Delete existing old image from Cloudinary/local
    if (product.image_url) {
      try {
        if (product.image_url.startsWith('http')) {
          const parts = product.image_url.split('/');
          const fileWithExt = parts[parts.length - 1];
          const publicId = `aurea-deco-uploads/${fileWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } else {
          await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', product.image_url));
        }
      } catch (err) {
        console.error('Error deleting old product image:', err);
      }
    }

    const updatedProduct = await Product.updateImage(productId, imageUrl);
    res.json({ message: 'Product image updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({ error: 'Server error updating product image' });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.image_url) {
      try {
        if (product.image_url.startsWith('http')) {
          const parts = product.image_url.split('/');
          const fileWithExt = parts[parts.length - 1];
          const publicId = `aurea-deco-uploads/${fileWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } else {
          await fs.unlink(path.join(process.env.UPLOAD_PATH || './uploads', product.image_url));
        }
      } catch (err) {
        console.error('Error deleting product image file:', err);
      }
    }

    const updatedProduct = await Product.updateImage(productId, null);
    res.json({ message: 'Product image deleted successfully', product: updatedProduct });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({ error: 'Server error deleting product image' });
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

    if (req.user && req.user.role === 'admin' && order.source === 'atelier') {
      return res.status(403).json({ error: 'Access denied to atelier orders.' });
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

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const imageUrl = req.file.path || req.file.filename;
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Server error uploading image' });
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

exports.replacePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // First retrieve the existing photo
    const query = 'SELECT * FROM photos WHERE id = $1';
    const result = await pool.query(query, [photoId]);
    const photo = result.rows[0];

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete existing old photo
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
      console.error('Error deleting old photo:', err);
    }

    const newFilename = req.file.path || req.file.filename;

    const updatedPhoto = await Photo.updateFilename(photoId, newFilename);
    res.json({ message: 'Photo replaced successfully', photo: updatedPhoto });
  } catch (error) {
    console.error('Replace photo error:', error);
    res.status(500).json({ error: 'Server error replacing photo' });
  }
};

exports.syncYalidine = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.rows[0];
    if (order.source === 'atelier') {
      return res.status(403).json({ error: 'Access denied. Admin cannot sync atelier orders with Yalidine.' });
    }

    const syncResult = await yalidineService.syncOrderAuto(id);

    // Return FULL updated order - not just tracking fields
    const updatedOrder = await Order.findById(Number(id));
    const products = await Product.findByOrderId(Number(id));
    const photos = await Photo.findByOrderId(Number(id));

    res.json({
      message: 'Yalidine sync complete',
      order: {
        ...updatedOrder,
        products: products || [],
        photos: photos || []
      },
      yalidineResult: syncResult
    });
  } catch (error) {
    console.error('Manual Yalidine sync error:', error);
    res.status(500).json({ error: 'Server error during manual synchronization' });
  }
};