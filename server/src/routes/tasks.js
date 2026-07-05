const express = require('express');
const router = express.Router();
const { queryAll, queryOne, runSql } = require('../db/database');

// Helper: get tags for a task
function getTaskTags(taskId) {
  return queryAll(
    `SELECT t.* FROM tags t 
     JOIN task_tags tt ON t.id = tt.tag_id 
     WHERE tt.task_id = ?`,
    [taskId]
  );
}

// Helper: get category for a task
function getTaskCategory(categoryId) {
  if (!categoryId) return null;
  return queryOne('SELECT * FROM categories WHERE id = ?', [categoryId]);
}

// Helper: enrich a task with its category, tags, and subtasks
function enrichTask(task) {
  const subtasks = queryAll('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position', [task.id]);
  return {
    ...task,
    category: getTaskCategory(task.category_id),
    tags: getTaskTags(task.id),
    subtasks,
    subtask_count: subtasks.length,
    subtask_completed: subtasks.filter(s => s.completed).length,
  };
}

// GET /api/tasks - list tasks with filtering and sorting
router.get('/', (req, res) => {
  try {
    const { status, priority, category_id, tag_id, sort_by, sort_order, search, due_before } = req.query;

    let sql = 'SELECT DISTINCT tasks.* FROM tasks';
    const params = [];
    const conditions = [];

    // Join for tag filtering
    if (tag_id) {
      sql += ' JOIN task_tags ON tasks.id = task_tags.task_id';
      conditions.push('task_tags.tag_id = ?');
      params.push(tag_id);
    }

    if (status) {
      conditions.push('tasks.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('tasks.priority = ?');
      params.push(priority);
    }

    if (category_id) {
      conditions.push('tasks.category_id = ?');
      params.push(category_id);
    }

    // Search filter
    if (search) {
      conditions.push('(tasks.title LIKE ? OR tasks.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Due before filter (for focus view - tasks due today or before)
    if (due_before) {
      conditions.push('tasks.due_date <= ?');
      params.push(due_before);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const validSortFields = ['due_date', 'priority', 'created_at', 'updated_at', 'title', 'position'];
    const validSortOrders = ['asc', 'desc'];
    
    let orderField = 'created_at';
    let orderDir = 'desc';

    if (sort_by && validSortFields.includes(sort_by)) {
      if (sort_by === 'priority') {
        // Custom priority ordering: Critical > High > Medium > Low
        const dir = (sort_order === 'asc') ? 'DESC' : 'ASC';
        sql += ` ORDER BY CASE tasks.priority 
          WHEN 'Critical' THEN 4 
          WHEN 'High' THEN 3 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 1 
          END ${dir}`;
      } else {
        orderField = sort_by;
        if (sort_order && validSortOrders.includes(sort_order.toLowerCase())) {
          orderDir = sort_order.toLowerCase();
        }
        sql += ` ORDER BY tasks.${orderField} ${orderDir.toUpperCase()}`;
      }
    } else {
      sql += ` ORDER BY tasks.${orderField} ${orderDir.toUpperCase()}`;
    }

    const tasks = queryAll(sql, params);
    const enrichedTasks = tasks.map(enrichTask);
    res.json(enrichedTasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - get single task
router.get('/:id', (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(enrichTask(task));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks/batch - bulk operations
router.post('/batch', (req, res) => {
  try {
    const { action, task_ids, category_id } = req.body;

    if (!action || !task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return res.status(400).json({ error: 'action and task_ids (non-empty array) are required' });
    }

    const validActions = ['complete', 'delete', 'move'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` });
    }

    let affected = 0;

    switch (action) {
      case 'complete':
        for (const taskId of task_ids) {
          const { changes } = runSql(
            "UPDATE tasks SET status = 'completed', updated_at = datetime('now') WHERE id = ?",
            [taskId]
          );
          affected += changes;
        }
        break;

      case 'delete':
        for (const taskId of task_ids) {
          const { changes } = runSql('DELETE FROM tasks WHERE id = ?', [taskId]);
          affected += changes;
        }
        break;

      case 'move':
        if (category_id === undefined) {
          return res.status(400).json({ error: 'category_id is required for move action' });
        }
        for (const taskId of task_ids) {
          const { changes } = runSql(
            "UPDATE tasks SET category_id = ?, updated_at = datetime('now') WHERE id = ?",
            [category_id, taskId]
          );
          affected += changes;
        }
        break;
    }

    res.json({ message: `Batch ${action} completed`, affected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to perform batch operation' });
  }
});

// POST /api/tasks - create a task
router.post('/', (req, res) => {
  try {
    const { title, description, due_date, priority, category_id, tag_ids, energy_size, recurrence } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : 'Medium';

    const validEnergySizes = ['Small', 'Medium', 'Large'];
    const taskEnergySize = energy_size && validEnergySizes.includes(energy_size) ? energy_size : 'Medium';

    const validRecurrences = ['daily', 'weekly', 'monthly', 'weekdays'];
    const taskRecurrence = recurrence && validRecurrences.includes(recurrence) ? recurrence : null;

    // Set initial position = max(position) + 1
    const maxPos = queryOne('SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks');
    const newPosition = (maxPos ? maxPos.max_pos : 0) + 1;

    const { lastId } = runSql(
      `INSERT INTO tasks (title, description, due_date, priority, category_id, position, energy_size, recurrence) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || '', due_date || null, taskPriority, category_id || null, newPosition, taskEnergySize, taskRecurrence]
    );

    // Add tag associations
    if (tag_ids && Array.isArray(tag_ids)) {
      for (const tagId of tag_ids) {
        const tagExists = queryOne('SELECT id FROM tags WHERE id = ?', [tagId]);
        if (tagExists) {
          runSql('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [lastId, tagId]);
        }
      }
    }

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [lastId]);
    res.status(201).json(enrichTask(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - update a task
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, priority, category_id, tag_ids, energy_size, recurrence } = req.body;

    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : existing.priority;

    const validEnergySizes = ['Small', 'Medium', 'Large'];
    const taskEnergySize = energy_size && validEnergySizes.includes(energy_size) ? energy_size : existing.energy_size;

    const validRecurrences = ['daily', 'weekly', 'monthly', 'weekdays'];
    const taskRecurrence = recurrence !== undefined ? (recurrence && validRecurrences.includes(recurrence) ? recurrence : null) : existing.recurrence;

    runSql(
      `UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, 
       category_id = ?, energy_size = ?, recurrence = ?, updated_at = datetime('now') WHERE id = ?`,
      [title.trim(), description ?? existing.description, due_date ?? existing.due_date, 
       taskPriority, category_id ?? existing.category_id, taskEnergySize, taskRecurrence, id]
    );

    // Update tag associations if provided
    if (tag_ids && Array.isArray(tag_ids)) {
      runSql('DELETE FROM task_tags WHERE task_id = ?', [id]);
      for (const tagId of tag_ids) {
        const tagExists = queryOne('SELECT id FROM tags WHERE id = ?', [tagId]);
        if (tagExists) {
          runSql('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [id, tagId]);
        }
      }
    }

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(enrichTask(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/:id/status - toggle task status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newStatus = existing.status === 'pending' ? 'completed' : 'pending';
    runSql(
      "UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [newStatus, id]
    );

    // Handle recurring tasks: create next instance when completing
    if (newStatus === 'completed' && existing.recurrence) {
      const recurrence = existing.recurrence; // daily, weekly, monthly, weekdays
      let nextDueDate = null;

      if (existing.due_date) {
        const currentDue = new Date(existing.due_date);
        switch (recurrence) {
          case 'daily':
            currentDue.setDate(currentDue.getDate() + 1);
            break;
          case 'weekly':
            currentDue.setDate(currentDue.getDate() + 7);
            break;
          case 'monthly':
            currentDue.setMonth(currentDue.getMonth() + 1);
            break;
          case 'weekdays':
            do {
              currentDue.setDate(currentDue.getDate() + 1);
            } while (currentDue.getDay() === 0 || currentDue.getDay() === 6);
            break;
        }
        nextDueDate = currentDue.toISOString().split('T')[0];
      }

      // Create the next recurring task
      const maxPos = queryOne('SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks');
      const newPosition = (maxPos ? maxPos.max_pos : 0) + 1;

      runSql(
        `INSERT INTO tasks (title, description, due_date, priority, category_id, position, energy_size, recurrence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [existing.title, existing.description, nextDueDate, existing.priority, existing.category_id, newPosition, existing.energy_size, existing.recurrence]
      );
    }

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(enrichTask(task));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// PATCH /api/tasks/:id/reorder - reorder a task
router.patch('/:id/reorder', (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    if (position === undefined || position === null) {
      return res.status(400).json({ error: 'position is required' });
    }

    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const oldPosition = existing.position;
    const newPosition = position;

    if (oldPosition === newPosition) {
      return res.json(enrichTask(existing));
    }

    // Shift other tasks accordingly
    if (newPosition < oldPosition) {
      // Moving up: shift tasks between newPosition and oldPosition-1 down by 1
      runSql(
        'UPDATE tasks SET position = position + 1 WHERE position >= ? AND position < ? AND id != ?',
        [newPosition, oldPosition, id]
      );
    } else {
      // Moving down: shift tasks between oldPosition+1 and newPosition up by 1
      runSql(
        'UPDATE tasks SET position = position - 1 WHERE position > ? AND position <= ? AND id != ?',
        [oldPosition, newPosition, id]
      );
    }

    // Update this task's position
    runSql(
      "UPDATE tasks SET position = ?, updated_at = datetime('now') WHERE id = ?",
      [newPosition, id]
    );

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(enrichTask(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder task' });
  }
});

// GET /api/tasks/:id/subtasks - list subtasks for a task
router.get('/:id/subtasks', (req, res) => {
  try {
    const { id } = req.params;

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const subtasks = queryAll('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position', [id]);
    res.json(subtasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// POST /api/tasks/:id/subtasks - create a subtask
router.post('/:id/subtasks', (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const task = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Set position to max + 1
    const maxPos = queryOne('SELECT COALESCE(MAX(position), 0) as max_pos FROM subtasks WHERE task_id = ?', [id]);
    const newPosition = (maxPos ? maxPos.max_pos : 0) + 1;

    const { lastId } = runSql(
      'INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)',
      [id, title.trim(), newPosition]
    );

    const subtask = queryOne('SELECT * FROM subtasks WHERE id = ?', [lastId]);
    res.status(201).json(subtask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// DELETE /api/tasks/:id - delete a task
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = queryOne('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // task_tags and subtasks entries are cascade-deleted via foreign key
    runSql('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
