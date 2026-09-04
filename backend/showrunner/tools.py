import os
import subprocess
import uuid
from typing import Dict, Any, Optional
from pathlib import Path

from backend.config import settings
from backend.editing_env import Clip
from backend.clickhouse.reward_queries import compute_clickhouse_reward, RewardMetrics
from backend.clickhouse.client import clickhouse_client

def query_retention_telemetry(episode_id: str) -> Dict[str, Any]:
    """
    Tool for Showrunner Agent:
    Queries ClickHouse for retention telemetry, drop-offs, and worst-performing scene.
    """
    metrics = compute_clickhouse_reward(episode_id)
    return {
        "episode_id": episode_id,
        "scalar_reward": metrics.scalar_reward,
        "mean_attention": metrics.mean_attention,
        "mean_arousal": metrics.mean_arousal,
        "worst_clip_id": metrics.worst_clip_id,
        "worst_drop": metrics.worst_drop,
        "is_bottleneck_severe": metrics.is_bottleneck_severe,
        "clip_summaries": metrics.clip_summaries
    }

def generate_broll_clip(target_scene: str, prompt: str, style: str = "cinematic noir") -> Clip:
    """
    Tool for Showrunner Agent:
    Synthesizes a short B-roll cutaway shot via Veo/Imagen or cinematic generator,
    formats it via FFmpeg, and returns a new Clip object ready for timeline injection.
    """
    clip_id = f"broll_{uuid.uuid4().hex[:6]}"
    output_filename = f"{clip_id}.mp4"
    output_path = settings.BROLL_DIR / output_filename
    duration_sec = 2.5
    total_frames = int(duration_sec * 24)

    # 1. Attempt Veo / Imagen video generation via Vertex AI
    generated_via_api = False
    from backend.config import get_genai_client
    client = get_genai_client()
    if client:
        try:
            # Check for Veo video generation capability
            if hasattr(client.models, "generate_videos"):
                operation = client.models.generate_videos(
                    model="veo-2.0-generate-001",
                    prompt=f"{prompt}, {style}, cinematic 24fps 4k high contrast moody lighting",
                    config={"duration_seconds": 2, "aspect_ratio": "16:9"}
                )
                # If synchronous or completed
                if hasattr(operation, "video"):
                    with open(output_path, "wb") as f:
                        f.write(operation.video.bytes)
                    generated_via_api = True
        except Exception as e:
            print(f"[Showrunner Tool] Veo API generation fallback to procedural synthesis: {e}")

    # 2. Cinematic procedural synthesis via FFmpeg (reliable standalone path)
    if not generated_via_api:
        clean_prompt = prompt.replace("'", "").replace("\"", "")[:45]
        filter_complex = (
            f"color=c=0x1C2833:s=1280x720:r=24:d={duration_sec}[bg];"
            f"[bg]drawtext=text='NEURO-CUT // SHOWRUNNER B-ROLL INTERVENTION':fontcolor=yellow@0.9:fontsize=20:x=40:y=40,"
            f"drawtext=text='[AI B-ROLL: {clean_prompt.upper()}]':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2[v];"
            f"sine=frequency=330:duration={duration_sec}[a]"
        )
        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-f", "lavfi", "-i", f"color=c=0x1C2833:s=1280x720:r=24:d={duration_sec}",
            "-f", "lavfi", "-i", f"sine=frequency=330:duration={duration_sec}",
            "-filter_complex", filter_complex.replace("[bg]", "[0:v]").replace("[a]", "[1:a]"),
            "-map", "[v]",
            "-map", "1:a",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "96k",
            "-shortest",
            str(output_path)
        ]
        try:
            subprocess.run(cmd, capture_output=True, check=True)
        except Exception:
            fallback_cmd = [
                settings.FFMPEG_PATH,
                "-y",
                "-f", "lavfi", "-i", f"color=c=0x1C2833:s=1280x720:r=24:d={duration_sec}",
                "-f", "lavfi", "-i", f"sine=frequency=330:duration={duration_sec}",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-shortest",
                str(output_path)
            ]
            subprocess.run(fallback_cmd, capture_output=True, check=True)

    new_clip = Clip(
        clip_id=clip_id,
        scene_id=target_scene,
        take_id="broll_take_1",
        source_path=str(output_path),
        duration_frames=total_frames,
        start_frame=0,
        end_frame=total_frames,
        fps=24.0,
        description=f"Showrunner AI B-roll: {prompt}",
        is_broll=True
    )
    return new_clip
