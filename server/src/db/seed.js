const { getDb, runSql, closeDb } = require('./database');

async function seed() {
  await getDb();

  console.log('Seeding database...');

  // Create categories
  runSql("INSERT OR IGNORE INTO categories (name, color) VALUES ('Work', '#3b82f6')");
  runSql("INSERT OR IGNORE INTO categories (name, color) VALUES ('Personal', '#10b981')");
  runSql("INSERT OR IGNORE INTO categories (name, color) VALUES ('Health', '#ef4444')");
  runSql("INSERT OR IGNORE INTO categories (name, color) VALUES ('Learning', '#8b5cf6')");

  // Create tags
  runSql("INSERT OR IGNORE INTO tags (name, color) VALUES ('urgent', '#ef4444')");
  runSql("INSERT OR IGNORE INTO tags (name, color) VALUES ('frontend', '#3b82f6')");
  runSql("INSERT OR IGNORE INTO tags (name, color) VALUES ('backend', '#10b981')");
  runSql("INSERT OR IGNORE INTO tags (name, color) VALUES ('design', '#ec4899')");
  runSql("INSERT OR IGNORE INTO tags (name, color) VALUES ('meeting', '#f59e0b')");

  // Create tasks
  const tasks = [
    { title: 'Design new landing page', desc: 'Create wireframes and mockups for the new product landing page', due: '2026-07-10', priority: 'High', cat: 1, tags: [2, 4] },
    { title: 'Fix login bug', desc: 'Users report intermittent login failures on mobile', due: '2026-07-05', priority: 'Critical', cat: 1, tags: [1, 3] },
    { title: 'Weekly team standup', desc: 'Discuss sprint progress and blockers', due: '2026-07-07', priority: 'Medium', cat: 1, tags: [5] },
    { title: 'Go for a 30min run', desc: 'Morning jog in the park', due: '2026-07-04', priority: 'Low', cat: 3, tags: [] },
    { title: 'Read Clean Code chapter 5', desc: 'Functions chapter - best practices for writing clean functions', due: '2026-07-08', priority: 'Medium', cat: 4, tags: [] },
    { title: 'Grocery shopping', desc: 'Buy vegetables, fruits, and snacks for the week', due: '2026-07-04', priority: 'Low', cat: 2, tags: [] },
    { title: 'Set up CI/CD pipeline', desc: 'Configure GitHub Actions for automated testing and deployment', due: '2026-07-12', priority: 'High', cat: 1, tags: [3] },
    { title: 'Plan birthday party', desc: 'Book venue, send invitations, order cake', due: '2026-07-20', priority: 'Medium', cat: 2, tags: [] },
  ];

  for (const t of tasks) {
    const { lastId } = runSql(
      "INSERT INTO tasks (title, description, due_date, priority, category_id) VALUES (?, ?, ?, ?, ?)",
      [t.title, t.desc, t.due, t.priority, t.cat]
    );
    for (const tagId of t.tags) {
      runSql("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)", [lastId, tagId]);
    }
  }

  // Mark one task as completed
  runSql("UPDATE tasks SET status = 'completed' WHERE title = 'Go for a 30min run'");

  console.log('Seed complete! Created 4 categories, 5 tags, and 8 tasks.');
  closeDb();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
