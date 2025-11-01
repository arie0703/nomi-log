use rusqlite::{Connection, Result, params};
use std::path::PathBuf;
use crate::error::AppError;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: PathBuf) -> Result<Self, AppError> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init()?;
        Ok(db)
    }

    pub fn conn(&self) -> &Connection {
        &self.conn
    }

    fn init(&self) -> Result<(), AppError> {
        self.create_tables()?;
        self.create_indexes()?;
        self.insert_initial_categories()?;
        Ok(())
    }

    fn create_tables(&self) -> Result<(), AppError> {
        // categories テーブル
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                display_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )",
            [],
        )?;

        // posts テーブル
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                comment TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )",
            [],
        )?;

        // beverages テーブル
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS beverages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                alcohol_content REAL,
                category_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )",
            [],
        )?;

        // post_beverages テーブル
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS post_beverages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                beverage_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (beverage_id) REFERENCES beverages(id) ON DELETE CASCADE,
                UNIQUE(post_id, beverage_id)
            )",
            [],
        )?;

        Ok(())
    }

    fn create_indexes(&self) -> Result<(), AppError> {
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_beverages_category_id ON beverages(category_id)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_post_beverages_post_id ON post_beverages(post_id)",
            [],
        )?;
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_post_beverages_beverage_id ON post_beverages(beverage_id)",
            [],
        )?;
        Ok(())
    }

    fn insert_initial_categories(&self) -> Result<(), AppError> {
        // 既にカテゴリーが存在するかチェック
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM categories",
            [],
            |row| row.get(0),
        )?;

        if count > 0 {
            // 既にデータが存在する場合はスキップ
            return Ok(());
        }

        let initial_categories = vec![
            ("ビール", 1),
            ("ウイスキー", 2),
            ("リキュール", 3),
            ("梅酒", 4),
            ("焼酎", 5),
            ("ワイン", 6),
            ("ノンアルコール", 7),
        ];

        for (name, display_order) in initial_categories {
            self.conn.execute(
                "INSERT INTO categories (name, display_order) VALUES (?1, ?2)",
                params![name, display_order],
            )?;
        }

        Ok(())
    }
}

