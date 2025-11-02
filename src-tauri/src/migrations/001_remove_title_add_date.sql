-- マイグレーション v1 -> v2: postsテーブルからtitleカラムを削除し、dateカラムを追加
-- SQLiteはALTER TABLE DROP COLUMNをサポートしていないため、テーブル再作成が必要

-- 外部キー制約を一時的に無効化
PRAGMA foreign_keys = OFF;

-- 新しいカラム定義で一時テーブルを作成
CREATE TABLE posts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- 既存データを移行（titleカラムは無視、dateはcreated_atから日付部分を抽出）
INSERT INTO posts_new (id, date, comment, created_at, updated_at)
SELECT 
    id,
    date(created_at) as date,
    comment,
    created_at,
    updated_at
FROM posts;

-- 古いテーブルを削除（この時点でpostsテーブルは一時的に存在しない）
DROP TABLE IF EXISTS posts;

-- 新しいテーブルを元の名前にリネーム（最終的にpostsテーブル名を維持）
ALTER TABLE posts_new RENAME TO posts;

-- dateカラム用のインデックスを作成
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);

-- 既存のインデックスを再作成
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 外部キー制約を再有効化
PRAGMA foreign_keys = ON;

