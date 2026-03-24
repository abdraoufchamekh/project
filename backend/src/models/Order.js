const pool = require('../config/database');

class Order {
  static async create(orderData, client = pool) {
    const {
      clientName, phone, phone2, address, wilaya, commune,
      deliveryType, stopDeskAgency, isFreeDelivery, hasExchange,
      hasInsurance, declaredValue, status, assignedDesigner,
      firstName, lastName,
      deliveryFee, discount, source, versement
    } = orderData;

    const query = `
      INSERT INTO orders (
        client_name, first_name, last_name, phone, phone2, address, wilaya, commune,
        delivery_type, stop_desk_agency, is_free_delivery, has_exchange,
        has_insurance, declared_value, status, assigned_designer,
        delivery_fee, discount, source, versement, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW())
      RETURNING *
    `;

    const result = await client.query(query, [
      clientName || `${firstName || ''} ${lastName || ''}`.trim(),
      firstName,
      lastName,
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
      status || 'Nouvelle commande',
      assignedDesigner,
      Math.max(0, Number(deliveryFee) || 0),
      Math.max(0, Number(discount) || 0),
      source || 'admin',
      Math.max(0, Number(versement) || 0)
    ]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filters = {}, limit = null, offset = null) {
    let query = `
      SELECT o.*, u.name as designer_name
      FROM orders o
      LEFT JOIN users u ON o.assigned_designer = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND (
        o.client_name ILIKE $${paramIndex} OR 
        o.phone ILIKE $${paramIndex} OR 
        o.first_name ILIKE $${paramIndex} OR 
        o.last_name ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.status) {
      if (filters.status.includes(',')) {
        const statuses = filters.status.split(',');
        query += ` AND o.status = ANY($${paramIndex}::text[])`;
        values.push(statuses);
      } else {
        query += ` AND o.status = $${paramIndex}`;
        values.push(filters.status);
      }
      paramIndex++;
    }

    if (filters.excludeStatus) {
      const excluded = filters.excludeStatus.split(',');
      query += ` AND o.status != ALL($${paramIndex}::text[])`;
      values.push(excluded);
      paramIndex++;
    }

    if (filters.wilaya) {
      query += ` AND TRIM(o.wilaya) ILIKE TRIM($${paramIndex})`;
      values.push(`%${filters.wilaya}%`);
      paramIndex++;
    }

    if (filters.date) {
      query += ` AND DATE(o.created_at) = $${paramIndex}`;
      values.push(filters.date);
      paramIndex++;
    }

    if (filters.source) {
      query += ` AND o.source = $${paramIndex}`;
      values.push(filters.source);
      paramIndex++;
    }

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
    let query = `
      SELECT COUNT(*) as total
      FROM orders o
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND (
        o.client_name ILIKE $${paramIndex} OR 
        o.phone ILIKE $${paramIndex} OR 
        o.first_name ILIKE $${paramIndex} OR 
        o.last_name ILIKE $${paramIndex}
      )`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.status) {
      if (filters.status.includes(',')) {
        const statuses = filters.status.split(',');
        query += ` AND o.status = ANY($${paramIndex}::text[])`;
        values.push(statuses);
      } else {
        query += ` AND o.status = $${paramIndex}`;
        values.push(filters.status);
      }
      paramIndex++;
    }

    if (filters.excludeStatus) {
      const excluded = filters.excludeStatus.split(',');
      query += ` AND o.status != ALL($${paramIndex}::text[])`;
      values.push(excluded);
      paramIndex++;
    }

    if (filters.wilaya) {
      query += ` AND TRIM(o.wilaya) ILIKE TRIM($${paramIndex})`;
      values.push(`%${filters.wilaya}%`);
      paramIndex++;
    }

    if (filters.date) {
      query += ` AND DATE(o.created_at) = $${paramIndex}`;
      values.push(filters.date);
      paramIndex++;
    }

    if (filters.source) {
      query += ` AND o.source = $${paramIndex}`;
      values.push(filters.source);
      paramIndex++;
    }

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
      LEFT JOIN users u ON o.assigned_designer = u.id
      WHERE o.assigned_designer = $1
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