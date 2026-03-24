const pool = require('../config/database');

class Photo {
  static async create(photoData) {
    const { orderId, filename, type, uploadedBy } = photoData;

    const query = `
      INSERT INTO photos (order_id, filename, type, uploaded_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [orderId, filename, type || 'client', uploadedBy]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM photos WHERE order_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [orderId]);
    return result.rows;
  }

  static async findByOrderIds(orderIds) {
    if (!orderIds || orderIds.length === 0) return [];
    const query = 'SELECT * FROM photos WHERE order_id = ANY($1::int[]) ORDER BY created_at ASC';
    const result = await pool.query(query, [orderIds]);
    return result.rows;
  }

  static async findByType(orderId, type) {
    const query = 'SELECT * FROM photos WHERE order_id = $1 AND type = $2 ORDER BY created_at ASC';
    const result = await pool.query(query, [orderId, type]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM photos WHERE id = $1 RETURNING filename';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByFilename(filename) {
    const query = 'DELETE FROM photos WHERE filename = $1';
    await pool.query(query, [filename]);
  }
}

module.exports = Photo;
