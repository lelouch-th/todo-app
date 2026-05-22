"""PDF操作の共通ユーティリティ"""
import os
import uuid
from pathlib import Path

TEMP_DIR = Path(__file__).parent.parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


def get_file_path(file_id: str) -> Path:
    """file_idからファイルパスを取得"""
    path = TEMP_DIR / f"{file_id}.pdf"
    return path


def file_exists(file_id: str) -> bool:
    """ファイルが存在するか確認"""
    return get_file_path(file_id).exists()


def generate_file_id() -> str:
    """新しいfile_idを生成"""
    return str(uuid.uuid4())


def save_temp_file(content: bytes, file_id: str = None) -> str:
    """一時ファイルに保存してfile_idを返す"""
    if file_id is None:
        file_id = generate_file_id()
    path = get_file_path(file_id)
    path.write_bytes(content)
    return file_id


def delete_temp_file(file_id: str) -> bool:
    """一時ファイルを削除"""
    path = get_file_path(file_id)
    if path.exists():
        path.unlink()
        return True
    return False


def cleanup_old_files(max_age_seconds: int = 3600):
    """古い一時ファイルを削除（デフォルト1時間以上）"""
    import time
    now = time.time()
    for f in TEMP_DIR.glob("*.pdf"):
        if now - f.stat().st_mtime > max_age_seconds:
            f.unlink()
