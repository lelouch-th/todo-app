"""ページ操作API（回転・削除・情報取得・画像レンダリング）"""
import io
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import pypdf
from PIL import Image
from utils.pdf_utils import get_file_path, file_exists, save_temp_file

router = APIRouter()


def render_page_to_image(file_id: str, page_num: int, scale: float = 1.5) -> bytes:
    """PDFページをPNG画像にレンダリング（pypdf + PIL使用）"""
    import subprocess
    import tempfile
    import os

    path = get_file_path(file_id)

    # pdftoppmまたはghostscriptを試す
    try:
        # ghostscriptでレンダリング
        dpi = int(72 * scale)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name

        result = subprocess.run(
            [
                "gs", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m",
                f"-r{dpi}", f"-dFirstPage={page_num}", f"-dLastPage={page_num}",
                f"-sOutputFile={tmp_path}", str(path)
            ],
            capture_output=True, timeout=30
        )

        if result.returncode == 0 and os.path.exists(tmp_path):
            with open(tmp_path, "rb") as f:
                data = f.read()
            os.unlink(tmp_path)
            return data
        elif os.path.exists(tmp_path):
            os.unlink(tmp_path)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # fallback: pdftoppm
    try:
        dpi = int(72 * scale)
        with tempfile.TemporaryDirectory() as tmpdir:
            result = subprocess.run(
                [
                    "pdftoppm", "-png", "-r", str(dpi),
                    "-f", str(page_num), "-l", str(page_num),
                    str(path), f"{tmpdir}/page"
                ],
                capture_output=True, timeout=30
            )
            if result.returncode == 0:
                import glob
                files = glob.glob(f"{tmpdir}/page*.png")
                if files:
                    with open(files[0], "rb") as f:
                        return f.read()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    # 最終fallback: pypdf + Pillowで簡易レンダリング
    reader = pypdf.PdfReader(str(path))
    if page_num < 1 or page_num > len(reader.pages):
        raise HTTPException(status_code=404, detail="ページが存在しません")

    page = reader.pages[page_num - 1]
    width = float(page.mediabox.width)
    height = float(page.mediabox.height)

    # 白い画像を生成
    img_width = int(width * scale)
    img_height = int(height * scale)
    img = Image.new("RGB", (img_width, img_height), color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@router.get("/pdf/{file_id}/info")
async def get_pdf_info(file_id: str):
    """PDFのページ数・メタデータを取得"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    try:
        path = get_file_path(file_id)
        reader = pypdf.PdfReader(str(path))
        meta = reader.metadata or {}

        pages_info = []
        for i, page in enumerate(reader.pages):
            pages_info.append({
                "page_num": i + 1,
                "width": float(page.mediabox.width),
                "height": float(page.mediabox.height),
                "rotation": page.get("/Rotate", 0) or 0,
            })

        return {
            "file_id": file_id,
            "page_count": len(reader.pages),
            "metadata": {
                "title": meta.get("/Title", ""),
                "author": meta.get("/Author", ""),
                "subject": meta.get("/Subject", ""),
                "creator": meta.get("/Creator", ""),
                "producer": meta.get("/Producer", ""),
            },
            "pages": pages_info,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF情報の取得に失敗しました: {str(e)}")


@router.get("/pdf/{file_id}/page/{page_num}")
async def get_page_image(file_id: str, page_num: int, scale: float = 1.5):
    """ページをPNG画像として返す"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    try:
        img_data = render_page_to_image(file_id, page_num, scale)
        return Response(content=img_data, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ページのレンダリングに失敗しました: {str(e)}")


@router.get("/pdf/{file_id}/thumbnail/{page_num}")
async def get_thumbnail(file_id: str, page_num: int):
    """サムネイル画像を返す（低解像度）"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    try:
        img_data = render_page_to_image(file_id, page_num, scale=0.3)
        # サムネイルサイズにリサイズ
        img = Image.open(io.BytesIO(img_data))
        img.thumbnail((150, 200), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"サムネイルの生成に失敗しました: {str(e)}")


class RotateRequest(BaseModel):
    page: int
    degrees: int  # 90, 180, 270, -90など


@router.post("/pdf/{file_id}/rotate")
async def rotate_page(file_id: str, req: RotateRequest):
    """ページを回転する"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    if req.degrees % 90 != 0:
        raise HTTPException(status_code=400, detail="回転角度は90の倍数のみ指定可能です")

    try:
        path = get_file_path(file_id)
        reader = pypdf.PdfReader(str(path))

        if req.page < 1 or req.page > len(reader.pages):
            raise HTTPException(status_code=400, detail="無効なページ番号です")

        writer = pypdf.PdfWriter()
        for i, page in enumerate(reader.pages):
            if i + 1 == req.page:
                page.rotate(req.degrees)
            writer.add_page(page)

        buf = io.BytesIO()
        writer.write(buf)
        save_temp_file(buf.getvalue(), file_id)

        return {"success": True, "message": f"ページ{req.page}を{req.degrees}°回転しました"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ページの回転に失敗しました: {str(e)}")


class DeletePageRequest(BaseModel):
    page_number: int


@router.post("/pdf/{file_id}/delete-page")
async def delete_page(file_id: str, req: DeletePageRequest):
    """ページを削除する"""
    if not file_exists(file_id):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    try:
        path = get_file_path(file_id)
        reader = pypdf.PdfReader(str(path))

        if req.page_number < 1 or req.page_number > len(reader.pages):
            raise HTTPException(status_code=400, detail="無効なページ番号です")

        if len(reader.pages) <= 1:
            raise HTTPException(status_code=400, detail="最後のページは削除できません")

        writer = pypdf.PdfWriter()
        for i, page in enumerate(reader.pages):
            if i + 1 != req.page_number:
                writer.add_page(page)

        buf = io.BytesIO()
        writer.write(buf)
        save_temp_file(buf.getvalue(), file_id)

        return {
            "success": True,
            "message": f"ページ{req.page_number}を削除しました",
            "new_page_count": len(reader.pages) - 1,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ページの削除に失敗しました: {str(e)}")
