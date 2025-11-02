import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Category, Beverage } from "../types";
import "../assets/styles/beverage-form.scss";

interface BeverageFormProps {
  beverage?: Beverage | null;
  onBeverageSaved: () => void;
  onCancel?: () => void;
}

export default function BeverageForm({
  beverage,
  onBeverageSaved,
  onCancel,
}: BeverageFormProps) {
  const [name, setName] = useState("");
  const [alcoholContent, setAlcoholContent] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    if (beverage) {
      setName(beverage.name);
      setAlcoholContent(beverage.alcohol_content?.toString() || "");
      setCategoryId(beverage.category_id);
    }
  }, [beverage]);

  const loadCategories = async () => {
    try {
      const result = await invoke<Category[]>("get_categories");
      setCategories(result);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("お酒の名称を入力してください");
      return;
    }

    if (categoryId === null) {
      setError("カテゴリーを選択してください");
      return;
    }

    const alcoholContentValue =
      alcoholContent.trim() === "" ? undefined : parseFloat(alcoholContent);

    if (
      alcoholContentValue !== undefined &&
      (isNaN(alcoholContentValue) ||
        alcoholContentValue < 0 ||
        alcoholContentValue > 100)
    ) {
      setError("アルコール度数は0〜100の数値を入力してください");
      return;
    }

    try {
      setLoading(true);
      const request = {
        name: name.trim(),
        alcohol_content: alcoholContentValue,
        category_id: categoryId,
      };

      if (beverage) {
        // 更新
        await invoke("update_beverage", {
          id: beverage.id,
          request,
        });
      } else {
        // 作成
        await invoke("create_beverage", { request });
      }

      // フォームをリセット
      setName("");
      setAlcoholContent("");
      setCategoryId(null);
      setError(null);
      onBeverageSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : beverage
          ? "お酒の更新に失敗しました"
          : "お酒の作成に失敗しました"
      );
      console.error("Error saving beverage:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="beverage-form">
      <h3 className="beverage-form--title">
        {beverage ? "お酒を編集" : "新規お酒登録"}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="beverage-form--form-group">
          <label>
            名称 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="beverage-form--input"
            placeholder="例: アサヒスーパードライ"
          />
        </div>

        <div className="beverage-form--form-group">
          <label>アルコール度数 (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={alcoholContent}
            onChange={(e) => setAlcoholContent(e.target.value)}
            className="beverage-form--input"
            placeholder="例: 5.0"
          />
        </div>

        <div className="beverage-form--form-group">
          <label>
            カテゴリー <span className="required">*</span>
          </label>
          <select
            value={categoryId || ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : null)
            }
            className="beverage-form--select"
          >
            <option value="">カテゴリーを選択</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="beverage-form--error">{error}</div>}

        <div className="beverage-form--buttons">
          <button
            type="submit"
            disabled={loading}
            className="beverage-form--submit-button"
          >
            {loading
              ? beverage
                ? "更新中..."
                : "登録中..."
              : beverage
              ? "更新"
              : "登録"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="beverage-form--cancel-button"
            >
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
