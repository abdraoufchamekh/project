const pool = require('../config/database');

class Order {
  static async create(orderData, client = pool) {
    const {
      clientName, phone, phone2, address, wilaya, commune, wilaya_id, commune_id,
      deliveryType, stopDeskAgency, isFreeDelivery, hasExchange,
      hasInsurance, declaredValue, status, assignedDesigner,
      firstName, lastName,
      deliveryFee, discount, source, versement, agency_id
    } = orderData;

    const query = `
      INSERT INTO orders (
        client_name, first_name, last_name, phone, phone2, address, wilaya, wilaya_id, commune, commune_id,
        delivery_type, stop_desk_agency, agency_id,
        delivery_fee, discount, versement, is_free_delivery,
        has_exchange, has_insurance, declared_value, source, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
      RETURNING *
    `;

    const result = await client.query(query, [
      clientName || `${firstName || ''} ${lastName || ''}`.trim(),
      firstName || null,
      lastName || null,
      phone,
      phone2 || null,
      address || null,
      wilaya || null,
      wilaya_id ? parseInt(wilaya_id, 10) : null,
      commune || null,
      commune_id ? parseInt(commune_id, 10) : null,
      deliveryType || 'domicile',
      stopDeskAgency || null,
      orderData.agency_id ? parseInt(orderData.agency_id, 10) : null,
      Math.max(0, Number(deliveryFee) || 0),
      Math.max(0, Number(discount) || 0),
      Math.max(0, Number(versement) || 0),
      isFreeDelivery || false,
      hasExchange || false,
      hasInsurance || false,
      declaredValue ? parseFloat(declaredValue) : null,
      source || 'admin',
      status || 'Nouvelle commande'
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Shared WHERE fragment for orders list filters (alias o).
   * @returns {{ sql: string, values: unknown[], nextParam: number }}
   */
  static _pushOrderFilters(filters, values, paramIndex) {
    let sql = '';
    let i = paramIndex;

    if (filters.search) {
      sql += ` AND (
        o.client_name ILIKE $${i} OR
        o.phone ILIKE $${i} OR
        o.first_name ILIKE $${i} OR
        o.last_name ILIKE $${i}
      )`;
      values.push(`%${filters.search}%`);
      i++;
    }

    if (filters.status) {
      if (filters.status.includes(',')) {
        const statuses = filters.status.split(',');
        sql += ` AND o.status = ANY($${i}::text[])`;
        values.push(statuses);
      } else {
        sql += ` AND o.status = $${i}`;
        values.push(filters.status);
      }
      i++;
    }

    if (filters.excludeStatus) {
      const excluded = filters.excludeStatus.split(',');
      sql += ` AND o.status != ALL($${i}::text[])`;
      values.push(excluded);
      i++;
    }

    if (filters.wilaya) {
      sql += ` AND TRIM(o.wilaya) ILIKE TRIM($${i})`;
      values.push(`%${filters.wilaya}%`);
      i++;
    }

    if (filters.date) {
      sql += ` AND DATE(o.created_at) = $${i}`;
      values.push(filters.date);
      i++;
    }

    if (filters.source) {
      sql += ` AND o.source = $${i}`;
      values.push(filters.source);
      i++;
    }

    return { sql, values, nextParam: i };
  }

  /**
   * One round-trip: page of orders + total count + product/photo counts (no N+1, minimal payload vs loading all rows).
   */
  static async getSummaryPage(filters = {}, limit = 50, offset = 0) {
    const values = [];
    const { sql: filterSql, nextParam } = Order._pushOrderFilters(filters, values, 1);

    const query = `
      WITH filtered_orders AS (
        SELECT o.id
        FROM orders o
        WHERE 1=1
        ${filterSql}
      ),
      total_count AS (
        SELECT COUNT(*) AS total FROM filtered_orders
      ),
      paginated_ids AS (
        SELECT id FROM filtered_orders
        ORDER BY id DESC
        LIMIT $${nextParam} OFFSET $${nextParam + 1}
      )
      SELECT
        o.*,
        u.name AS designer_name,
        (SELECT total FROM total_count) AS __total,
        (SELECT COUNT(*)::int FROM products p WHERE p.order_id = o.id) AS product_count,
        (SELECT COALESCE(SUM(p.quantity * p.unit_price), 0) FROM products p WHERE p.order_id = o.id) AS products_subtotal,
        (SELECT COUNT(*)::int FROM photos ph WHERE ph.order_id = o.id AND ph.type = 'client') AS client_photos_count,
        (SELECT COUNT(*)::int FROM photos ph WHERE ph.order_id = o.id AND ph.type = 'designer') AS designer_photos_count
      FROM orders o
      INNER JOIN paginated_ids pid ON o.id = pid.id
      LEFT JOIN users u ON o.assigned_designer::text = u.id::text
      ORDER BY o.id DESC
    `;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getAll(filters = {}, limit = null, offset = null) {
    const values = [];
    const { sql: filterSql, nextParam } = Order._pushOrderFilters(filters, values, 1);
    let query = `
      SELECT o.*, u.name as designer_name
      FROM orders o
      LEFT JOIN users u ON o.assigned_designer::text = u.id::text
      WHERE 1=1
      ${filterSql}
    `;
    let paramIndex = nextParam;

    query += ` ORDER BY o.id DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
    if (offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(offset);
      paramIndex++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async countAll(filters = {}) {
    const values = [];
    const { sql: filterSql } = Order._pushOrderFilters(filters, values, 1);
    const query = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE 1=1
      ${filterSql}
    `;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  }

  static async getStats() {
    const query = `
      SELECT status, source, COUNT(*) as count 
      FROM orders 
      GROUP BY status, source
    `;
    const result = await pool.query(query);
    
    const stats = {
      global: {},
      admin: {},
      atelier: {}
    };
    
    result.rows.forEach(row => {
      const st = row.status || 'Nouvelle commande';
      const count = parseInt(row.count, 10);
      const src = row.source || 'admin';
      
      stats.global[st] = (stats.global[st] || 0) + count;
      if (src === 'admin') stats.admin[st] = (stats.admin[st] || 0) + count;
      if (src === 'atelier') stats.atelier[st] = (stats.atelier[st] || 0) + count;
    });
    
    return stats;
  }

  static async getByDesigner(designerId) {
    const query = `
      SELECT o.*, u.name as designer_name
      FROM orders o
      LEFT JOIN users u ON o.assigned_designer::text = u.id::text
      WHERE o.assigned_designer::text = $1::text
      ORDER BY o.id DESC
    `;
    const result = await pool.query(query, [designerId]);
    return result.rows;
  }

  static async update(id, orderData) {
    const {
      clientName, phone, phone2, address, wilaya, commune,
      deliveryType, stopDeskAgency, isFreeDelivery, hasExchange,
      hasInsurance, declaredValue, status, assignedDesigner,
      firstName, lastName,
      deliveryFee, discount, source, versement
    } = orderData;

    const query = `
      UPDATE orders 
      SET 
        client_name = $1, first_name = $2, last_name = $3, phone = $4, phone2 = $5,
        address = $6, wilaya = $7, commune = $8, delivery_type = $9, stop_desk_agency = $10,
        is_free_delivery = $11, has_exchange = $12, has_insurance = $13, declared_value = $14,
        status = $15, assigned_designer = $16, delivery_fee = $17, discount = $18, source = $19, versement = $20, updated_at = NOW()
      WHERE id = $21
      RETURNING *
    `;

    const result = await pool.query(query, [
      clientName || `${firstName || ''} ${lastName || ''}`.trim(),
      firstName || null,
      lastName || null,
      phone,
      phone2 || null,
      address || null,
      wilaya || null,
      commune || null,
      deliveryType || 'domicile',
      stopDeskAgency || null,
      isFreeDelivery || false,
      hasExchange || false,
      hasInsurance || false,
      declaredValue ? parseFloat(declaredValue) : null,
      status,
      assignedDesigner,
      Math.max(0, Number(deliveryFee) || 0),
      Math.max(0, Number(discount) || 0),
      source !== undefined ? source : 'admin',
      versement !== undefined ? (Number(versement) || 0) : 0,
      id
    ]);
    return result.rows[0];
  }

  static async delete(id) {
    // First delete all related products and images (CASCADE should handle this)
    const query = 'DELETE FROM orders WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Order;