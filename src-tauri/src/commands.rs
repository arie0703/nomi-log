use crate::db::Database;
use crate::error::AppError;
use crate::models::*;
use rusqlite::params;
use std::sync::{Mutex, MutexGuard};
use tauri::State;

#[tauri::command]
pub fn get_posts(db: State<'_, Mutex<Database>>) -> Result<Vec<PostWithBeverages>, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let mut stmt = db.conn().prepare(
        "SELECT 
            p.id,
            p.date,
            p.comment,
            p.created_at,
            p.updated_at
        FROM posts p
        ORDER BY p.date DESC, p.created_at DESC"
    )?;

    let posts_iter = stmt.query_map([], |row| {
        Ok(PostWithBeverages {
            id: row.get(0)?,
            date: row.get(1)?,
            comment: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
            beverages: vec![],
        })
    })?;

    let mut posts: Vec<PostWithBeverages> = posts_iter.collect::<Result<Vec<_>, _>>()?;

    // 各投稿のお酒を取得
    for post in &mut posts {
        let mut beverage_stmt = db.conn().prepare(
            "SELECT 
                pb.beverage_id,
                b.name,
                pb.amount,
                b.alcohol_content
            FROM post_beverages pb
            INNER JOIN beverages b ON pb.beverage_id = b.id
            WHERE pb.post_id = ?"
        )?;

        let beverages = beverage_stmt.query_map(params![post.id], |row| {
            Ok(BeverageAmount {
                beverage_id: row.get(0)?,
                beverage_name: row.get(1)?,
                amount: row.get(2)?,
                alcohol_content: row.get(3)?,
            })
        })?;

        post.beverages = beverages.collect::<Result<Vec<_>, _>>()?;
    }

    Ok(posts)
}

#[tauri::command]
pub fn create_post(
    db: State<'_, Mutex<Database>>,
    request: CreatePostRequest,
) -> Result<i64, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let tx = db.conn().unchecked_transaction()?;

    // 投稿を作成
    tx.execute(
        "INSERT INTO posts (date, comment) VALUES (?1, ?2)",
        params![request.date, request.comment],
    )?;

    let post_id = tx.last_insert_rowid();

    // お酒との関連を追加
    for beverage in request.beverages {
        tx.execute(
            "INSERT INTO post_beverages (post_id, beverage_id, amount) VALUES (?1, ?2, ?3)",
            params![post_id, beverage.beverage_id, beverage.amount],
        )?;
    }

    tx.commit()?;
    Ok(post_id)
}

#[tauri::command]
pub fn update_post(
    db: State<'_, Mutex<Database>>,
    id: i64,
    request: CreatePostRequest,
) -> Result<(), AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let tx = db.conn().unchecked_transaction()?;

    // 投稿を更新
    tx.execute(
        "UPDATE posts SET date = ?1, comment = ?2, updated_at = datetime('now', 'localtime') WHERE id = ?3",
        params![request.date, request.comment, id],
    )?;

    // 既存のお酒との関連を削除
    tx.execute(
        "DELETE FROM post_beverages WHERE post_id = ?1",
        params![id],
    )?;

    // 新しいお酒との関連を追加
    for beverage in request.beverages {
        tx.execute(
            "INSERT INTO post_beverages (post_id, beverage_id, amount) VALUES (?1, ?2, ?3)",
            params![id, beverage.beverage_id, beverage.amount],
        )?;
    }

    tx.commit()?;
    Ok(())
}

#[tauri::command]
pub fn delete_post(db: State<'_, Mutex<Database>>, id: i64) -> Result<(), AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    db.conn().execute(
        "DELETE FROM posts WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_categories(db: State<'_, Mutex<Database>>) -> Result<Vec<Category>, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let mut stmt = db.conn().prepare(
        "SELECT id, name, display_order, created_at, updated_at
        FROM categories
        ORDER BY display_order, name"
    )?;

    let categories = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
            display_order: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;

    Ok(categories.collect::<Result<Vec<_>, _>>()?)
}

