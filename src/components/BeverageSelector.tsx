import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Category, type Beverage } from "../types";
import "../assets/styles/post-form.scss";

export interface BeverageSelection {
  beverage: Beverage;
  amount: number;
}

interface BeverageSelectorProps {
  selectedBeverages: BeverageSelection[];
  onBeveragesChange: (beverages: BeverageSelection[]) => void;
  onError?: (error: string | null) => void;
}

/**
 * カテゴリー選択 → お酒選択方式のBeverageSelector（現状の方式）
 */
export default function BeverageSelector({
  selectedBeverages,
  onBeveragesChange,
  onError,
}: BeverageSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [beverages, setBeverages] = useState<Beverage[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await invoke<Category[]>("get_categories");
        setCategories(result);
      } catch (err) {
        console.error("Error loading categories:", err);
        onError?.("カテゴリーの読み込みに失敗しました");
      }
    };

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadBeveragesByCategory = async (categoryId: number) => {
      try {
        const result = await invoke<Beverage[]>("get_beverages_by_category", {
          categoryId,
        });
        setBeverages(result);
        onError?.(null);
      } catch (err) {
        console.error("Error loading beverages:", err);
        onError?.("お酒の読み込みに失敗しました");
      }
    };

    if (selectedCategoryId) {
      loadBeveragesByCategory(selectedCategoryId);
    } else {
      setBeverages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const addBeverage = () => {
    if (!selectedCategoryId) {
      onError?.("カテゴリーを選択してください");
      return;
    }
    if (beverages.length === 0) {
      onError?.("このカテゴリーにはお酒が登録されていません");
      return;
    }
    // 最初のお酒をデフォルトで選択
    const firstBeverage = beverages[0];
    onBeveragesChange([
      ...selectedBeverages,
      { beverage: firstBeverage, amount: 0 },
    ]);
    onError?.(null);
  };

  const removeBeverage = (index: number) => {
    onBeveragesChange(selectedBeverages.filter((_, i) => i !== index));
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
      onBeveragesChange(newBeverages);
    }
  };

  return (
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
                  const beverage = beverages.find((b) => b.id === beverageId);
                  if (beverage) {
                    updateBeverage(index, beverageId, sb.amount);
                  }
                }}
                className="post-form--select"
              >
                {beverages.map((bev) => (
                  <option key={bev.id} value={bev.id}>
                    {bev.name}
                    {bev.alcohol_content ? ` (${bev.alcohol_content}%)` : ""}
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
  );
}
