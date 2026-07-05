const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../db/database');

// GET /api/tags - list all tags
router.get('/', (req, res) => {
  try {
    const tags = queryAll('SELECT * FROM tags ORDER BY name ASC');
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/:id - get single tag
router.get('/:id', (req, res) => {
  try {
    const tag = queryOne('SELECT * FROM tags WHERE id = ?', [req.params.id]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// POST /api/tags - create a tag
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existing = queryOne('SELECT id FROM tags WHERE name = ?', [name.trim()]);
    if (existing) {
      return res.status(409).json({ error: 'A tag with this name already exists' });
    }

    const { lastId } = runSql(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name.trim(), color || '#3b82f6']
    );

    const tag = queryOne('SELECT * FROM tags WHERE id = ?', [lastId]);
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/tags/:id - update a tag
router.put('/:id', (req, res) => {
  try {
    const { name, color } = req.body;
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM tags WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const duplicate = queryOne('SELECT id FROM tags WHERE name = ? AND id != ?', [name.trim(), id]);
    if (duplicate) {
      return res.status(409).json({ error: 'A tag with this name already exists' });
    }

    runSql(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name.trim(), color || existing.color, id]
    );

    const tag = queryOne('SELECT * FROM tags WHERE id = ?', [id]);
    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/tags/:id - delete a tag (cascade removes from task_tags)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM tags WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // task_tags entries are cascade-deleted via foreign key
    runSql('DELETE FROM tags WHERE id = ?', [id]);

    res.json({ message: 'Tag deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
