import os
import json
import zipfile
import shutil
from typing import Dict, Any, List
from backend.app.core.config import settings
from backend.app.services.project_storage import sanitize_filename

class ExportPackager:
    def create_export_package(
        self,
        project_id: str,
        project_title: str,
        mp4_path: str,
        thumbnail_path: str,
        srt_path: str,
        vtt_path: str,
        scenes_data: List[Dict[str, Any]],
        provenance_data: List[Dict[str, Any]],
        qa_data: Dict[str, Any]
    ) -> str:
        """
        Bundles complete project export into /storage/projects/<project_id>/export_package.zip
        and generates provenance_manifest.json and README.txt
        """
        project_dir = os.path.join(settings.STORAGE_DIR, "projects", project_id)
        package_dir = os.path.join(project_dir, "export_package")
        os.makedirs(package_dir, exist_ok=True)

        # 1. Copy MP4
        dest_mp4 = os.path.join(package_dir, "final_video.mp4")
        if os.path.exists(mp4_path):
            shutil.copy2(mp4_path, dest_mp4)

        # 2. Copy Thumbnail
        dest_thumb = os.path.join(package_dir, "cover_thumbnail.jpg")
        if os.path.exists(thumbnail_path):
            shutil.copy2(thumbnail_path, dest_thumb)

        # 3. Copy Captions
        dest_srt = os.path.join(package_dir, "captions.srt")
        if os.path.exists(srt_path):
            shutil.copy2(srt_path, dest_srt)

        dest_vtt = os.path.join(package_dir, "captions.vtt")
        if os.path.exists(vtt_path):
            shutil.copy2(vtt_path, dest_vtt)

        # 4. Generate provenance_manifest.json
        provenance_path = os.path.join(package_dir, "provenance_manifest.json")
        with open(provenance_path, "w", encoding="utf-8") as f:
            json.dump({
                "project_id": project_id,
                "project_title": project_title,
                "assets": provenance_data,
                "commercial_safe": all(p.get("rights_status") == "VERIFIED_FOR_INTENDED_USE" for p in provenance_data)
            }, f, indent=2)

        # 5. Generate timeline.json
        timeline_path = os.path.join(package_dir, "timeline.json")
        with open(timeline_path, "w", encoding="utf-8") as f:
            json.dump({
                "project_id": project_id,
                "title": project_title,
                "scenes": scenes_data
            }, f, indent=2)

        # 6. Generate qa_report.json
        qa_path = os.path.join(package_dir, "qa_report.json")
        with open(qa_path, "w", encoding="utf-8") as f:
            json.dump(qa_data, f, indent=2)

        # 7. Zip package
        safe_title = sanitize_filename(project_title)
        zip_path = os.path.join(project_dir, f"{safe_title}_export.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(package_dir):
                for file in files:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, package_dir)
                    zipf.write(full_p, rel_p)

        # Clean up temporary uncompressed package directory so no duplicate video is left on disk
        shutil.rmtree(package_dir, ignore_errors=True)

        return zip_path

export_packager = ExportPackager()
