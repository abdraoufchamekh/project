const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.oteeurtqpxrzmdegrgtp:AureaDBAction!26@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const query = `
      WITH filtered_orders AS (
        SELECT o.id
        FROM orders o
        WHERE 1=1
      ),
      total_count AS (
        SELECT COUNT(*) AS total FROM filtered_orders
      ),
      paginated_ids AS (
        SELECT id FROM filtered_orders
        ORDER BY id DESC
        LIMIT 10 OFFSET 0
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

    const result = await pool.query(query, []);
    console.log('Success! Rows returned:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Sample row ID:', result.rows[0].id);
    }
  } catch (err) {
    console.error('Error executing query:');
    console.error(err.message);
  } finally {
    pool.end();
  }
}

run();
