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

## 使用方法

- 各行の targetId を切り替えると、対応するカラムの入力制限が変化
- 無効な値を入力すると、エラーが表に表示されます
- リセットボタン で初期データに戻せます
- 新しい行は Addボタン で追加可能

## カスタマイズ

- カラム定義やバリデーションは columnData と schemasForTargetId で管理
- バリデーションルールは Zod の refine を利用して柔軟に設定可能
- デフォルト値や範囲制限も ColumnValue に設定