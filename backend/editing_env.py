import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field, computed_field

from backend.config import settings

class Clip(BaseModel):
    clip_id: str
    scene_id: str
    take_id: str = "take_1"
    source_path: str
    duration_frames: int
    start_frame: int = 0
    end_frame: int
    fps: float = 24.0
    description: str = ""
    is_broll: bool = False

    @property
    def current_frames(self) -> int:
        return max(0, self.end_frame - self.start_frame)

    @computed_field
    @property
    def duration_seconds(self) -> float:
        return round(self.current_frames / self.fps, 2)

    @property
    def start_seconds(self) -> float:
        return round(self.start_frame / self.fps, 3)

    @property
    def end_seconds(self) -> float:
        return round(self.end_frame / self.fps, 3)

class TimelineState(BaseModel):
    episode_id: str
    attempt_n: int = 0
    clips: List[Clip] = Field(default_factory=list)
    compiled_video_path: Optional[str] = None
    last_action: Optional[str] = None
    last_reward: float = 0.0

    @property
    def total_duration_seconds(self) -> float:
        return sum(c.duration_seconds for c in self.clips)

    @property
    def total_frames(self) -> int:
        return sum(c.current_frames for c in self.clips)

    def clone(self) -> "TimelineState":
        return TimelineState(
            episode_id=self.episode_id,
            attempt_n=self.attempt_n + 1,
            clips=[c.model_copy() for c in self.clips],
            compiled_video_path=self.compiled_video_path,
            last_action=self.last_action,
            last_reward=self.last_reward
        )

