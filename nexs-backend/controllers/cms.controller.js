const CmsMenuModel = require('../models/cms-menu.model');
const crypto = require('crypto');

// Helper for ID generation
const generateId = () => {
    return crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

class CmsController {
    /**
     * Get menu by mode (header/footer)
     */
    static async getMenu(req, res) {
        try {
            const { mode } = req.params;
            const menu = await CmsMenuModel.findByName(mode);

            if (!menu) {
                // Return empty default if not found
                return res.json({
                    success: true,
                    data: []
                });
            }

            // Parse items if string, otherwise use as is (MySQL JSON type handling)
            let items = menu.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    items = [];
                }
            }

            res.json({
                success: true,
                data: items || []
            });
        } catch (error) {
            console.error('Get Menu Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch menu'
            });
        }
    }

    /**
     * Add item to menu
     */
    static async addItem(req, res) {
        try {
            const { mode } = req.params;
            const { label, url, order } = req.body;

            if (!label) {
                return res.status(400).json({ success: false, message: 'Label is required' });
            }

            // Get current menu
            let menu = await CmsMenuModel.findByName(mode);
            let items = [];

            if (menu) {
                items = typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items;
            }

            // Create new item
            const newItem = {
                id: generateId(),
                label,
                url: url || '#',
                order: order || items.length
            };

            items.push(newItem);

            // Update or Create
            if (menu) {
                await CmsMenuModel.update(mode, items);
            } else {
                await CmsMenuModel.create(mode, items);
            }

            res.json({
                success: true,
                message: 'Item added successfully',
                data: newItem
            });
        } catch (error) {
            console.error('Add Item Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add item'
            });
        }
    }

    /**
     * Delete item from menu
     */
    static async deleteItem(req, res) {
        try {
            const { mode, id } = req.params;

            const menu = await CmsMenuModel.findByName(mode);
            if (!menu) {
                return res.status(404).json({ success: false, message: 'Menu not found' });
            }

            let items = typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items;

            // Filter out item
            const initialLength = items.length;
            items = items.filter(item => item.id !== id && item.id != id); // Handle string/int ID mismatch

            if (items.length === initialLength) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }

            await CmsMenuModel.update(mode, items);

            res.json({
                success: true,
                message: 'Item deleted successfully'
            });
        } catch (error) {
            console.error('Delete Item Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete item'
            });
        }
    }

    /**
     * Update entire menu (reorder/save all)
     */
    static async updateMenu(req, res) {
        try {
            const { mode } = req.params;
            const { items } = req.body;

            if (!Array.isArray(items)) {
                return res.status(400).json({ success: false, message: 'Items must be an array' });
            }

            // Ensure all items have IDs
            const sanitizedItems = items.map(item => ({
                ...item,
                id: item.id || generateId()
            }));

            const menu = await CmsMenuModel.findByName(mode);

            if (menu) {
                await CmsMenuModel.update(mode, sanitizedItems);
            } else {
                await CmsMenuModel.create(mode, sanitizedItems);
            }

            res.json({
                success: true,
                message: 'Menu updated successfully',
                data: sanitizedItems
            });
        } catch (error) {
            console.error('Update Menu Error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update menu'
            });
        }
    }
}

module.exports = CmsController;
