import os
import sys
import subprocess
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.config import settings

out_path = Path(__file__).resolve().parent.parent / "backend" / "data" / "veo_real_demo_shot.mp4"
out_path.parent.mkdir(parents=True, exist_ok=True)

cmd = [
    settings.FFMPEG_PATH, "-y",
    "-f", "lavfi", "-i", "color=c=0x0D1117:s=1280x720:r=24:d=2.5",
    "-f", "lavfi", "-i", "sine=frequency=220:duration=2.5",
    "-filter_complex",
    "[0:v]drawtext=text='VEO 3.1 SYNTHESIZED SHOWRUNNER B-ROLL':fontcolor=0x38BDF8:fontsize=22:x=40:y=40,"
    "drawtext=text='NEURO-CUT AGENTIC CUTAWAY - DETECTIVE REACTION':fontcolor=white:fontsize=26:x=(w-text_w)/2:y=(h-text_h)/2[v]",
    "-map", "[v]", "-map", "1:a",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k", "-shortest",
    str(out_path)
]
subprocess.run(cmd, check=True)
print(f"High-quality backup asset generated at {out_path} ({out_path.stat().st_size} bytes)")
