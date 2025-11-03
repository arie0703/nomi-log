import { type BeverageAmount } from "../types";

/**
 * アルコール摂取量を計算する
 * 計算式: 飲んだ容量(ml) * アルコール度数(%) * 0.8
 * 
 * @param beverages 飲んだお酒のリスト
 * @returns アルコール摂取量(ml)
 */
export function calculateAlcoholIntake(beverages: BeverageAmount[]): number {
  return beverages.reduce((total, beverage) => {
    if (beverage.alcohol_content != null && beverage.alcohol_content > 0) {
      // 飲んだ容量(ml) * アルコール度数(%) * 0.8
      const intake = beverage.amount * (beverage.alcohol_content / 100) * 0.8;
      return total + intake;
    }
    return total;
  }, 0);
}

