import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Category, type Beverage } from "../types";
import { type BeverageSelection } from "./BeverageSelector";
import "../assets/styles/post-form.scss";

interface BeverageSelectorFullListProps {
  selectedBeverages: BeverageSelection[];
  onBeveragesChange: (beverages: BeverageSelection[]) => void;
  onError?: (error: string | null) => void;
}

/**
 * 全件プルダウン方式のBeverageSelector（カテゴリーでグループ化）
 */
export default function BeverageSelectorFullList({
  selectedBeverages,
  onBeveragesChange,
  onError,
}: BeverageSelectorFullListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allBeverages, setAllBeverages] = useState<Beverage[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [selectedBeverageId, setSelectedBeverageId] = useState<number | null>(
    null
  );

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

    const loadAllBeverages = async () => {
      try {
        const result = await invoke<Beverage[]>("get_beverages");
        setAllBeverages(result);
        onError?.(null);
      } catch (err) {
        console.error("Error loading beverages:", err);
        onError?.("お酒の読み込みに失敗しました");
      }
    };

    loadCategories();
    loadAllBeverages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // カテゴリーでフィルタリングしたお酒リスト
  const filteredBeverages = useMemo(() => {
    if (!filterCategoryId) {
      return allBeverages;
    }
    return allBeverages.filter((b) => b.category_id === filterCategoryId);
  }, [allBeverages, filterCategoryId]);

  // カテゴリーでグループ化したお酒リスト（フィルタリング用）
  const beveragesByCategory = useMemo(() => {
    const grouped: { [key: number]: Beverage[] } = {};
    filteredBeverages.forEach((beverage) => {
      if (!grouped[beverage.category_id]) {
        grouped[beverage.category_id] = [];
      }
      grouped[beverage.category_id].push(beverage);
    });
    return grouped;
  }, [filteredBeverages]);

  // 全カテゴリーでグループ化したお酒リスト（選択済みリスト表示用）
  const allBeveragesByCategory = useMemo(() => {
    const grouped: { [key: number]: Beverage[] } = {};
    allBeverages.forEach((beverage) => {
      if (!grouped[beverage.category_id]) {
        grouped[beverage.category_id] = [];
      }
      grouped[beverage.category_id].push(beverage);
    });
    return grouped;
  }, [allBeverages]);

  // カテゴリーの表示順でソート（フィルタリング用）
  const sortedCategoryIds = useMemo(() => {
    return Object.keys(beveragesByCategory)
      .map(Number)
      .sort((a, b) => {
        const catA = categories.find((c) => c.id === a);
        const catB = categories.find((c) => c.id === b);
        const orderA = catA?.display_order ?? 0;
        const orderB = catB?.display_order ?? 0;
        return orderA - orderB;
      });
  }, [beveragesByCategory, categories]);

  // カテゴリーの表示順でソート（全カテゴリー用）
  const sortedAllCategoryIds = useMemo(() => {
    return Object.keys(allBeveragesByCategory)
      .map(Number)
      .sort((a, b) => {
        const catA = categories.find((c) => c.id === a);
        const catB = categories.find((c) => c.id === b);
        const orderA = catA?.display_order ?? 0;
        const orderB = catB?.display_order ?? 0;
        return orderA - orderB;
      });
  }, [allBeveragesByCategory, categories]);

  const addBeverage = () => {
    if (!selectedBeverageId) {
      onError?.("お酒を選択してください");
      return;
    }
    const beverage = allBeverages.find((b) => b.id === selectedBeverageId);
    if (!beverage) {
      onError?.("選択したお酒が見つかりません");
      return;
    }
    onBeveragesChange([...selectedBeverages, { beverage, amount: 0 }]);
    setSelectedBeverageId(null);
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
    const beverage = allBeverages.find((b) => b.id === beverageId);
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
          value={filterCategoryId || ""}
          onChange={(e) => {
            const categoryId = e.target.value ? Number(e.target.value) : null;
            setFilterCategoryId(categoryId);
            setSelectedBeverageId(null);
          }}
          className="post-form--select"
        >
          <option value="">すべてのカテゴリー</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={selectedBeverageId || ""}
          onChange={(e) =>
            setSelectedBeverageId(
              e.target.value ? Number(e.target.value) : null
            )
          }
          className="post-form--select"
        >
          <option value="">お酒を選択</option>
          {sortedCategoryIds.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId);
            const beverages = beveragesByCategory[categoryId];
            return (
              <optgroup key={categoryId} label={category?.name || ""}>
                {beverages.map((bev) => (
                  <option key={bev.id} value={bev.id}>
                    {bev.name}
                    {bev.alcohol_content ? ` (${bev.alcohol_content}%)` : ""}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
        <button
          type="button"
          onClick={addBeverage}
          disabled={!selectedBeverageId}
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
                  updateBeverage(index, beverageId, sb.amount);
                }}
                className="post-form--select"
              >
                {sortedAllCategoryIds.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  const beverages = allBeveragesByCategory[categoryId];
                  return (
                    <optgroup key={categoryId} label={category?.name || ""}>
                      {beverages.map((bev) => (
                        <option key={bev.id} value={bev.id}>
                          {bev.name}
                          {bev.alcohol_content
                            ? ` (${bev.alcohol_content}%)`
                            : ""}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
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
