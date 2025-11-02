# のみログ

飲酒記録をするためのデスクトップアプリ

## Command

```sh

# ビルド
yarn tauri build

# 開発モードでの起動
yarn tauri:dev

```

## SQLite3

```sh
# ローカルからのSQLite3アクセス
sqlite3 ~/Library/Application\ Support/com.nomi-log.app/nomi-log.db
```

```sql
-- テーブル一覧を表示
.tables

-- スキーマを表示
.schema categories
.schema posts
.schema beverages
.schema post_beverages

-- カテゴリーテーブルの全データを表示
SELECT * FROM categories;

-- カテゴリーを追加
INSERT INTO categories (name, display_order) VALUES ('カテゴリー名', 10);

-- 投稿データを確認
SELECT * FROM posts;

-- 投稿削除
DELETE FROM posts WHERE id = 1;
```
