"""PDF結合API"""
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import pypdf
from utils.pdf_utils import save_temp_file, MAX_FILE_SIZE

router = APIRouter()


@router.post("/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """複数のPDFを結合して1つのPDFにする"""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="結合するには2つ以上のPDFが必要です")

    if len(files) > 20:
        raise HTTPException(status_code=400, detail="一度に結合できるファイルは最大20個です")

    writer = pypdf.PdfWriter()
    total_size = 0

    for i, upload_file in enumerate(files):
        if not upload_file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"ファイル {upload_file.filename} はPDFではありません"
            )

        content = await upload_file.read()
        total_size += len(content)

        if total_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="合計ファイルサイズが100MBを超えています")

        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=400,
                detail=f"ファイル {upload_file.filename} は有効なPDFではありません"
            )

        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            if reader.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail=f"ファイル {upload_file.filename} はパスワード付きPDFです"
                )
            for page in reader.pages:
                writer.add_page(page)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"ファイル {upload_file.filename} の読み込みに失敗しました: {str(e)}"
            )

    try:
        buf = io.BytesIO()
        writer.write(buf)
        merged_content = buf.getvalue()
        file_id = save_temp_file(merged_content)

        return {
            "success": True,
            "file_id": file_id,
            "page_count": len(writer.pages),
            "file_size": len(merged_content),
            "message": f"{len(files)}個のPDFを結合しました",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF結合に失敗しました: {str(e)}")
