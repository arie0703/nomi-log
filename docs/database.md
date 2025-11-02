# データベース設計

## 概要

SQLiteを使用してローカルデータを永続化する。以下の4つのテーブルで構成される。

## テーブル設計

### 1. posts テーブル（投稿テーブル）

投稿（日記エントリー）を格納する。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 投稿ID |
| date | TEXT | NOT NULL | 投稿日（YYYY-MM-DD形式） |
| comment | TEXT | | コメント（任意） |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 作成日時（ISO8601形式） |
| updated_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新日時（ISO8601形式） |

**CREATE TABLE文:**
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### 2. categories テーブル（カテゴリーテーブル）

お酒のカテゴリーを格納する。後から追加・削除が可能。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | カテゴリーID |
| name | TEXT | NOT NULL UNIQUE | カテゴリー名称 |
| display_order | INTEGER | NOT NULL DEFAULT 0 | 表示順序（小さい順） |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 作成日時（ISO8601形式） |
| updated_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新日時（ISO8601形式） |

**初期データ（初期セットアップ時に挿入）:**
- `ビール`
- `ウイスキー`
- `リキュール`
- `梅酒`
- `焼酎`
- `ワイン`
- `ノンアルコール`

**CREATE TABLE文:**
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### 3. beverages テーブル（お酒の情報テーブル）

お酒のマスタ情報を格納する。投稿時にプルダウンで選択される。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | お酒ID |
| name | TEXT | NOT NULL UNIQUE | 名称 |
| alcohol_content | REAL | | アルコール度数（パーセント、任意） |
| category_id | INTEGER | NOT NULL, FOREIGN KEY | カテゴリーID（categories.idを参照） |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 作成日時（ISO8601形式） |
| updated_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 更新日時（ISO8601形式） |

**CREATE TABLE文:**
```sql
CREATE TABLE beverages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  alcohol_content REAL,
  category_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### 4. post_beverages テーブル（投稿とお酒の中間テーブル）

投稿とお酒の多対多の関係を表現し、各お酒の飲んだ量を記録する。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | レコードID |
| post_id | INTEGER | NOT NULL, FOREIGN KEY | 投稿ID（posts.idを参照） |
| beverage_id | INTEGER | NOT NULL, FOREIGN KEY | お酒ID（beverages.idを参照） |
| amount | REAL | NOT NULL | 飲んだ量（ml） |
| created_at | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | 作成日時（ISO8601形式） |

**CREATE TABLE文:**
```sql
CREATE TABLE post_beverages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  beverage_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (beverage_id) REFERENCES beverages(id) ON DELETE CASCADE,
  UNIQUE(post_id, beverage_id)
);
```

## インデックス設計

クエリのパフォーマンス向上のため、以下のインデックスを設定する。

```sql
-- 投稿の作成日時でソート・検索するため
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- カテゴリーでの絞り込み検索のため
CREATE INDEX idx_beverages_category_id ON beverages(category_id);

-- カテゴリーの表示順序での取得のため
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- 投稿IDでの結合クエリを高速化
CREATE INDEX idx_post_beverages_post_id ON post_beverages(post_id);

-- お酒IDでの結合クエリを高速化
CREATE INDEX idx_post_beverages_beverage_id ON post_beverages(beverage_id);
```

## データの関係性

```
posts (1) ────< (多) post_beverages (多) >─── (1) beverages (多) ──── (1) categories
```

- 1つの投稿（post）には複数のお酒（beverage）を紐付け可能
- 1つのお酒（beverage）は複数の投稿（post）で使用可能
- `post_beverages`テーブルで投稿ごとのお酒の飲んだ量（ml）を記録
- 1つのお酒（beverage）は1つのカテゴリー（category）に属する
- 1つのカテゴリー（category）には複数のお酒（beverage）が属する

## 主なクエリ例

### 投稿一覧の取得（日付順）
```sql
SELECT 
  p.id,
  p.date,
  p.comment,
  p.created_at,
  GROUP_CONCAT(b.name || ' (' || pb.amount || 'ml)', ', ') as beverages
FROM posts p
LEFT JOIN post_beverages pb ON p.id = pb.post_id
LEFT JOIN beverages b ON pb.beverage_id = b.id
GROUP BY p.id
ORDER BY p.date DESC, p.created_at DESC;
```

### 特定のお酒を含む投稿を取得
```sql
SELECT p.*
FROM posts p
INNER JOIN post_beverages pb ON p.id = pb.post_id
WHERE pb.beverage_id = ?;
```

### カテゴリー別のお酒一覧
```sql
SELECT b.id, b.name, b.alcohol_content, c.name as category_name
FROM beverages b
INNER JOIN categories c ON b.category_id = c.id
WHERE b.category_id = ?
ORDER BY b.name;
```

### カテゴリー一覧の取得（表示順序順）
```sql
SELECT id, name, display_order
FROM categories
ORDER BY display_order, name;
```

### カテゴリーの追加
```sql
INSERT INTO categories (name, display_order)
VALUES (?, ?);
```

### カテゴリーの削除（使用されていない場合のみ）
```sql
DELETE FROM categories
WHERE id = ?
AND NOT EXISTS (
  SELECT 1 FROM beverages WHERE category_id = categories.id
);
```

## カテゴリー管理の設計思想

- **拡張性**: `categories`テーブルを独立させることで、アプリケーションの更新なしにカテゴリーを追加・削除可能
- **整合性**: 外部キー制約により、存在しないカテゴリーを参照できない
- **柔軟性**: 将来的にカテゴリーに属性（色、アイコン、説明など）を追加する場合も容易に対応可能
- **初期データ**: アプリケーション初回起動時に初期カテゴリー（ビール、ウイスキーなど）を挿入する

