const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskflow.db');
let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }
  db.run(`PRAGMA foreign_keys = ON;`);
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
      avatar TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, description TEXT, color TEXT DEFAULT '#6366f1',
      owner_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, description TEXT,
      status TEXT NOT NULL DEFAULT 'todo', priority TEXT NOT NULL DEFAULT 'medium',
      project_id INTEGER NOT NULL, assignee_id INTEGER, creator_id INTEGER NOT NULL,
      due_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
      content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  saveDb();
  return db;
}

function saveDb() {
  if (db) fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function prepare(sql) {
  return {
    run(...params) {
      db.run(sql, params); saveDb();
      const r = db.exec('SELECT last_insert_rowid() as id');
      return { lastInsertRowid: r.length ? r[0].values[0][0] : null, changes: db.getRowsModified() };
    },
    get(...params) {
      const r = db.exec(sql, params);
      if (!r.length || !r[0].values.length) return undefined;
      const obj = {}; r[0].columns.forEach((c, i) => { obj[c] = r[0].values[0][i]; }); return obj;
    },
    all(...params) {
      const r = db.exec(sql, params);
      if (!r.length) return [];
      return r[0].values.map(row => {
        const obj = {}; r[0].columns.forEach((c, i) => { obj[c] = row[i]; }); return obj;
      });
    }
  };
}

module.exports = { initDb, prepare, saveDb };