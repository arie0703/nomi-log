import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { MonthlyAlcoholIntake } from "../types";
import AlcoholGauge from "./AlcoholGauge";
import "../assets/styles/alcohol-intake-view.scss";

export default function AlcoholIntakeView() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [data, setData] = useState<MonthlyAlcoholIntake | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<MonthlyAlcoholIntake>(
        "get_monthly_alcohol_intake",
        {
          year,
          month,
        }
      );
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "アルコール摂取量の取得に失敗しました"
      );
      console.error("Error loading alcohol intake:", err);
    } finally {
      setLoading(false);
    }
  };

  // 年と月の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="alcohol-intake-view">
      <h2 className="alcohol-intake-view--title">飲酒データ</h2>

      {/* 年月選択 */}
      <div className="alcohol-intake-view--selector">
        <div className="alcohol-intake-view--selector-item">
          <label>年</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="alcohol-intake-view--select"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        </div>
        <div className="alcohol-intake-view--selector-item">
          <label>月</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="alcohol-intake-view--select"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alcohol-intake-view--error">エラー: {error}</div>
      )}

      {loading ? (
        <div className="alcohol-intake-view--loading">読み込み中...</div>
      ) : data ? (
        <div className="alcohol-intake-view--content">
          <div className="alcohol-intake-view--stat-item">
            <div className="alcohol-intake-view--stat-label">
              月のアルコール摂取総量
            </div>
            <div className="alcohol-intake-view--stat-value">
              {data.total_intake.toFixed(1)} ml
            </div>
          </div>

          <div className="alcohol-intake-view--stat-item">
            <div className="alcohol-intake-view--stat-label">
              1日当たりの平均摂取量
            </div>
            <div className="alcohol-intake-view--stat-gauge">
              <AlcoholGauge intake={data.average_per_day} />
            </div>
          </div>

          <div className="alcohol-intake-view--stat-item">
            <div className="alcohol-intake-view--stat-label">飲酒した日数</div>
            <div className="alcohol-intake-view--stat-value">
              {data.drinking_days} 日
            </div>
          </div>
        </div>
      ) : (
        <div className="alcohol-intake-view--empty">データがありません</div>
      )}
    </div>
  );
}