#[tauri::command]
pub fn create_category(
    db: State<'_, Mutex<Database>>,
    request: CreateCategoryRequest,
) -> Result<i64, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let display_order = request.display_order.unwrap_or(0);
    
    db.conn().execute(
        "INSERT INTO categories (name, display_order) VALUES (?1, ?2)",
        params![request.name, display_order],
    )?;

    Ok(db.conn().last_insert_rowid())
}

#[tauri::command]
pub fn delete_category(db: State<'_, Mutex<Database>>, id: i64) -> Result<bool, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    
    // 使用されているかチェック
    let count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM beverages WHERE category_id = ?1",
        params![id],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Err(AppError::InvalidInput(
            "このカテゴリーは使用中のため削除できません".to_string(),
        ));
    }

    db.conn().execute(
        "DELETE FROM categories WHERE id = ?1",
        params![id],
    )?;

    Ok(true)
}

#[tauri::command]
pub fn get_beverages(db: State<'_, Mutex<Database>>) -> Result<Vec<Beverage>, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let mut stmt = db.conn().prepare(
        "SELECT 
            b.id,
            b.name,
            b.alcohol_content,
            b.category_id,
            c.name as category_name,
            b.created_at,
            b.updated_at
        FROM beverages b
        INNER JOIN categories c ON b.category_id = c.id
        ORDER BY b.name"
    )?;

    let beverages = stmt.query_map([], |row| {
        Ok(Beverage {
            id: row.get(0)?,
            name: row.get(1)?,
            alcohol_content: row.get(2)?,
            category_id: row.get(3)?,
            category_name: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    Ok(beverages.collect::<Result<Vec<_>, _>>()?)
}

#[tauri::command]
pub fn get_beverages_by_category(
    db: State<'_, Mutex<Database>>,
    category_id: i64,
) -> Result<Vec<Beverage>, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    let mut stmt = db.conn().prepare(
        "SELECT 
            b.id,
            b.name,
            b.alcohol_content,
            b.category_id,
            c.name as category_name,
            b.created_at,
            b.updated_at
        FROM beverages b
        INNER JOIN categories c ON b.category_id = c.id
        WHERE b.category_id = ?1
        ORDER BY b.name"
    )?;

    let beverages = stmt.query_map(params![category_id], |row| {
        Ok(Beverage {
            id: row.get(0)?,
            name: row.get(1)?,
            alcohol_content: row.get(2)?,
            category_id: row.get(3)?,
            category_name: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;

    Ok(beverages.collect::<Result<Vec<_>, _>>()?)
}

#[tauri::command]
pub fn create_beverage(
    db: State<'_, Mutex<Database>>,
    request: CreateBeverageRequest,
) -> Result<i64, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    
    // バリデーション: 名称が空でないことを確認
    if request.name.trim().is_empty() {
        return Err(AppError::InvalidInput("お酒の名称を入力してください".to_string()));
    }
    
    // カテゴリーが存在するか確認
    let category_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM categories WHERE id = ?1",
        params![request.category_id],
        |row| row.get(0),
    )?;
    
    if category_count == 0 {
        return Err(AppError::InvalidInput("指定されたカテゴリーが見つかりません".to_string()));
    }
    
    db.conn().execute(
        "INSERT INTO beverages (name, alcohol_content, category_id) VALUES (?1, ?2, ?3)",
        params![request.name.trim(), request.alcohol_content, request.category_id],
    )?;

    Ok(db.conn().last_insert_rowid())
}

#[tauri::command]
pub fn update_beverage(
    db: State<'_, Mutex<Database>>,
    id: i64,
    request: CreateBeverageRequest,
) -> Result<(), AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    
    // バリデーション: 名称が空でないことを確認
    if request.name.trim().is_empty() {
        return Err(AppError::InvalidInput("お酒の名称を入力してください".to_string()));
    }
    
    // お酒が存在するか確認
    let count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM beverages WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    
    if count == 0 {
        return Err(AppError::InvalidInput("指定されたお酒が見つかりません".to_string()));
    }
    
    // カテゴリーが存在するか確認
    let category_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM categories WHERE id = ?1",
        params![request.category_id],
        |row| row.get(0),
    )?;
    
    if category_count == 0 {
        return Err(AppError::InvalidInput("指定されたカテゴリーが見つかりません".to_string()));
    }
    
    db.conn().execute(
        "UPDATE beverages SET name = ?1, alcohol_content = ?2, category_id = ?3, updated_at = datetime('now', 'localtime') WHERE id = ?4",
        params![request.name.trim(), request.alcohol_content, request.category_id, id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn delete_beverage(db: State<'_, Mutex<Database>>, id: i64) -> Result<(), AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    
    // お酒が存在するか確認
    let count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM beverages WHERE id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    
    if count == 0 {
        return Err(AppError::InvalidInput("指定されたお酒が見つかりません".to_string()));
    }
    
    // 使用されているかチェック（投稿に紐づいている場合）
    let usage_count: i64 = db.conn().query_row(
        "SELECT COUNT(*) FROM post_beverages WHERE beverage_id = ?1",
        params![id],
        |row| row.get(0),
    )?;
    
    if usage_count > 0 {
        return Err(AppError::InvalidInput(
            format!("このお酒は{}件の投稿で使用されているため削除できません", usage_count)
        ));
    }
    
    db.conn().execute(
        "DELETE FROM beverages WHERE id = ?1",
        params![id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn get_monthly_alcohol_intake(
    db: State<'_, Mutex<Database>>,
    year: i64,
    month: i64,
) -> Result<MonthlyAlcoholIntake, AppError> {
    let db: MutexGuard<'_, Database> = db.lock().unwrap();
    
    // 指定された年月の開始日と終了日を計算
    let start_date = format!("{:04}-{:02}-01", year, month);
    let end_date = if month == 12 {
        format!("{:04}-01-01", year + 1)
    } else {
        format!("{:04}-{:02}-01", year, month + 1)
    };

    // 指定された月の投稿を取得
    let mut stmt = db.conn().prepare(
        "SELECT 
            p.id,
            p.date
        FROM posts p
        WHERE p.date >= ?1 AND p.date < ?2
        ORDER BY p.date"
    )?;

    let posts = stmt.query_map(params![start_date, end_date], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
    })?;

    let posts_data: Vec<(i64, String)> = posts.collect::<Result<Vec<_>, _>>()?;
    
    let mut total_intake = 0.0;
    let mut unique_dates = std::collections::HashSet::new();

    // 各投稿のアルコール摂取量を計算
    for (post_id, date) in &posts_data {
        unique_dates.insert(date.clone());
        
        let mut beverage_stmt = db.conn().prepare(
            "SELECT 
                pb.amount,
                b.alcohol_content
            FROM post_beverages pb
            INNER JOIN beverages b ON pb.beverage_id = b.id
            WHERE pb.post_id = ?"
        )?;

        let beverages = beverage_stmt.query_map(params![post_id], |row| {
            Ok((row.get::<_, f64>(0)?, row.get::<_, Option<f64>>(1)?))
        })?;

        for beverage in beverages {
            let (amount, alcohol_content) = beverage?;
            if let Some(alc_content) = alcohol_content {
                if alc_content > 0.0 {
                    // 飲んだ容量(ml) * アルコール度数(%) / 100 * 0.8
                    total_intake += amount * (alc_content / 100.0) * 0.8;
                }
            }
        }
    }

    let drinking_days = unique_dates.len() as i64;
    
    // 月の日数を計算（うるう年も考慮）
    let days_in_month = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            // うるう年の判定
            if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 30, // エラー時のデフォルト値
    };
    
    // 1日当たりの平均摂取量は月の日数で割る（飲酒記録のない日も含む）
    let average_per_day = total_intake / days_in_month as f64;

    Ok(MonthlyAlcoholIntake {
        total_intake,
        average_per_day,
        drinking_days,
    })
}

