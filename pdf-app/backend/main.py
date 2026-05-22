"""FastAPI メインエントリーポイント"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, pages, extract, merge, split, download
from utils.pdf_utils import cleanup_old_files


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時: 古い一時ファイルを削除
    cleanup_old_files()

    # バックグラウンドで定期的にクリーンアップ
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(3600)  # 1時間ごと
            cleanup_old_files()

    task = asyncio.create_task(periodic_cleanup())
    yield
    task.cancel()


app = FastAPI(
    title="PDF閲覧・編集API",
    description="PDFの閲覧・編集・操作ができるRESTful API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(pages.router, prefix="/api", tags=["Pages"])
app.include_router(extract.router, prefix="/api", tags=["Extract"])
app.include_router(merge.router, prefix="/api", tags=["Merge"])
app.include_router(split.router, prefix="/api", tags=["Split"])
app.include_router(download.router, prefix="/api", tags=["Download"])


@app.get("/")
async def root():
    return {"message": "PDF閲覧・編集API", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
