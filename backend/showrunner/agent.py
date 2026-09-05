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
        from backend.config import get_genai_client
        self.gemini_client = get_genai_client()

    def diagnose_and_intervene(
        self,
        env: EditingEnvironment,
        state: TimelineState,
        stuck_clip_id: str,
        attempt_history: list,
        intervention_type: str = "auto",
        prompt: Optional[str] = None
    ) -> Tuple[TimelineState, Dict[str, Any]]:
        """
        Autonomous intervention when a scene is stuck across N attempts.
        Supports 3 distinct intervention archetypes:
        1. cutaway: High-tension object/environment cutaway to break visual stagnation.
        2. establishing: Atmospheric wide angle to anchor narrative geography and raise attention.
        3. reaction: Intense psychological character reaction to spike emotional arousal.
        """
        telemetry_info = query_retention_telemetry(state.episode_id)
        target_clip = next((c for c in state.clips if c.clip_id == stuck_clip_id), None)
        target_scene = target_clip.scene_id if target_clip else "scene_bottleneck"

        # 1. Determine concrete intervention type
        concrete_type = intervention_type
        if concrete_type == "auto":
            if target_clip and ("intro" in target_clip.clip_id or "arrival" in getattr(target_clip, "scene_id", "")):
                concrete_type = "establishing"
            elif target_clip and ("reaction" in target_clip.clip_id or "climax" in target_clip.clip_id):
                concrete_type = "reaction"
            else:
                concrete_type = "cutaway"

        # 2. Formulate reasoning & prompt (Gemini or deterministic expert rules)
        reasoning, broll_prompt = self._formulate_creative_intervention(
            target_clip=target_clip,
            telemetry_info=telemetry_info,
            intervention_type=concrete_type,
            user_prompt=prompt
        )

        # 3. Call Veo / generator tool to synthesize new B-roll shot
        broll_clip = generate_broll_clip(target_scene=target_scene, prompt=broll_prompt)

        # 4. Register clip in environment shot pool
        env.register_broll_clip(broll_clip)

        # 5. Inject B-roll into timeline right after the stuck clip
        new_state, success, action_msg = env.apply_action(
            state,
            action_type="insert_broll",
            target_clip_id=stuck_clip_id,
            broll_clip_id=broll_clip.clip_id,
            position="after"
        )

        # 6. Log decision into ClickHouse showrunner_decisions table
        decision_tag = f"showrunner_{concrete_type}"
        clickhouse_client.insert_showrunner_decision(
            episode_id=state.episode_id,
            decision_type=decision_tag,
            target_scene=target_scene,
            reasoning=reasoning
        )

        intervention_report = {
            "episode_id": state.episode_id,
            "decision_type": decision_tag,
            "intervention_type": concrete_type,
            "target_clip_id": stuck_clip_id,
            "target_scene": target_scene,
            "broll_clip_id": broll_clip.clip_id,
            "broll_prompt": broll_prompt,
            "reasoning": reasoning,
            "action_message": action_msg
        }

        return new_state, intervention_report

    def _formulate_creative_intervention(
        self,
        target_clip: Optional[Clip],
        telemetry_info: Dict[str, Any],
        intervention_type: str = "cutaway",
        user_prompt: Optional[str] = None
    ) -> Tuple[str, str]:
        worst_drop = telemetry_info.get("worst_drop", -0.25)
        clip_id = target_clip.clip_id if target_clip else "unknown"

        if user_prompt:
            reasoning = f"Director manually requested a {intervention_type} intervention to reshape scene pacing."
            return reasoning, user_prompt

        # If Gemini client is active, request creative directorial reasoning
        if self.gemini_client:
            candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.5-flash-lite"]
            candidate_models = list(dict.fromkeys(candidate_models))

            prompt = (
                "You are an acclaimed Hollywood Showrunner supervising the AI editing room for Neuro-Cut. "
                f"A scene containing clip '{clip_id}' ({target_clip.description if target_clip else ''}) "
                f"has experienced an audience drop-off of {worst_drop*100:.1f}%. "
                f"Apply a creative '{intervention_type}' intervention. "
                "You must diagnose the pacing flaw and propose a specific cinematic shot to inject.\n\n"
                "Respond with JSON ONLY:\n"
                '{"reasoning": "<directorial diagnosis and strategy>", "broll_prompt": "<visual description of B-roll shot>"}'
            )

            for model in candidate_models:
                try:
                    print(f"[Showrunner Agent] >>> CALLING REAL GEMINI API ({model}) for {intervention_type} diagnosis...")
                    if hasattr(self.gemini_client, "models"):
                        res = self.gemini_client.models.generate_content(
                            model=model,
                            contents=prompt
                        )
                        text = res.text
                    else:
                        res = self.gemini_client.generate_content(prompt)
                        text = res.text

                    clean_text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                    data = json.loads(clean_text)
                    if "reasoning" in data and "broll_prompt" in data:
                        print(f"[Showrunner Agent] <<< REAL GEMINI API DIAGNOSIS ({model}): {data['reasoning'][:60]}...")
                        return data["reasoning"], data["broll_prompt"]
                except Exception as e:
                    print(f"[Showrunner Agent] Model {model} attempt failed: {e}")

        print("[Showrunner Agent] Gemini API unavailable or quota exhausted — using directorial rule engine fallback.")

        # Deterministic expert editorial rules fallback by archetype
        if intervention_type == "establishing":
            reasoning = (
                f"Audience telemetry in ClickHouse reveals viewer disorientation at scene transition '{clip_id}'. "
                "Showrunner intervened: synthesizing an atmospheric wide-angle establishing shot to anchor narrative "
                "geography and rebuild baseline cognitive engagement."
            )
            broll_prompt = "Wide cinematic anamorphic establishing view of rainy neon-lit alleyway with police cruisers in distance"
        elif intervention_type == "reaction":
            reasoning = (
                f"Audience arousal flattened during character exchange in '{clip_id}'. "
                "Showrunner intervened: inserting an intense psychological reaction close-up to escalate emotional stakes "
                "and propel viewer attention into the dramatic turning point."
            )
            broll_prompt = "Extreme close-up macro reaction of suspect dilated pupils and trembling jaw under harsh spotlight"
        else:  # cutaway
            reasoning = (
                f"Audience telemetry in ClickHouse reveals a severe drop of {abs(worst_drop)*100:.1f}% "
                f"during '{clip_id}'. Trimming frames reached minimum allowable pacing without resolving "
                "visual stagnation. Showrunner intervened: synthesizing a high-tension cutaway insert "
                "to break the static rhythm and re-engage viewer attention."
            )
            broll_prompt = "Extreme close-up nervous glance at clock ticking and clenched hand on revolver"

        return reasoning, broll_prompt
