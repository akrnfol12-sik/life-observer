# 生活観測

日々の行動・お金・メンタル・体調を「良い / 悪い」で裁くのではなく、まず観測するための自分専用Personal OSです。

未記録は失敗ではなく「未観測」として扱います。SNS、ゲーム、AVなどの逃避行動も責める対象ではなく、次の判断に使う生活情報として記録します。読書、勉強、大学課題、学祭、インターンなどの積み上げも同じ画面で見えるようにします。

## v2の方向性

- ホーム画面を生活のコックピットとして整理
- 今日の予定、現在時刻、次の予定、予定までの残り時間、空き時間帯を表示
- お金、観測状態、逃避時間、積み上げ時間、メンタルをホームで確認
- Google Calendar連携を想定した差し替え可能な予定取得層を追加
- LocalStorage依存を `storage.js` に集約し、将来のFirebase / Supabase移行に備える
- スマホでの閲覧・入力・下ナビ操作を前提にUIを調整

## 公開URL

GitHub Pagesで公開する想定です。

https://akrnfol12-sik.github.io/life-observer/

`main` ブランチにpushすると、GitHub Actions経由でPagesへ反映されます。

## ファイル構成

- `index.html`: 画面のHTML構造
- `styles.css`: 既存のスマホ向けUIとホームコックピットのスタイル
- `app.js` / `app-*.js`: 画面描画、入力処理、集計ロジック
- `storage.js`: LocalStorageアダプターと保存キー定義
- `calendar.js`: Google Calendar連携を想定した予定取得モジュール
- `manifest.webmanifest`: スマホでホーム画面追加しやすくするための設定
- `.github/workflows/pages.yml`: GitHub Pagesへの自動公開設定

## 現在の機能

- 行動記録
- 逃避行動の観測
- 積み上げ時間の記録
- カテゴリ管理
- 履歴表示
- 資産・支出管理
- メンタル・体調記録
- 日次レビュー
- JSONバックアップ / 復元
- 今日の予定コックピット

## Calendar連携について

現時点ではバックエンドやGoogle OAuthを導入せず、`calendar.js` の「予定メモ」で予定UIを動かしています。

将来Google Calendar APIへ接続する場合は、`window.lifeObserverCalendarProvider` に以下のようなプロバイダーを渡す想定です。

```js
window.lifeObserverCalendarProvider = {
  sourceLabel: "Google Calendar",
  async getTodayEvents(date) {
    return [
      {
        id: "event-id",
        title: "予定名",
        start: "2026-08-04T13:00:00+09:00",
        end: "2026-08-04T14:00:00+09:00",
        location: "",
        calendarName: "Personal"
      }
    ];
  }
};
```

## v2 UI改善メモ

ホーム画面は、予定、今の状態、お金、クイック記録の順に並べています。最初に「次の予定」と「今の一手」が見えるようにし、総資産や支出は判断材料として少し下に置いています。

他の自己管理アプリの良い点を参考にし、Todoistのように今日に集中する、Google Calendarのように予定の流れを見る、Daylioのように入力を軽くする、Streaks系アプリのように状態を一目で把握する方向で調整しています。

## 使用技術

- HTML
- CSS
- JavaScript
- LocalStorage

## 今後追加したいもの

- Google OAuth / Calendar API接続
- GitHub開発状況の表示
- メール返信候補の表示
- AIによる今日の優先事項
- Firebase / Supabase同期
- グラフ表示
