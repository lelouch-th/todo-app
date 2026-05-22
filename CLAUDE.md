## プロジェクト概要
TODOアプリ（シングルHTMLファイル構成）

## ファイル構成
- `todo.html` — メインファイル（TODOアプリ本体）
- `pdf-app/` — PDFビューア・編集アプリ（別プロジェクト）
  - `pdf-app/frontend/` — React + Vite フロントエンド
  - `pdf-app/backend/` — Python（FastAPI）バックエンド

## 技術スタック（todo.html）
- **フロントエンド**: 純粋なHTML / CSS / JavaScript（フレームワークなし）
- **バックエンド**: Firebase Firestore（リアルタイムDB）
- **Firebase プロジェクト**: `todo-app-3ccea`

## 現在の作業状況

### ✅ 完了したこと
- TODOアプリの画面作成
- タスクの追加・削除・完了トグル機能
- Firebase Firestore によるデータ永続化・リアルタイム同期
- モーダル形式でのタスク追加UI（FABボタンで開く）
- フィルター機能（すべて / 未完了 / 完了）
- 期限日設定機能（期限超過・当日・近日中の色分け表示）
- モバイル対応レスポンシブデザイン（iOS safe-area 対応）
- PDFビューア・編集アプリの実装（`pdf-app/` ディレクトリ）

### 🚧 作業中
- なし

### 📋 次にやること
- **Googleログイン機能の追加**（Firebase Authentication で実装予定）
  - ユーザーごとにタスクを分離する必要あり（Firestoreのパス変更も伴う）
- UIの調整・改善
