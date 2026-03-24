const pool = require('../config/database');

class Stock {
  static async getAllItems() {
    const query = `
      SELECT *
      FROM inventory_items
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async createItem(itemData) {
    const { name, color, dimension, size, quantity, imageUrl, price } = itemData;
    const query = `
      INSERT INTO inventory_items (name, color, dimension, size, quantity, image_url, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      color || null,
      dimension || null,
      size || null,
      quantity || 0,
      imageUrl || null,
      price != null ? Number(price) : null
    ]);
    return result.rows[0];
  }

  static async updateItem(id, itemData) {
    const { name, color, dimension, size, quantity, imageUrl, price } = itemData;
    let query, values;

    if (imageUrl !== undefined) {
      query = `
        UPDATE inventory_items
        SET name = $1, color = $2, dimension = $3, size = $4, quantity = $5, image_url = $6, price = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      values = [name, color || null, dimension || null, size || null, quantity, imageUrl, price != null ? Number(price) : null, id];
    } else {
      query = `
        UPDATE inventory_items
        SET name = $1, color = $2, dimension = $3, size = $4, quantity = $5, price = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `;
      values = [name, color || null, dimension || null, size || null, quantity, price != null ? Number(price) : null, id];
    }
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateItemQuantity(id, quantityDiff, client = pool) {
    const query = `
      UPDATE inventory_items
      SET quantity = quantity + $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await client.query(query, [quantityDiff, id]);
    return result.rows[0];
  }

  static async deleteItem(id) {
    const query = 'DELETE FROM inventory_items WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async getItemById(id, client = pool) {
     const query = 'SELECT * FROM inventory_items WHERE id = $1';
     const result = await client.query(query, [id]);
     return result.rows[0];
  }
}

module.exports = Stock;
