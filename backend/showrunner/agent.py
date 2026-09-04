import json
from typing import Dict, Any, Optional, Tuple

from backend.config import settings
from backend.editing_env import EditingEnvironment, Clip, TimelineState
from backend.clickhouse.client import clickhouse_client
from backend.showrunner.tools import query_retention_telemetry, generate_broll_clip

class ShowrunnerAgent:
    """
    Google ADK / Gemini-powered Showrunner Agent.
    Orchestrates the optimization loop:
    1. Inspects ClickHouse drop-offs and retention telemetry.
    2. Diagnoses pacing bottlenecks where editing alone is stuck.
    3. Autonomously synthesizes new B-roll footage via Veo/Imagen.
    4. Injects B-roll into the timeline and logs reasoning into ClickHouse.
    """

    def __init__(self):
        self.gemini_client = None
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception:
                self.gemini_client = None

    def diagnose_and_intervene(
        self,
        env: EditingEnvironment,
        state: TimelineState,
        stuck_clip_id: str,
        attempt_history: list
    ) -> Tuple[TimelineState, Dict[str, Any]]:
        """
        Autonomous intervention when a scene is stuck across N attempts.
        Generates B-roll and injects it into the timeline.
        """
        telemetry_info = query_retention_telemetry(state.episode_id)
        target_clip = next((c for c in state.clips if c.clip_id == stuck_clip_id), None)
        target_scene = target_clip.scene_id if target_clip else "scene_bottleneck"

        # 1. Formulate reasoning & B-roll prompt (Gemini or deterministic expert rules)
        reasoning, broll_prompt = self._formulate_creative_intervention(target_clip, telemetry_info)

        # 2. Call Veo / generator tool to synthesize new B-roll shot
        broll_clip = generate_broll_clip(target_scene=target_scene, prompt=broll_prompt)

        # 3. Register clip in environment shot pool
        env.register_broll_clip(broll_clip)

        # 4. Inject B-roll into timeline right after the stuck clip
        new_state, success, action_msg = env.apply_action(
            state,
            action_type="insert_broll",
            target_clip_id=stuck_clip_id,
            broll_clip_id=broll_clip.clip_id,
            position="after"
        )

        # 5. Log decision into ClickHouse showrunner_decisions table
        clickhouse_client.insert_showrunner_decision(
            episode_id=state.episode_id,
            decision_type="generate_broll",
            target_scene=target_scene,
            reasoning=reasoning
        )

        intervention_report = {
            "episode_id": state.episode_id,
            "decision_type": "generate_broll",
            "target_clip_id": stuck_clip_id,
            "target_scene": target_scene,
            "broll_clip_id": broll_clip.clip_id,
            "broll_prompt": broll_prompt,
            "reasoning": reasoning,
            "action_message": action_msg
        }

        return new_state, intervention_report

    def _formulate_creative_intervention(self, target_clip: Optional[Clip], telemetry_info: Dict[str, Any]) -> Tuple[str, str]:
        worst_drop = telemetry_info.get("worst_drop", -0.25)
        clip_id = target_clip.clip_id if target_clip else "unknown"

        # If Gemini client is active, request creative directorial reasoning
        if self.gemini_client:
            try:
                prompt = (
                    "You are an acclaimed Hollywood Showrunner supervising the AI editing room for Neuro-Cut. "
                    f"A scene containing clip '{clip_id}' ({target_clip.description if target_clip else ''}) "
                    f"has experienced a severe audience drop-off of {worst_drop*100:.1f}%. "
                    "Simple trimming or alternate takes failed to rescue engagement. "
                    "You must diagnose the pacing flaw and propose a specific B-roll cutaway shot to inject.\n\n"
                    "Respond with JSON ONLY:\n"
                    '{"reasoning": "<directorial diagnosis and strategy>", "broll_prompt": "<visual description of B-roll shot>"}'
                )
                if hasattr(self.gemini_client, "models"):
                    res = self.gemini_client.models.generate_content(
                        model=settings.GEMINI_MODEL,
                        contents=prompt
                    )
                    text = res.text
                else:
                    res = self.gemini_client.generate_content(prompt)
                    text = res.text
                clean_text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                data = json.loads(clean_text)
                return data["reasoning"], data["broll_prompt"]
            except Exception:
                pass

        # Deterministic expert editorial rules fallback
        reasoning = (
            f"Audience telemetry in ClickHouse reveals a severe drop of {abs(worst_drop)*100:.1f}% "
            f"during '{clip_id}'. Trimming frames reached minimum allowable pacing without resolving "
            "visual stagnation. Showrunner intervened: synthesizing a high-tension cutaway insert "
            "to break the static rhythm and re-engage viewer attention."
        )
        broll_prompt = "Extreme close-up nervous glance at clock ticking and clenched hand on revolver"
        return reasoning, broll_prompt
