import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type CreatePostRequest } from "../types";
import { type BeverageSelection } from "./BeverageSelector";
import BeverageSelectorFullList from "./BeverageSelectorFullList";
// import BeverageSelector from "./BeverageSelector"; // 現状方式を使う場合はこちらを使用
import "../assets/styles/post-form.scss";

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
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
