const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../db/database');

// GET /api/categories - list all categories
router.get('/', (req, res) => {
  try {
    const categories = queryAll('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id - get single category
router.get('/:id', (req, res) => {
  try {
    const category = queryOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories - create a category
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existing = queryOne('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    const { lastId } = runSql(
      'INSERT INTO categories (name, color) VALUES (?, ?)',
      [name.trim(), color || '#6b7280']
    );

    const category = queryOne('SELECT * FROM categories WHERE id = ?', [lastId]);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - update a category
router.put('/:id', (req, res) => {
  try {
    const { name, color } = req.body;
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const duplicate = queryOne('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
    if (duplicate) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    runSql(
      'UPDATE categories SET name = ?, color = ? WHERE id = ?',
      [name.trim(), color || existing.color, id]
    );

    const category = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - delete a category
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Set category_id to null for tasks in this category
    runSql('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [id]);
    runSql('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
