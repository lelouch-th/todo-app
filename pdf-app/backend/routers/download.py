"""ダウンロードAPI"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from utils.pdf_utils import get_file_path, file_exists

router = APIRouter()


@router.get("/pdf/{file_id}/download")
async def download_pdf(file_id: str, filename: str = "edited.pdf"):
    """編集済みPDFをダウンロード"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    path = get_file_path(file_id)

    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=filename,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        }
    )
