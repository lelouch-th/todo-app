"""PDFアップロードAPI"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from utils.pdf_utils import save_temp_file, MAX_FILE_SIZE

router = APIRouter()


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """PDFファイルをアップロードしてfile_idを返す"""
    # ファイル形式チェック
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")

    # ファイル読み込み
    content = await file.read()

    # ファイルサイズチェック
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="ファイルサイズが100MBを超えています")

    # PDFマジックバイト確認
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="有効なPDFファイルではありません")

    # パスワード付きPDFチェック
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            raise HTTPException(status_code=400, detail="パスワード付きPDFはサポートされていません")
        page_count = len(reader.pages)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDFの読み込みに失敗しました: {str(e)}")

    # 一時ファイルに保存
    file_id = save_temp_file(content)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "page_count": page_count,
        "file_size": len(content),
    }
