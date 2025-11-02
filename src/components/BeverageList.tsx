import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Beverage } from "../types";
import BeverageForm from "./BeverageForm";
import "../assets/styles/beverage-list.scss";

interface BeverageListProps {
  beverages: Beverage[];
  loading: boolean;
  onBeverageDeleted: () => void;
  onBeverageSaved: () => void;
}

export default function BeverageList({
  beverages,
  loading,
  onBeverageDeleted,
  onBeverageSaved,
}: BeverageListProps) {
  const [editingBeverage, setEditingBeverage] = useState<Beverage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("このお酒を削除しますか？")) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      await invoke("delete_beverage", { id });
      onBeverageDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "お酒の削除に失敗しました");
      console.error("Error deleting beverage:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (beverage: Beverage) => {
    setEditingBeverage(beverage);
    setShowForm(true);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingBeverage(null);
    onBeverageSaved();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBeverage(null);
  };

  if (loading) {
    return <div className="beverage-list--loading">読み込み中...</div>;
  }

  return (
    <div className="beverage-list">
      <div className="beverage-list--header">
        <h2 className="beverage-list--title">
          お酒一覧 ({beverages.length}件)
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="beverage-list--new-button"
        >
          {showForm ? "一覧に戻る" : "新規登録"}
        </button>
      </div>

      {error && <div className="beverage-list--error">エラー: {error}</div>}

      {showForm && (
        <BeverageForm
          beverage={editingBeverage}
          onBeverageSaved={handleFormSaved}
          onCancel={handleFormCancel}
        />
      )}

      {beverages.length === 0 ? (
        <div className="beverage-list--empty">まだお酒が登録されていません</div>
      ) : (
        <div className="beverage-list--table-wrapper">
          <table className="beverage-list--table">
            <thead>
              <tr>
                <th>名称</th>
                <th>アルコール度数</th>
                <th>カテゴリー</th>
                <th className="beverage-list--th-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {beverages.map((beverage) => (
                <tr key={beverage.id}>
                  <td>{beverage.name}</td>
                  <td>
                    {beverage.alcohol_content !== null &&
                    beverage.alcohol_content !== undefined
                      ? `${beverage.alcohol_content}%`
                      : "-"}
                  </td>
                  <td>{beverage.category_name || "-"}</td>
                  <td>
                    <div className="beverage-list--actions">
                      <button
                        onClick={() => handleEdit(beverage)}
                        className="beverage-list--edit-button"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(beverage.id)}
                        disabled={deletingId === beverage.id}
                        className="beverage-list--delete-button"
                      >
                        {deletingId === beverage.id ? "削除中..." : "削除"}
                      </button>
                    </div>
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
