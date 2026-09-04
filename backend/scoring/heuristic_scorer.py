import json
import math
import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.config import settings
from backend.editing_env import TimelineState, Clip

class TelemetryPoint(BaseModel):
    episode_id: str
    attempt_n: int = 0
    clip_id: str
    t_ms: int
    attention: float
    cognitive_load: float
    arousal: float
    source: str = "heuristic"

class HeuristicScorer:
    """
    Phase 1 Heuristic Scorer.
    Evaluates video timeline engagement, emitting per-shot / temporal telemetry
    (attention, cognitive_load, arousal).
    Uses Gemini API when available, with a deterministic cinematic pacing engine fallback.
    """

    def __init__(self):
        self.gemini_client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception:
                try:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=settings.GEMINI_API_KEY)
                    self.gemini_client = legacy_genai.GenerativeModel(settings.GEMINI_MODEL)
                except Exception:
                    self.gemini_client = None

    def score_timeline(self, state: TimelineState) -> List[TelemetryPoint]:
        """
        Generates telemetry points across the timeline for each clip at ~500ms intervals.
        """
        telemetry_points: List[TelemetryPoint] = []
        timeline_offset_ms = 0
        attempt_n = state.attempt_n

        # Optional Gemini batch evaluation for scene pacing
        gemini_scene_scores = {}
        if self.gemini_client:
            gemini_scene_scores = self._evaluate_with_gemini(state)

        for clip in state.clips:
            duration_sec = clip.duration_seconds
            step_ms = 500
            total_steps = max(1, int((duration_sec * 1000) / step_ms))

            gemini_eval = gemini_scene_scores.get(clip.clip_id)

            for step in range(total_steps):
                t_in_clip_ms = step * step_ms
                t_global_ms = timeline_offset_ms + t_in_clip_ms

                if gemini_eval:
                    # Grounded on Gemini response with temporal micro-variance
                    att = min(1.0, max(0.1, gemini_eval.get("attention", 0.7) - (step * 0.01)))
                    cog = min(1.0, max(0.1, gemini_eval.get("cognitive_load", 0.4) + (0.02 * math.sin(step))))
                    arousal = min(1.0, max(0.1, gemini_eval.get("arousal", 0.6) + (0.015 * math.cos(step))))
                else:
                    # Deterministic cinematic pacing model
                    att, cog, arousal = self._compute_deterministic_pacing(clip, step, total_steps)

                telemetry_points.append(TelemetryPoint(
                    episode_id=state.episode_id,
                    attempt_n=attempt_n,
                    clip_id=clip.clip_id,
                    t_ms=t_global_ms,
                    attention=round(att, 3),
                    cognitive_load=round(cog, 3),
                    arousal=round(arousal, 3),
                    source="heuristic"
                ))

            timeline_offset_ms += int(duration_sec * 1000)

        return telemetry_points

    def _compute_deterministic_pacing(self, clip: Clip, step: int, total_steps: int) -> tuple[float, float, float]:
        """
        Cinematic pacing rule engine:
        - Excessive lingering on static shot (e.g. shot_03_standoff > 4.5s) causes steep attention decay.
        - B-roll injection stimulates attention and arousal.
        - Dynamic tight cuts (2.0s - 3.5s) maintain high engagement.
        """
        duration = clip.duration_seconds
        progress = step / max(1, total_steps)

        # Baseline profiles
        if clip.is_broll:
            # Fresh visual context
            base_att = 0.88 + 0.05 * math.sin(progress * math.pi)
            base_cog = 0.42
            base_arousal = 0.78
        elif "standoff" in clip.clip_id:
            # Pacing bottleneck scene: initial tension decays rapidly if held too long
            if duration > 4.5:
                # Decays sharply from 0.80 down to 0.32
                base_att = max(0.30, 0.80 - (progress * 0.55))
                base_cog = 0.28 + (progress * 0.15)
                base_arousal = max(0.25, 0.70 - (progress * 0.48))
            else:
                # Tightened standoff holds engagement
                base_att = 0.78 - (progress * 0.15)
                base_cog = 0.45
                base_arousal = 0.72
        elif "dialogue" in clip.clip_id:
            if "take_2" in clip.clip_id:  # tighter take
                base_att = 0.82 + 0.06 * math.sin(progress * 3.14)
                base_cog = 0.48
                base_arousal = 0.75
            else:
                base_att = 0.74 + 0.04 * math.sin(progress * 3.14)
                base_cog = 0.45
                base_arousal = 0.65
        elif "climax" in clip.clip_id:
            base_att = 0.89 + 0.06 * math.sin(progress * 2.0)
            base_cog = 0.55
            base_arousal = 0.86
        else:  # intro / establishing
            base_att = 0.75 + (0.05 if duration <= 3.5 else -0.15 * progress)
            base_cog = 0.35
            base_arousal = 0.55

        # Rhythm penalty if clip is too long or too short
        if duration > 5.5:
            base_att -= 0.12 * (duration - 5.5)
        elif duration < 1.0:
            base_cog += 0.25  # disorienting jump cut

        return (
            min(1.0, max(0.05, base_att)),
            min(1.0, max(0.05, base_cog)),
            min(1.0, max(0.05, base_arousal))
        )

    def _evaluate_with_gemini(self, state: TimelineState) -> Dict[str, Dict[str, float]]:
        """Invokes Gemini to evaluate sequence pacing and engagement with automatic non-rate-limited fallback."""
        summary = [
            {
                "clip_id": c.clip_id,
                "scene": c.scene_id,
                "duration_sec": c.duration_seconds,
                "is_broll": c.is_broll,
                "description": c.description
            }
            for c in state.clips
        ]
        prompt = (
            "You are an expert film editor & audience engagement analyst for the Neuro-Cut system. "
            "Analyze the following sequence of shots and return JSON with predicted audience engagement "
            "on a 0.0 to 1.0 scale for each clip_id: attention, cognitive_load, arousal.\n\n"
            f"Timeline: {json.dumps(summary)}\n\n"
            "Return valid JSON ONLY in this format:\n"
            '{"scores": {"<clip_id>": {"attention": float, "cognitive_load": float, "arousal": float}}}'
        )

        candidate_models = [settings.GEMINI_MODEL, "gemini-3.5-flash", "gemini-2.5-flash-lite"]
        # deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        for model in candidate_models:
            try:
                print(f"[Scorer] >>> CALLING REAL GEMINI API ({model}) for {len(state.clips)} shots...")
                if hasattr(self.gemini_client, "models"):
                    response = self.gemini_client.models.generate_content(
                        model=model,
                        contents=prompt
                    )
                    text = response.text
                else:
                    response = self.gemini_client.generate_content(prompt)
                    text = response.text

                clean_text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(clean_text)
                scores = data.get("scores", {})
                if scores:
                    print(f"[Scorer] <<< REAL GEMINI API SUCCESS ({model}): Scores received for {list(scores.keys())}")
                    return scores
            except Exception as e:
                print(f"[Scorer] Model {model} attempt failed: {e}")

        print("[Scorer] Gemini API unavailable or quota exhausted — using cinematic rule engine fallback.")
        return {}
