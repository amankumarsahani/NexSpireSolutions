const { pool } = require('../config/database');

class CmsMenuModel {
    /**
     * Get menu by name
     * @param {string} name - Menu name (e.g., 'header', 'footer')
     */
    static async findByName(name) {
        const [rows] = await pool.query('SELECT * FROM cms_menus WHERE name = ?', [name]);
        return rows[0];
    }

    /**
     * Create new menu
     */
    static async create(name, items = []) {
        const [result] = await pool.query(
            'INSERT INTO cms_menus (name, items) VALUES (?, ?)',
            [name, JSON.stringify(items)]
        );
        return result.insertId;
    }

    /**
     * Update menu items
     */
    static async update(name, items) {
        const [result] = await pool.query(
            'UPDATE cms_menus SET items = ? WHERE name = ?',
            [JSON.stringify(items), name]
        );
        return result.affectedRows > 0;
    }

    /**
     * Get all menus (optional, for listing)
     */
    static async findAll() {
        const [rows] = await pool.query('SELECT * FROM cms_menus');
        return rows;
    }
}

module.exports = CmsMenuModel;
