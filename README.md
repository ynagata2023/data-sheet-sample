# Data Sheet Sample

React + TypeScript で作成した **動的データシートアプリ** のサンプルプロジェクトです。  
`react-datasheet-grid` を使用して、行ごとの入力制限やバリデーションを切り替えられます。

---

## 特徴

- ターゲットIDごとに異なるカラム構成と入力制限を設定可能
- `Zod` を利用したリアルタイムバリデーション
- 行ごとのエラーを一覧で表示
- データのリセット機能付き

## セットアップ

```bash
# リポジトリをクローン
git clone <リポジトリURL>
cd data-sheet-sample

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
