# PDF閲覧・編集アプリ

ブラウザ上でPDFを開き、閲覧・編集・操作ができるWebアプリケーションです。

## 機能一覧

### 📄 閲覧機能
- PDFファイルのアップロード（ドラッグ＆ドロップ対応）
- ページごとのレンダリング表示
- ページ送り（前へ / 次へ）・ページ番号直接入力でのジャンプ
- ズームイン / ズームアウト（25%〜400%対応）
- サムネイル一覧パネル（サイドバー）

### ✏️ 編集・操作機能
- **テキスト抽出**：選択ページまたは全ページのテキストを抽出してコピー可能
- **ページ回転**：90°単位での回転（右・左）
- **ページ削除**：不要なページの削除
- **PDFの結合**：複数PDFをアップロードして1つに結合
- **PDFの分割**：ページ範囲を指定して分割保存
- **テキスト注釈**：ページ上にテキストボックスを追加
- **ハイライト注釈**：テキストへの蛍光ペンマーカー

### 💾 出力機能
- 編集後のPDFをダウンロード
- 抽出テキストをTXTファイルとしてダウンロード

## 技術スタック

### フロントエンド
- React (Vite)
- PDF.js（Mozilla製、PDF描画用）
- Tailwind CSS
- react-dropzone

### バックエンド
- Python 3.11+
- FastAPI + Uvicorn
- pypdf（マージ・分割・回転・ページ削除）
- pdfplumber（テキスト抽出）
- reportlab（注釈付きPDF生成）

## プロジェクト構成

```
pdf-app/
├── backend/
│   ├── main.py              # FastAPIエントリーポイント
│   ├── routers/
│   │   ├── upload.py        # ファイルアップロードAPI
│   │   ├── pages.py         # ページ操作API（回転・削除）
│   │   ├── extract.py       # テキスト抽出API
│   │   ├── merge.py         # PDF結合API
│   │   ├── split.py         # PDF分割API
│   │   └── download.py      # ダウンロードAPI
│   ├── utils/
│   │   └── pdf_utils.py     # 共通処理
│   ├── temp/                # アップロード一時保存ディレクトリ
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── PDFViewer.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   ├── ThumbnailPanel.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   └── AnnotationLayer.jsx
│   │   └── api/
│   │       └── pdfApi.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## セットアップ・起動手順

### バックエンド起動

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### フロントエンド起動（別ターミナル）

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## APIエンドポイント

| メソッド | パス | 機能 |
|------|----|------|
| `POST` | `/api/upload` | PDFアップロード → `file_id`返却 |
| `GET` | `/api/pdf/{file_id}/info` | ページ数・メタデータ取得 |
| `GET` | `/api/pdf/{file_id}/page/{page_num}` | ページ画像（PNG）返却 |
| `GET` | `/api/pdf/{file_id}/thumbnail/{page_num}` | サムネイル画像返却 |
| `POST` | `/api/pdf/{file_id}/extract-text` | テキスト抽出 |
| `POST` | `/api/pdf/{file_id}/rotate` | ページ回転 |
| `POST` | `/api/pdf/{file_id}/delete-page` | ページ削除 |
| `POST` | `/api/merge` | 複数PDFを結合 |
| `POST` | `/api/pdf/{file_id}/split` | ページ範囲で分割 |
| `GET` | `/api/pdf/{file_id}/download` | 編集済みPDFをダウンロード |

## キーボードショートカット

- `←` / `→`：前後ページ移動
- `+` / `-`：ズームイン・アウト
- `Ctrl+S`：ダウンロード

## 注意事項

- アップロード上限：100MB
- 対応形式：PDFのみ
- 一時ファイルはセッション終了後に自動削除されます
