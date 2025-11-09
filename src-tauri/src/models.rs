use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: Option<i64>,
    pub date: String,
    pub comment: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostWithBeverages {
    pub id: i64,
    pub date: String,
    pub comment: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub beverages: Vec<BeverageAmount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeverageAmount {
    pub beverage_id: i64,
    pub beverage_name: String,
    pub amount: f64,
    pub alcohol_content: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePostRequest {
    pub date: String,
    pub comment: Option<String>,
    pub beverages: Vec<BeverageAmountInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeverageAmountInput {
    pub beverage_id: i64,
    pub amount: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub display_order: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub display_order: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Beverage {
    pub id: i64,
    pub name: String,
    pub alcohol_content: Option<f64>,
    pub category_id: i64,
    pub category_name: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBeverageRequest {
    pub name: String,
    pub alcohol_content: Option<f64>,
    pub category_id: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyAlcoholIntake {
    pub total_intake: f64,
    pub average_per_day: f64,
    pub drinking_days: i64,
}

