import os
import shutil
from pathlib import Path
from pydantic_settings import BaseSettings

# Locate FFmpeg binary
def get_ffmpeg_binary() -> str:
    """Locates FFmpeg binary from PATH or imageio_ffmpeg."""
    which_ffmpeg = shutil.which("ffmpeg")
    if which_ffmpeg:
        return which_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass
    return "ffmpeg"

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
SHOTS_DIR = DATA_DIR / "shots"
COMPILED_DIR = DATA_DIR / "compiled_cuts"
BROLL_DIR = DATA_DIR / "broll"

for directory in [DATA_DIR, SHOTS_DIR, COMPILED_DIR, BROLL_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "Neuro-Cut Backend"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000

    # Google Gemini & ADK
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ClickHouse Cloud / Local
    CLICKHOUSE_HOST: str = os.getenv("CLICKHOUSE_HOST", "localhost")
    CLICKHOUSE_PORT: int = int(os.getenv("CLICKHOUSE_PORT", "8123"))
    CLICKHOUSE_USER: str = os.getenv("CLICKHOUSE_USER", "default")
    CLICKHOUSE_PASSWORD: str = os.getenv("CLICKHOUSE_PASSWORD", "")
    CLICKHOUSE_DATABASE: str = os.getenv("CLICKHOUSE_DATABASE", "neurocut")
    CLICKHOUSE_SECURE: bool = os.getenv("CLICKHOUSE_SECURE", "false").lower() in ("true", "1", "yes")

    # MCP ClickHouse server
    MCP_CLICKHOUSE_COMMAND: str = os.getenv("MCP_CLICKHOUSE_COMMAND", "npx -y @clickhouse/mcp-server")

    # FFmpeg executable
    FFMPEG_PATH: str = get_ffmpeg_binary()

    # Paths
    BASE_DIR: Path = BASE_DIR
    PROJECT_DIR: Path = PROJECT_DIR
    DATA_DIR: Path = DATA_DIR
    SHOTS_DIR: Path = SHOTS_DIR
    COMPILED_DIR: Path = COMPILED_DIR
    BROLL_DIR: Path = BROLL_DIR

    # Phase 1 vs Later Phases toggles
    SCORER_MODE: str = os.getenv("SCORER_MODE", "heuristic")  # "heuristic" (Phase 1) | "qwen_swarm" (Phase 2)
    OPTIMIZER_MODE: str = os.getenv("OPTIMIZER_MODE", "beam_search")  # "beam_search" (Phase 1) | "ppo" (Phase 3)
    SHOWRUNNER_STUCK_THRESHOLD: int = 2  # Attempts with drop-off before Showrunner B-roll intervention

    # Phase 3 PPO Reinforcement Learning Hyperparameters
    PPO_CLIP_EPS: float = 0.2
    PPO_GAMMA: float = 0.99
    PPO_GAE_LAMBDA: float = 0.95
    PPO_ENTROPY_COEFF: float = 0.01
    PPO_LR: float = 3e-4

    class Config:
        env_file = PROJECT_DIR / ".env"
        extra = "ignore"

settings = Settings()
