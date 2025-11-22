import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type CreatePostRequest, type PostWithBeverages, type Beverage } from "../types";
import { type BeverageSelection } from "./BeverageSelector";
import BeverageSelectorFullList from "./BeverageSelectorFullList";
// import BeverageSelector from "./BeverageSelector"; // 現状方式を使う場合はこちらを使用
import "../assets/styles/post-form.scss";

interface PostFormProps {
  onPostCreated: () => void;
  editingPost?: PostWithBeverages | null;
  onPostUpdated?: () => void;
  onCancel?: () => void;
}

export default function PostForm({ 
  onPostCreated, 
  editingPost, 
  onPostUpdated,
  onCancel 
}: PostFormProps) {
  const [allBeverages, setAllBeverages] = useState<Beverage[]>([]);
  const [date, setDate] = useState(() => {
    // デフォルトは今日の日付
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [comment, setComment] = useState("");
  const [selectedBeverages, setSelectedBeverages] = useState<
    BeverageSelection[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 全てのお酒を読み込む（編集時にbeverage_idからBeverageオブジェクトに変換するため）
  useEffect(() => {
    const loadAllBeverages = async () => {
      try {
        const result = await invoke<Beverage[]>("get_beverages");
        setAllBeverages(result);
      } catch (err) {
        console.error("Error loading beverages:", err);
      }
    };
    loadAllBeverages();
  }, []);

  // 編集モードの場合、既存の投稿データをフォームに読み込む
  useEffect(() => {
    if (editingPost) {
      setDate(editingPost.date);
      setComment(editingPost.comment || "");
      
      // BeverageAmountからBeverageSelectionに変換
      const beverages: BeverageSelection[] = editingPost.beverages.map((ba) => {
        const beverage = allBeverages.find((b) => b.id === ba.beverage_id);
        if (!beverage) {
          // お酒が見つからない場合は、最小限の情報で作成
          return {
            beverage: {
              id: ba.beverage_id,
              name: ba.beverage_name,
              alcohol_content: ba.alcohol_content,
              category_id: 0, // 一時的な値
            },
            amount: ba.amount,
          };
        }
        return {
          beverage,
          amount: ba.amount,
        };
      });
      setSelectedBeverages(beverages);
    } else {
      // 新規作成モードの場合、フォームをリセット
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);
      setComment("");
      setSelectedBeverages([]);
    }
  }, [editingPost, allBeverages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date.trim()) {
      setError("日付を入力してください");
      return;
    }

    // 日付の形式をチェック（YYYY-MM-DD）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      setError("日付はYYYY-MM-DD形式で入力してください");
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
        date: date.trim(),
        comment: comment.trim() || undefined,
        beverages: beveragesWithAmount.map((sb) => ({
          beverage_id: sb.beverage.id,
          amount: sb.amount,
        })),
      };

      if (editingPost) {
        // 編集モード
        await invoke("update_post", { id: editingPost.id, request });
        setError(null);
        onPostUpdated?.();
      } else {
        // 新規作成モード
        await invoke("create_post", { request });
        // フォームをリセット
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        setDate(`${year}-${month}-${day}`);
        setComment("");
        setSelectedBeverages([]);
        setError(null);
        onPostCreated();
      }
    } catch (err) {
      const errorMessage = editingPost 
        ? "投稿の更新に失敗しました" 
        : "投稿の作成に失敗しました";
      setError(err instanceof Error ? err.message : errorMessage);
      console.error(`Error ${editingPost ? "updating" : "creating"} post:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form">
      <h2 className="post-form--title">{editingPost ? "投稿を編集" : "新規投稿"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="post-form--form-group">
          <label>
            日付 <span className="required">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="post-form--input"
            required
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

        {/* 全件プルダウン方式（デフォルト） */}
        <BeverageSelectorFullList
          selectedBeverages={selectedBeverages}
          onBeveragesChange={setSelectedBeverages}
          onError={setError}
        />
        {/* 現状方式を使う場合は以下のコメントを外す */}
        {/* <BeverageSelector
          selectedBeverages={selectedBeverages}
          onBeveragesChange={setSelectedBeverages}
          onError={setError}
        /> */}

        {error && <div className="post-form--error">{error}</div>}

        <div className="post-form--actions">
          {editingPost && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="post-form--cancel-button"
              disabled={loading}
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="post-form--submit-button"
          >
            {loading 
              ? (editingPost ? "更新中..." : "投稿中...") 
              : (editingPost ? "更新する" : "投稿する")}
          </button>
        </div>
      </form>
    </div>
  );
}
