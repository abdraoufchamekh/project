const pool = require('../config/database');

class Order {
  static async create(orderData) {
    const { clientName, phone, address, assignedDesigner } = orderData;

    const query = `
      INSERT INTO orders (client_name, phone, address, assigned_designer, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [clientName, phone, address, assignedDesigner]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll() {
    const query = `
      SELECT o.*, u.name as designer_name
      FROM orders o
      LEFT JOIN users u ON o.assigned_designer = u.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getByDesigner(designerId) {
    const query = `
      SELECT o.*, u.name as designer_name
      FROM orders o
      LEFT JOIN users u ON o.assigned_designer = u.id
      WHERE o.assigned_designer = $1
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query, [designerId]);
    return result.rows;
  }

  static async update(id, orderData) {
    const { clientName, phone, address, assignedDesigner } = orderData;

    const query = `
      UPDATE orders 
      SET client_name = $1, phone = $2, address = $3, assigned_designer = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [clientName, phone, address, assignedDesigner, id]);
    return result.rows[0];
  }

  static async delete(id) {
    // First delete all related products and images (CASCADE should handle this)
    const query = 'DELETE FROM orders WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Order;