const pool = require('../config/database');

class Notification {
  static async getActiveNotifications() {
    const query = `
      SELECT n.*, i.name as product_name, i.color, i.dimension, i.size
      FROM notifications n
      JOIN inventory_items i ON n.inventory_item_id = i.id
      WHERE n.is_resolved = FALSE
      ORDER BY n.updated_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async createOrUpdate(inventoryItemId, deficit, client = pool) {
    const updateQuery = `
      UPDATE notifications
      SET deficit = $2, is_resolved = FALSE, updated_at = NOW()
      WHERE inventory_item_id = $1
        AND is_resolved = FALSE
      RETURNING *
    `;

    const updated = await client.query(updateQuery, [inventoryItemId, deficit]);
    if (updated.rows[0]) {
      return updated.rows[0];
    }

    const insertQuery = `
      INSERT INTO notifications (inventory_item_id, deficit, is_resolved, created_at, updated_at)
      VALUES ($1, $2, FALSE, NOW(), NOW())
      RETURNING *
    `;

    const inserted = await client.query(insertQuery, [inventoryItemId, deficit]);
    return inserted.rows[0];
  }

  static async resolve(inventoryItemId, client = pool) {
    const query = `
      UPDATE notifications
      SET is_resolved = TRUE, updated_at = NOW()
      WHERE inventory_item_id = $1 AND is_resolved = FALSE
      RETURNING *
    `;
    const result = await client.query(query, [inventoryItemId]);
    return result.rows[0];
  }
}

module.exports = Notification;
