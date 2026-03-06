const pool = require('../config/database');

class Product {
  static async create(productData) {
    const { orderId, type, quantity, unitPrice, status } = productData;

    const query = `
      INSERT INTO products (order_id, type, quantity, unit_price, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [orderId, type, quantity, unitPrice, status || 'En attente']);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM products WHERE order_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [orderId]);
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
    const { type, quantity, unitPrice, status } = productData;

    const query = `
      UPDATE products 
      SET type = $1, quantity = $2, unit_price = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [type, quantity, unitPrice, status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Product;