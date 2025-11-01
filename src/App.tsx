import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface Category {
  id: number;
  name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Category[]>("get_categories");
      setCategories(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "カテゴリーの取得に失敗しました"
      );
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>飲みログ - カテゴリー一覧</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={loadCategories}
          disabled={loading}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "読み込み中..." : "再読み込み"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fee",
            color: "#c33",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          エラー: {error}
        </div>
      )}

      {loading && categories.length === 0 ? (
        <div>読み込み中...</div>
      ) : categories.length === 0 ? (
        <div>カテゴリーがありません</div>
      ) : (
        <div>
          <h2>カテゴリー一覧 ({categories.length}件)</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  名称
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  表示順
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                  }}
                >
                  作成日時
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {category.id}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {category.name}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {category.display_order}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {category.created_at || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