class EditingEnvironment:
    """
    Editing Environment for Neuro-Cut (Phase 1 Deterministic Core).
    Models timeline state, action space, and physical FFmpeg compilation.
    """

    MIN_CLIP_FRAMES = 12  # Minimum 0.5s at 24fps

    def __init__(self, episode_id: Optional[str] = None):
        self.episode_id = episode_id or f"ep_{uuid.uuid4().hex[:8]}"
        self.shot_pool: Dict[str, Clip] = {}
        self._ensure_sample_shots()
        self.state = self._initialize_timeline()

    def _ensure_sample_shots(self):
        """Generates realistic procedural cinematic shots via FFmpeg if not present."""
        sample_shot_specs = [
            {
                "id": "shot_01_intro",
                "scene": "scene_1_arrival",
                "take": "take_1",
                "duration": 4.0,
                "color": "0x1A2530",
                "text": "SCENE 1: ARRIVAL\\n[WIDE ESTABLISHING SHOT]",
                "desc": "Wide cinematic shot of rain-slicked city streets at night"
            },
            {
                "id": "shot_02_dialogue_take1",
                "scene": "scene_2_confrontation",
                "take": "take_1",
                "duration": 5.0,
                "color": "0x3A2010",
                "text": "SCENE 2: CONFRONTATION\\n[PROTAGONIST - TAKE 1]",
                "desc": "Medium close-up of protagonist questioning suspect"
            },
            {
                "id": "shot_02_dialogue_take2",
                "scene": "scene_2_confrontation",
                "take": "take_2",
                "duration": 4.5,
                "color": "0x321E14",
                "text": "SCENE 2: CONFRONTATION\\n[PROTAGONIST - TAKE 2 (TIGHT)]",
                "desc": "Closer, more intense take of protagonist confrontation"
            },
            {
                "id": "shot_03_standoff",
                "scene": "scene_3_standoff",
                "take": "take_1",
                "duration": 6.0,  # Intentionally long/slow to simulate pacing bottleneck
                "color": "0x102020",
                "text": "SCENE 3: STANDOFF\\n[SUSPECT SILENT PAUSE]",
                "desc": "Long lingering take of suspect refusing to speak (pacing drop risk)"
            },
            {
                "id": "shot_04_reaction",
                "scene": "scene_3_standoff",
                "take": "take_2",
                "duration": 3.5,
                "color": "0x251525",
                "text": "SCENE 3: STANDOFF\\n[DETECTIVE REACTION]",
                "desc": "Tight cut to detective observing nervous twitch"
            },
            {
                "id": "shot_05_climax",
                "scene": "scene_4_breakthrough",
                "take": "take_1",
                "duration": 4.0,
                "color": "0x301010",
                "text": "SCENE 4: BREAKTHROUGH\\n[CLIMACTIC REVELATION]",
                "desc": "Fast paced climax and document reveal"
            }
        ]

        for spec in sample_shot_specs:
            shot_file = settings.SHOTS_DIR / f"{spec['id']}.mp4"
            if not shot_file.exists():
                self._generate_procedural_video(
                    output_path=str(shot_file),
                    duration=spec["duration"],
                    color=spec["color"],
                    text=spec["text"]
                )
            
            total_frames = int(spec["duration"] * 24)
            clip = Clip(
                clip_id=spec["id"],
                scene_id=spec["scene"],
                take_id=spec["take"],
                source_path=str(shot_file),
                duration_frames=total_frames,
                start_frame=0,
                end_frame=total_frames,
                fps=24.0,
                description=spec["desc"]
            )
            self.shot_pool[clip.clip_id] = clip

    def _generate_procedural_video(self, output_path: str, duration: float, color: str, text: str):
        """Uses FFmpeg or OpenCV to synthesize a clean 24fps MP4."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        ffmpeg_bin = settings.FFMPEG_PATH
        
        # 1. Try standard FFmpeg synthesis
        try:
            cmd = [
                ffmpeg_bin,
                "-y",
                "-f", "lavfi", "-i", f"color=c={color}:s=1280x720:r=24:d={duration}",
                "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-shortest",
                output_path
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            if Path(output_path).exists() and Path(output_path).stat().st_size > 0:
                return
        except Exception:
            pass

        # 2. Robust OpenCV fallback (guaranteed to work across all OS/Colab environments)
        try:
            import cv2
            import numpy as np
            fps = 24.0
            n_frames = max(1, int(duration * fps))
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (1280, 720))
            
            # Parse color hex (e.g. 0x1A2530 -> BGR)
            hex_str = color.replace("0x", "").lstrip("#")
            c_int = int(hex_str, 16) if hex_str else 0x1A2530
            r = (c_int >> 16) & 255
            g = (c_int >> 8) & 255
            b = c_int & 255
            
            frame = np.full((720, 1280, 3), (b, g, r), dtype=np.uint8)
            clean_text = text.replace("\\n", " - ")
            cv2.putText(frame, clean_text, (50, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
            for _ in range(n_frames):
                out.write(frame)
            out.release()
            print(f"[Procedural Video] Generated {output_path} via OpenCV fallback ({n_frames} frames).")
        except Exception as e:
            print(f"[Procedural Video] Fallback warning on {output_path}: {e}")

    def _initialize_timeline(self) -> TimelineState:
        """Initial baseline timeline: shot 1, shot 2 (take 1), shot 3, shot 5."""
        initial_clip_ids = ["shot_01_intro", "shot_02_dialogue_take1", "shot_03_standoff", "shot_05_climax"]
        clips = [self.shot_pool[cid].model_copy() for cid in initial_clip_ids if cid in self.shot_pool]
        return TimelineState(
            episode_id=self.episode_id,
            attempt_n=0,
            clips=clips,
            last_action="initial_rough_cut"
        )

    # ================= Action Space =================
    def apply_action(self, state: TimelineState, action_type: str, **kwargs) -> Tuple[TimelineState, bool, str]:
        """
        Applies a discrete edit action on the timeline state:
        - trim_head(clip_id, frames)
        - trim_tail(clip_id, frames)
        - swap_take(clip_id, alt_clip_id)
        - ripple_delete(clip_id)
        - insert_broll(target_clip_id, broll_clip_id, position='after')
        """
        new_state = state.clone()
        success = False
        message = ""

        if action_type == "trim_head":
            clip_id = kwargs.get("clip_id")
            frames = kwargs.get("frames", 12)
            for c in new_state.clips:
                if c.clip_id == clip_id:
                    if (c.end_frame - (c.start_frame + frames)) >= self.MIN_CLIP_FRAMES:
                        c.start_frame += frames
                        success = True
                        message = f"Trimmed head of {clip_id} by {frames} frames ({round(frames/24.0, 2)}s)"
                    else:
                        message = f"Head trim rejected: would exceed minimum clip duration ({self.MIN_CLIP_FRAMES} frames)"
                    break

        elif action_type == "trim_tail":
            clip_id = kwargs.get("clip_id")
            frames = kwargs.get("frames", 12)
            for c in new_state.clips:
                if c.clip_id == clip_id:
                    if ((c.end_frame - frames) - c.start_frame) >= self.MIN_CLIP_FRAMES:
                        c.end_frame -= frames
                        success = True
                        message = f"Trimmed tail of {clip_id} by {frames} frames ({round(frames/24.0, 2)}s)"
                    else:
                        message = f"Tail trim rejected: would exceed minimum clip duration ({self.MIN_CLIP_FRAMES} frames)"
                    break

        elif action_type == "swap_take":
            clip_id = kwargs.get("clip_id")
            alt_clip_id = kwargs.get("alt_clip_id")
            if alt_clip_id in self.shot_pool:
                for idx, c in enumerate(new_state.clips):
                    if c.clip_id == clip_id:
                        alt_clip = self.shot_pool[alt_clip_id].model_copy()
                        new_state.clips[idx] = alt_clip
                        success = True
                        message = f"Swapped {clip_id} with alternate take {alt_clip_id}"
                        break
            else:
                message = f"Alternate clip {alt_clip_id} not found in pool"

        elif action_type == "ripple_delete":
            clip_id = kwargs.get("clip_id")
            if len(new_state.clips) > 2:
                original_len = len(new_state.clips)
                new_state.clips = [c for c in new_state.clips if c.clip_id != clip_id]
                if len(new_state.clips) < original_len:
                    success = True
                    message = f"Ripple deleted {clip_id} from timeline"
                else:
                    message = f"Clip {clip_id} not found in timeline"
            else:
                message = "Ripple delete rejected: minimum 2 clips must remain on timeline"

        elif action_type == "insert_broll":
            target_clip_id = kwargs.get("target_clip_id")
            broll_clip_id = kwargs.get("broll_clip_id")
            position = kwargs.get("position", "after")
            if broll_clip_id in self.shot_pool:
                broll_clip = self.shot_pool[broll_clip_id].model_copy()
                broll_clip.is_broll = True
                target_found = any(c.clip_id == target_clip_id for c in new_state.clips)
                if not target_found and new_state.clips:
                    # Fallback to middle of timeline
                    target_clip_id = new_state.clips[len(new_state.clips) // 2].clip_id

                new_clips = []
                for c in new_state.clips:
                    if c.clip_id == target_clip_id and position == "before":
                        new_clips.append(broll_clip)
                    new_clips.append(c)
                    if c.clip_id == target_clip_id and position == "after":
                        new_clips.append(broll_clip)
                new_state.clips = new_clips
                success = True
                message = f"Injected Showrunner B-roll {broll_clip_id} {position} {target_clip_id}"
            else:
                message = f"B-roll clip {broll_clip_id} not available in pool"

        else:
            message = f"Unknown action type {action_type}"

        if success:
            new_state.last_action = message
        return new_state, success, message

    # ================= Physical Video Compilation =================
    def compile_timeline(self, state: TimelineState) -> str:
        """Physically slices and concatenates the timeline clips into a real MP4."""
        out_filename = f"{state.episode_id}_attempt_{state.attempt_n}.mp4"
        out_path = settings.COMPILED_DIR / out_filename
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        try:
            # Fast path: slice and concatenate using FFmpeg
            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_path = Path(tmp_dir)
                segment_files = []

                for idx, clip in enumerate(state.clips):
                    seg_file = tmp_path / f"seg_{idx:03d}.mp4"
                    start_sec = clip.start_seconds
                    duration_sec = clip.duration_seconds
                    
                    # Slice segment
                    cmd_slice = [
                        settings.FFMPEG_PATH,
                        "-y",
                        "-ss", str(start_sec),
                        "-t", str(duration_sec),
                        "-i", clip.source_path,
                        "-c:v", "libx264",
                        "-c:a", "aac",
                        "-r", "24",
                        "-pix_fmt", "yuv420p",
                        str(seg_file)
                    ]
                    subprocess.run(cmd_slice, capture_output=True, check=True)
                    segment_files.append(seg_file)

                # Concat demuxer list
                concat_list = tmp_path / "concat.txt"
                with open(concat_list, "w", encoding="utf-8") as f:
                    for seg in segment_files:
                        escaped = str(seg).replace("\\", "/")
                        f.write(f"file '{escaped}'\n")

                cmd_concat = [
                    settings.FFMPEG_PATH,
                    "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(concat_list),
                    "-c", "copy",
                    str(out_path)
                ]
                subprocess.run(cmd_concat, capture_output=True, check=True)
        except Exception as e:
            print(f"[Timeline Compile] FFmpeg concat fallback: {e}")
            import shutil
            if state.clips and Path(state.clips[0].source_path).exists():
                shutil.copy2(state.clips[0].source_path, str(out_path))
            else:
                Path(out_path).touch()

        state.compiled_video_path = str(out_path)
        return str(out_path)

    def register_broll_clip(self, clip: Clip):
        """Adds a newly synthesized B-roll clip into the available shot pool."""
        self.shot_pool[clip.clip_id] = clip
