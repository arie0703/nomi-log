import "../assets/styles/alcohol-gauge.scss";

interface AlcoholGaugeProps {
  /** アルコール摂取量(ml) */
  intake: number;
  /** 最大値(ml)。デフォルトは20ml */
  max?: number;
}

export default function AlcoholGauge({ intake, max = 20 }: AlcoholGaugeProps) {
  // ゲージの充填率を計算（最大値を超える場合は100%）
  const fillPercentage = Math.min((intake / max) * 100, 100);
  const isFull = fillPercentage >= 100;

  return (
    <div className="alcohol-gauge">
      <div className="alcohol-gauge--container">
        {/* 瓶の形状のゲージ */}
        <div className="alcohol-gauge--bottle">
          {/* 充填部分 */}
          <div
            className={`alcohol-gauge--fill ${isFull ? "full" : ""}`}
            style={{
              height: `${fillPercentage}%`,
            }}
          />
        </div>
      </div>
      {/* 摂取量表示 */}
      <div className="alcohol-gauge--label">{intake.toFixed(1)} ml</div>
    </div>
  );
}
