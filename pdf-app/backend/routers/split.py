"""PDF分割API"""
import io
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Tuple
import pypdf
from utils.pdf_utils import get_file_path, file_exists, save_temp_file

router = APIRouter()


class PageRange(BaseModel):
    start: int
    end: int


class SplitRequest(BaseModel):
    ranges: List[PageRange]


@router.post("/pdf/{file_id}/split")
async def split_pdf(file_id: str, req: SplitRequest):
    """PDFをページ範囲で分割する"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    if not req.ranges:
        raise HTTPException(status_code=400, detail="ページ範囲が指定されていません")

    try:
        path = get_file_path(file_id)
        reader = pypdf.PdfReader(str(path))
        total_pages = len(reader.pages)

        result_files = []

        for i, page_range in enumerate(req.ranges):
            if page_range.start < 1 or page_range.end > total_pages:
                raise HTTPException(
                    status_code=400,
                    detail=f"範囲{i+1}: ページ番号が無効です（1〜{total_pages}の範囲で指定してください）"
                )
            if page_range.start > page_range.end:
                raise HTTPException(
                    status_code=400,
                    detail=f"範囲{i+1}: 開始ページが終了ページより大きいです"
                )

            writer = pypdf.PdfWriter()
            for page_num in range(page_range.start - 1, page_range.end):
                writer.add_page(reader.pages[page_num])

            buf = io.BytesIO()
            writer.write(buf)
            split_file_id = save_temp_file(buf.getvalue())

            result_files.append({
                "file_id": split_file_id,
                "range": f"p{page_range.start}-p{page_range.end}",
                "page_count": page_range.end - page_range.start + 1,
                "file_size": len(buf.getvalue()),
            })

        return {
            "success": True,
            "split_count": len(result_files),
            "files": result_files,
            "message": f"{len(result_files)}個のPDFに分割しました",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF分割に失敗しました: {str(e)}")
