import os
import re
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.core.security import sanitize_safe_id

def sanitize_filename(name: str) -> str:
    """Turn a project title into a clean, safe filename."""
    clean = re.sub(r'[^a-zA-Z0-9_\- ]', '', name).strip()
    clean = clean.replace(' ', '_')
    return clean[:80] if clean else "creatorflow_video"

def format_file_size(size_bytes: int) -> str:
    """Format bytes into readable MB/KB."""
    if size_bytes >= 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    elif size_bytes >= 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes} B"

class ProjectStorage:
    def __init__(self):
        self.base_dir = os.path.join(settings.STORAGE_DIR, "projects")
        os.makedirs(self.base_dir, exist_ok=True)

    def get_project_dir(self, project_id: str) -> str:
        safe_id = sanitize_safe_id(project_id)
        if not safe_id or safe_id != project_id:
            raise ValueError(f"Path traversal or illegal identifier detected in project_id: {project_id}")
        abs_base = os.path.abspath(self.base_dir)
        p = os.path.abspath(os.path.join(abs_base, safe_id))
        if not p.startswith(abs_base):
            raise ValueError(f"Path traversal detected in project_id: {project_id}")
        return p

    def get_output_dir(self, project_id: str) -> str:
        project_dir = self.get_project_dir(project_id)
        return os.path.abspath(os.path.join(project_dir, "output"))

    def init_project_folder(self, project_id: str, title: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Creates dedicated directory structure for a new project:
        - /storage/projects/<project_id>/
        - /storage/projects/<project_id>/output/ (where final video & deliverables live)
        - /storage/projects/<project_id>/audio/
        - /storage/projects/<project_id>/renders/
        """
        project_dir = self.get_project_dir(project_id)
        output_dir = self.get_output_dir(project_id)
        audio_dir = os.path.join(project_dir, "audio")
        renders_dir = os.path.join(project_dir, "renders")

        os.makedirs(project_dir, exist_ok=True)
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(audio_dir, exist_ok=True)
        os.makedirs(renders_dir, exist_ok=True)

        # Write README.txt in the dedicated output directory
        readme_path = os.path.join(output_dir, "README.txt")
        readme_content = (
            f"CreatorFlow AI Studio — Project Deliverables Folder\n"
            f"=====================================================\n"
            f"Project Title: {title}\n"
            f"Project ID:    {project_id}\n"
            f"Created At:    {datetime.now(timezone.utc).isoformat()}\n\n"
            f"This dedicated output folder stores your final rendered videos,\n"
            f"cover thumbnails, subtitle files (SRT/VTT), and complete export packages.\n"
        )
        try:
            with open(readme_path, "w", encoding="utf-8") as f:
                f.write(readme_content)
        except Exception as e:
            print(f"[ProjectStorage] Warning creating README: {e}")

        # Write project_info.json
        info_path = os.path.join(output_dir, "project_info.json")
        info_data = {
            "project_id": project_id,
            "title": title,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "output_directory": output_dir,
            "metadata": metadata or {}
        }
        try:
            with open(info_path, "w", encoding="utf-8") as f:
                json.dump(info_data, f, indent=2)
        except Exception as e:
            print(f"[ProjectStorage] Warning creating project_info.json: {e}")

        return {
            "project_dir": project_dir,
            "output_dir": output_dir,
            "audio_dir": audio_dir,
            "renders_dir": renders_dir
        }

    def deploy_final_output(
        self,
        project_id: str,
        project_title: str,
        mp4_path: str,
        thumbnail_path: Optional[str] = None,
        srt_path: Optional[str] = None,
        vtt_path: Optional[str] = None,
        zip_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Copies rendered video and deliverables into the dedicated output folder:
        - final_video.mp4 AND <Clean_Title>.mp4
        - cover_thumbnail.jpg
        - captions.srt AND <Clean_Title>.srt
        - captions.vtt AND <Clean_Title>.vtt
        - <Clean_Title>_export.zip AND export_package.zip
        - deliverables.json manifest
        """
        output_dir = self.get_output_dir(project_id)
        os.makedirs(output_dir, exist_ok=True)
        safe_title = sanitize_filename(project_title)

        deployed_files = []

        # 1. Main MP4 Video
        if mp4_path and os.path.exists(mp4_path):
            # Canonical name
            dest_canonical = os.path.join(output_dir, "final_video.mp4")
            shutil.copy2(mp4_path, dest_canonical)
            deployed_files.append("final_video.mp4")

            # Human-readable title copy for user's file explorer
            dest_named = os.path.join(output_dir, f"{safe_title}.mp4")
            shutil.copy2(mp4_path, dest_named)
            deployed_files.append(f"{safe_title}.mp4")

        # 2. Thumbnail
        if thumbnail_path and os.path.exists(thumbnail_path):
            dest_thumb = os.path.join(output_dir, "cover_thumbnail.jpg")
            shutil.copy2(thumbnail_path, dest_thumb)
            dest_thumb_named = os.path.join(output_dir, f"{safe_title}_thumb.jpg")
            shutil.copy2(thumbnail_path, dest_thumb_named)
            deployed_files.extend(["cover_thumbnail.jpg", f"{safe_title}_thumb.jpg"])

        # 3. Subtitles SRT & VTT
        if srt_path and os.path.exists(srt_path):
            dest_srt = os.path.join(output_dir, "captions.srt")
            shutil.copy2(srt_path, dest_srt)
            dest_srt_named = os.path.join(output_dir, f"{safe_title}.srt")
            shutil.copy2(srt_path, dest_srt_named)
            deployed_files.extend(["captions.srt", f"{safe_title}.srt"])

        if vtt_path and os.path.exists(vtt_path):
            dest_vtt = os.path.join(output_dir, "captions.vtt")
            shutil.copy2(vtt_path, dest_vtt)
            dest_vtt_named = os.path.join(output_dir, f"{safe_title}.vtt")
            shutil.copy2(vtt_path, dest_vtt_named)
            deployed_files.extend(["captions.vtt", f"{safe_title}.vtt"])

        # 4. ZIP Package
        if zip_path and os.path.exists(zip_path):
            dest_zip = os.path.join(output_dir, "export_package.zip")
            shutil.copy2(zip_path, dest_zip)
            dest_zip_named = os.path.join(output_dir, f"{safe_title}_export.zip")
            shutil.copy2(zip_path, dest_zip_named)
            deployed_files.extend(["export_package.zip", f"{safe_title}_export.zip"])

        # 5. Manifest
        manifest_path = os.path.join(output_dir, "deliverables.json")
        manifest_data = {
            "project_id": project_id,
            "project_title": project_title,
            "safe_title": safe_title,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "output_directory": output_dir,
            "files": deployed_files
        }
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, indent=2)

        return {
            "output_dir": output_dir,
            "safe_title": safe_title,
            "deployed_files": deployed_files
        }

    def get_output_summary(self, project_id: str, project_title: str) -> Dict[str, Any]:
        """
        Lists files in project output folder with metadata & download links.
        Auto-syncs existing rendered files into output/ if not already present.
        """
        output_dir = self.get_output_dir(project_id)
        project_dir = self.get_project_dir(project_id)
        renders_dir = os.path.join(project_dir, "renders")

        # Auto-sync legacy/existing renders into dedicated output folder
        if not os.path.exists(output_dir) or not any(f.endswith(".mp4") for f in os.listdir(output_dir) if os.path.isfile(os.path.join(output_dir, f))):
            if os.path.exists(renders_dir):
                for f in os.listdir(renders_dir):
                    if f.endswith("_final.mp4"):
                        mp4_p = os.path.join(renders_dir, f)
                        job_id_prefix = f.replace("_final.mp4", "")
                        thumb_p = os.path.join(renders_dir, f"{job_id_prefix}_thumbnail.jpg")
                        srt_p = os.path.join(project_dir, "captions.srt")
                        vtt_p = os.path.join(project_dir, "captions.vtt")
                        zip_candidates = [z for z in os.listdir(project_dir) if z.endswith(".zip")]
                        zip_p = os.path.join(project_dir, zip_candidates[0]) if zip_candidates else None
                        self.deploy_final_output(
                            project_id=project_id,
                            project_title=project_title,
                            mp4_path=mp4_p,
                            thumbnail_path=thumb_p if os.path.exists(thumb_p) else None,
                            srt_path=srt_p if os.path.exists(srt_p) else None,
                            vtt_path=vtt_p if os.path.exists(vtt_p) else None,
                            zip_path=zip_p
                        )
                        break

        exists = os.path.exists(output_dir)
        safe_title = sanitize_filename(project_title)

        files = []
        has_final_video = False
        primary_video_name = None
        primary_video_size = 0

        if exists:
            for fname in os.listdir(output_dir):
                fpath = os.path.join(output_dir, fname)
                if os.path.isfile(fpath):
                    st = os.stat(fpath)
                    ext = os.path.splitext(fname)[1].lower()
                    file_type = "file"
                    if ext in [".mp4", ".mov", ".webm"]:
                        file_type = "video"
                        has_final_video = True
                        if not primary_video_name or fname == "final_video.mp4":
                            primary_video_name = fname
                            primary_video_size = st.st_size
                    elif ext in [".jpg", ".jpeg", ".png", ".webp"]:
                        file_type = "thumbnail"
                    elif ext in [".srt", ".vtt", ".ass"]:
                        file_type = "subtitles"
                    elif ext in [".zip", ".tar", ".gz"]:
                        file_type = "archive"
                    elif ext in [".json", ".txt"]:
                        file_type = "metadata"

                    files.append({
                        "name": fname,
                        "size_bytes": st.st_size,
                        "size_formatted": format_file_size(st.st_size),
                        "type": file_type,
                        "download_url": f"/api/projects/{project_id}/download/file/{fname}",
                        "static_url": f"/storage/projects/{project_id}/output/{fname}",
                        "modified_at": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat()
                    })

        # Sort files: videos first, then archives, subtitles, thumbnails, metadata
        type_priority = {"video": 1, "archive": 2, "subtitles": 3, "thumbnail": 4, "metadata": 5, "file": 6}
        files.sort(key=lambda x: (type_priority.get(x["type"], 99), x["name"]))

        return {
            "project_id": project_id,
            "project_title": project_title,
            "output_directory": output_dir,
            "exists": exists,
            "has_final_video": has_final_video,
            "primary_video_name": primary_video_name,
            "primary_video_size": format_file_size(primary_video_size),
            "video_download_url": f"/api/projects/{project_id}/download/video",
            "zip_download_url": f"/api/projects/{project_id}/download/zip",
            "files": files
        }

    def open_folder_in_os(self, project_id: str) -> Dict[str, Any]:
        """
        Opens the dedicated project output folder directly in Windows Explorer or native file manager.
        """
        output_dir = self.get_output_dir(project_id)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        try:
            if sys.platform == "win32":
                # Windows File Explorer
                os.startfile(output_dir)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", output_dir])
            else:
                subprocess.Popen(["xdg-open", output_dir])
            return {"success": True, "path": output_dir, "message": "Folder opened in file manager"}
        except Exception as e:
            return {"success": False, "path": output_dir, "error": str(e)}

project_storage = ProjectStorage()
