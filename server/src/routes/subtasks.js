const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../db/database');

// PATCH /api/subtasks/:id - toggle completed or update title
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { completed, title } = req.body;

    const existing = queryOne('SELECT * FROM subtasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const updates = [];
    const params = [];

    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update. Provide completed or title.' });
    }

    params.push(id);
    runSql(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`, params);

    const subtask = queryOne('SELECT * FROM subtasks WHERE id = ?', [id]);
    res.json(subtask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// PATCH /api/subtasks/:id/reorder - change subtask position
router.patch('/:id/reorder', (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null) {
      return res.status(400).json({ error: 'position is required' });
    }

    const existing = queryOne('SELECT * FROM subtasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const oldPosition = existing.position;
    const newPosition = position;

    if (oldPosition === newPosition) {
      return res.json(existing);
    }

    // Shift other subtasks within the same task
    if (newPosition < oldPosition) {
      // Moving up: shift subtasks between newPosition and oldPosition-1 down by 1
      runSql(
        'UPDATE subtasks SET position = position + 1 WHERE task_id = ? AND position >= ? AND position < ? AND id != ?',
        [existing.task_id, newPosition, oldPosition, id]
      );
    } else {
      // Moving down: shift subtasks between oldPosition+1 and newPosition up by 1
      runSql(
        'UPDATE subtasks SET position = position - 1 WHERE task_id = ? AND position > ? AND position <= ? AND id != ?',
        [existing.task_id, oldPosition, newPosition, id]
      );
    }

    // Update this subtask's position
    runSql('UPDATE subtasks SET position = ? WHERE id = ?', [newPosition, id]);

    const subtask = queryOne('SELECT * FROM subtasks WHERE id = ?', [id]);
    res.json(subtask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder subtask' });
  }
});

// DELETE /api/subtasks/:id - delete a subtask
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM subtasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    runSql('DELETE FROM subtasks WHERE id = ?', [id]);

    // Reorder remaining subtasks to close the gap
    runSql(
      'UPDATE subtasks SET position = position - 1 WHERE task_id = ? AND position > ?',
      [existing.task_id, existing.position]
    );

    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

module.exports = router;
