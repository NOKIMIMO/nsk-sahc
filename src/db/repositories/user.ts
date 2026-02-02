import pool from '../pg';

async function getUserRole(userId: number) {
  const query = 'SELECT id, role FROM users WHERE id = $1 LIMIT 1';
  const values = [userId];
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}