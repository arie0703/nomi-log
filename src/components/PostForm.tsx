import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Category, type Beverage, type CreatePostRequest } from "../types";
import "../assets/styles/post-form.scss";

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const [selectedBeverages, setSelectedBeverages] = useState<
    Array<{ beverage: Beverage; amount: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadBeveragesByCategory(selectedCategoryId);
    } else {
      setBeverages([]);
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const result = await invoke<Category[]>("get_categories");
      setCategories(result);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadBeveragesByCategory = async (categoryId: number) => {
    try {
      const result = await invoke<Beverage[]>("get_beverages_by_category", {
        categoryId,
      });
      setBeverages(result);
    } catch (err) {
      console.error("Error loading beverages:", err);
    }
  };

  const addBeverage = () => {
    if (!selectedCategoryId) {
      setError("カテゴリーを選択してください");
      return;
    }
    if (beverages.length === 0) {
      setError("このカテゴリーにはお酒が登録されていません");
      return;
    }
    // 最初のお酒をデフォルトで選択
    const firstBeverage = beverages[0];
    setSelectedBeverages([
      ...selectedBeverages,
      { beverage: firstBeverage, amount: 0 },
    ]);
    setError(null);
  };

  const removeBeverage = (index: number) => {
    setSelectedBeverages(selectedBeverages.filter((_, i) => i !== index));
  };

  const updateBeverage = (
    index: number,
    beverageId: number,
    amount: number
  ) => {
    const newBeverages = [...selectedBeverages];
    const beverage = beverages.find((b) => b.id === beverageId);
    if (beverage) {
      newBeverages[index] = { beverage, amount };
      setSelectedBeverages(newBeverages);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    if (selectedBeverages.length === 0) {
      setError("お酒を最低1つ選択してください");
      return;
    }

    const beveragesWithAmount = selectedBeverages.filter((sb) => sb.amount > 0);
    if (beveragesWithAmount.length === 0) {
      setError("飲んだ量を入力してください");
      return;
    }

    try {
      setLoading(true);
      const request: CreatePostRequest = {
        title: title.trim(),
        comment: comment.trim() || undefined,
        beverages: beveragesWithAmount.map((sb) => ({
          beverage_id: sb.beverage.id,
          amount: sb.amount,
        })),
      };

      await invoke("create_post", { request });
      // フォームをリセット
      setTitle("");
      setComment("");
      setSelectedCategoryId(null);
      setSelectedBeverages([]);
      setError(null);
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿の作成に失敗しました");
      console.error("Error creating post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form">
      <h2 className="post-form--title">新規投稿</h2>
      <form onSubmit={handleSubmit}>
        <div className="post-form--form-group">
          <label>
            タイトル <span className="required">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="post-form--input"
            placeholder="例: 今日の晩酌"
          />
        </div>

        <div className="post-form--form-group">
          <label>コメント</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="post-form--textarea"
            placeholder="飲んだ感想など..."
          />
        </div>

        <div className="post-form--form-group">
          <label>
            お酒を追加 <span className="required">*</span>
          </label>
          <div className="post-form--beverage-controls">
            <select
              value={selectedCategoryId || ""}
              onChange={(e) =>
                setSelectedCategoryId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="post-form--select"
            >
              <option value="">カテゴリーを選択</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addBeverage}
              disabled={!selectedCategoryId || beverages.length === 0}
              className="post-form--add-button"
            >
              追加
            </button>
          </div>

          {selectedBeverages.length > 0 && (
            <div className="post-form--beverage-list">
              {selectedBeverages.map((sb, index) => (
                <div key={index} className="post-form--beverage-item">
                  <select
                    value={sb.beverage.id}
                    onChange={(e) => {
                      const beverageId = Number(e.target.value);
                      const beverage = beverages.find(
                        (b) => b.id === beverageId
                      );
                      if (beverage) {
                        updateBeverage(index, beverageId, sb.amount);
                      }
                    }}
                    className="post-form--select"
                  >
                    {beverages.map((bev) => (
                      <option key={bev.id} value={bev.id}>
                        {bev.name}
                        {bev.alcohol_content
                          ? ` (${bev.alcohol_content}%)`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sb.amount || ""}
                    onChange={(e) =>
                      updateBeverage(
                        index,
                        sb.beverage.id,
                        Number(e.target.value) || 0
                      )
                    }
                    placeholder="量(ml)"
                    className="post-form--amount-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeBeverage(index)}
                    className="post-form--remove-button"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="post-form--error">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="post-form--submit-button"
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
