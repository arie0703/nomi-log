import "../assets/styles/calendar-view.scss";

interface CalendarViewProps {
  year: number;
  month: number;
  drinkingDates: string[];
}

export default function CalendarView({
  year,
  month,
  drinkingDates,
}: CalendarViewProps) {
  // 曜日のラベル（日曜日から始まる）
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // 月の日数を取得
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // 月の最初の日の曜日を取得（0: 日曜日, 1: 月曜日, ...）
  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month - 1, 1).getDay();
  };

  // 今日の日付かどうかをチェック
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() + 1 === month &&
      today.getDate() === day
    );
  };

  // 飲酒した日かどうかをチェック
  const isDrinkingDay = (day: number): boolean => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return drinkingDates.includes(dateStr);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // カレンダーのセルを生成
  const calendarCells: (number | null)[] = [];

  // 月の最初の日までの空セルを追加
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }

  // 日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // 週の行に分割
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  // 最後の週が7日未満の場合は空セルで埋める
  const lastWeek = weeks[weeks.length - 1];
  while (lastWeek.length < 7) {
    lastWeek.push(null);
  }

  return (
    <div className="calendar-view">
      <div className="calendar-view--header">
        <h3 className="calendar-view--title">
          {year}年{month}月のカレンダー
        </h3>
      </div>

      <div className="calendar-view--grid">
        {/* 曜日ヘッダー */}
        <div className="calendar-view--weekdays">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`calendar-view--weekday ${
                index === 0 ? "calendar-view--weekday-sunday" : ""
              } ${index === 6 ? "calendar-view--weekday-saturday" : ""}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー本体 */}
        <div className="calendar-view--body">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-view--week">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`calendar-view--day ${
                    day === null ? "calendar-view--day-empty" : ""
                  } ${day !== null && isToday(day) ? "calendar-view--day-today" : ""} ${
                    day !== null && isDrinkingDay(day) ? "calendar-view--day-drinking" : ""
                  } ${dayIndex === 0 ? "calendar-view--day-sunday" : ""} ${
                    dayIndex === 6 ? "calendar-view--day-saturday" : ""
                  }`}
                >
                  {day !== null && (
                    <>
                      <span className="calendar-view--day-number">{day}</span>
                      {isDrinkingDay(day) && (
                        <span className="calendar-view--day-indicator">🍺</span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="calendar-view--legend">
        <div className="calendar-view--legend-item">
          <span className="calendar-view--legend-indicator calendar-view--legend-drinking"></span>
          <span>飲酒した日</span>
        </div>
        <div className="calendar-view--legend-item">
          <span className="calendar-view--legend-indicator calendar-view--legend-today"></span>
          <span>今日</span>
        </div>
      </div>
    </div>
  );
}
