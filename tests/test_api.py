import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from backend.main import app

def test_api_endpoints():
    client = TestClient(app)

    # 1. Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    data_health = res_health.json()
    print("Health check:", data_health)
    assert data_health["status"] == "online"

    # 2. Create episode
    res_create = client.post("/api/episodes/create", json={"episode_id": "test_api_ep"})
    assert res_create.status_code == 200
    data_create = res_create.json()
    print("Created episode:", data_create["episode_id"], "Reward:", data_create["reward"])
    assert len(data_create["clips"]) > 0

    # 3. Optimize step
    res_step = client.post("/api/episodes/test_api_ep/optimize/step")
    assert res_step.status_code == 200
    data_step = res_step.json()
    print("Step 1 verdict:", data_step["verdict"], "Reward:", data_step["reward"])

    # 4. Telemetry series
    res_tel = client.get("/api/episodes/test_api_ep/telemetry")
    assert res_tel.status_code == 200
    data_tel = res_tel.json()
    print("Telemetry points count:", data_tel["points_count"])
    assert data_tel["points_count"] > 0

    # 5. Decisions and attempts log
    res_dec = client.get("/api/episodes/test_api_ep/decisions")
    assert res_dec.status_code == 200
    data_dec = res_dec.json()
    print("Logged attempts:", len(data_dec["attempts"]))

    # 6. Force Showrunner intervention
    res_force = client.post("/api/episodes/test_api_ep/showrunner/force-intervention", json={})
    assert res_force.status_code == 200
    data_force = res_force.json()
    print("Forced intervention applied:", data_force["status"])
    assert data_force["status"] == "intervention_applied"

    # 7. Shot pool
    res_pool = client.get("/api/shot-pool")
    assert res_pool.status_code == 200
    data_pool = res_pool.json()
    print("Shot pool shots:", len(data_pool["shots"]))
    assert len(data_pool["shots"]) >= 5

    print(">>> ALL API ENDPOINTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api_endpoints()
