const pool = require('../config/database');

class Product {
  static async create(productData, client = pool) {
    const { orderId, type, quantity, unitPrice, status, imageUrl, articleType } = productData;

    // Ensure unitPrice is always a valid number for the NOT NULL numeric column
    const safeUnitPrice = unitPrice !== undefined && unitPrice !== null && unitPrice !== ''
      ? Number(unitPrice)
      : 0;

    const query = `
      INSERT INTO products (order_id, type, quantity, unit_price, status, image_url, article_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const result = await client.query(query, [
      orderId,
      type,
      quantity || 1,
      safeUnitPrice,
      status || 'En attente',
      imageUrl || null,
      articleType || 'stock'
    ]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM products WHERE order_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async findByOrderIds(orderIds) {
    if (!orderIds || orderIds.length === 0) return [];
    const query = 'SELECT * FROM products WHERE order_id = ANY($1::int[]) ORDER BY created_at ASC';
    const result = await pool.query(query, [orderIds]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE products 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async update(id, productData) {
    const { type, quantity, unitPrice, status, articleType } = productData;

    const query = `
      UPDATE products 
      SET type = $1, quantity = $2, unit_price = $3, status = $4, article_type = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(query, [type, quantity, unitPrice, status, articleType || 'stock', id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async updateImage(id, imageUrl) {
    const query = `
      UPDATE products 
      SET image_url = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [imageUrl, id]);
    return result.rows[0];
  }
}

module.exports = Product;