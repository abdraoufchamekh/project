const pool = require('../config/database');

class Image {
  static async create(imageData) {
    const { productId, filename, type, uploadedBy } = imageData;

    const query = `
      INSERT INTO images (product_id, filename, type, uploaded_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const result = await pool.query(query, [productId, filename, type, uploadedBy]);
    return result.rows[0];
  }

  static async findByProductId(productId) {
    const query = 'SELECT * FROM images WHERE product_id = $1 ORDER BY created_at ASC';
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  static async findByType(productId, type) {
    const query = 'SELECT * FROM images WHERE product_id = $1 AND type = $2 ORDER BY created_at ASC';
    const result = await pool.query(query, [productId, type]);
    return result.rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM images WHERE id = $1 RETURNING filename';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByFilename(filename) {
    const query = 'DELETE FROM images WHERE filename = $1';
    await pool.query(query, [filename]);
  }
}

module.exports = Image;