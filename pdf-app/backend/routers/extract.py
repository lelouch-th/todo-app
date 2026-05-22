"""テキスト抽出API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import pdfplumber
from utils.pdf_utils import get_file_path, file_exists

router = APIRouter()


class ExtractTextRequest(BaseModel):
    pages: Optional[List[int]] = None  # Noneの場合は全ページ抽出


@router.post("/pdf/{file_id}/extract-text")
async def extract_text(file_id: str, req: ExtractTextRequest = None):
    """テキストを抽出する"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    if req is None:
        req = ExtractTextRequest()

    try:
        path = get_file_path(file_id)
        result = {}
        full_text_parts = []

        with pdfplumber.open(str(path)) as pdf:
            total_pages = len(pdf.pages)

            if req.pages:
                # 指定ページのみ抽出
                for page_num in req.pages:
                    if page_num < 1 or page_num > total_pages:
                        continue
                    page = pdf.pages[page_num - 1]
                    text = page.extract_text() or ""
                    result[page_num] = text
                    full_text_parts.append(f"=== ページ {page_num} ===\n{text}")
            else:
                # 全ページ抽出
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    result[i + 1] = text
                    full_text_parts.append(f"=== ページ {i + 1} ===\n{text}")

        full_text = "\n\n".join(full_text_parts)

        return {
            "success": True,
            "total_pages": total_pages,
            "extracted_pages": list(result.keys()),
            "text_by_page": result,
            "full_text": full_text,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"テキストの抽出に失敗しました: {str(e)}")
