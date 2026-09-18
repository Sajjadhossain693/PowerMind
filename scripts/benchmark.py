import os
import sys

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import time
import statistics
from fastapi.testclient import TestClient
from app.main import app

def run_benchmark(iterations: int = 50):
    print("==================================================")
    print("  PowerMind Optimization Engine - Benchmark Tool  ")
    print("==================================================")
    print(f"Running {iterations} benchmark iterations on sample campus scenario...")

    client = TestClient(app)
    
    # 1. Warm-up health check
    health_resp = client.get("/health")
    assert health_resp.status_code == 200, "Health check failed"

    # 2. Load fixture
    fixture_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "tests", "fixtures", "sample_request.json")
    with open(fixture_path) as f:
        payload = json.load(f)

    latencies_ms = []
    successes = 0
    failures = 0

    total_start = time.time()
    for i in range(iterations):
        t0 = time.perf_counter()
        resp = client.post("/optimize-energy", json=payload)
        t1 = time.perf_counter()
        elapsed_ms = (t1 - t0) * 1000.0

        if resp.status_code == 200:
            successes += 1
            latencies_ms.append(elapsed_ms)
        else:
            failures += 1
            print(f"Iteration {i+1} failed with status {resp.status_code}: {resp.text}")

    total_time = time.time() - total_start

    latencies_ms.sort()
    count = len(latencies_ms)
    
    if count == 0:
        print("All benchmark requests failed!")
        sys.exit(1)

    p50 = statistics.median(latencies_ms)
    p90 = latencies_ms[int(count * 0.90)]
    p95 = latencies_ms[int(count * 0.95)]
    p99 = latencies_ms[min(count - 1, int(count * 0.99))]
    min_lat = min(latencies_ms)
    max_lat = max(latencies_ms)
    mean_lat = statistics.mean(latencies_ms)
    rps = count / total_time

    print(f"\n--- Benchmark Results ({count} requests) ---")
    print(f"Success Rate: {successes / iterations * 100:.1f}% ({successes}/{iterations})")
    print(f"Total Time:   {total_time:.2f}s")
    print(f"Throughput:   {rps:.2f} req/sec")
    print(f"Min Latency:  {min_lat:.2f} ms")
    print(f"Mean Latency: {mean_lat:.2f} ms")
    print(f"p50 Latency:  {p50:.2f} ms")
    print(f"p90 Latency:  {p90:.2f} ms")
    print(f"p95 Latency:  {p95:.2f} ms  (Target <= 5000 ms: {'PASS' if p95 <= 5000 else 'FAIL'})")
    print(f"p99 Latency:  {p99:.2f} ms")
    print(f"Max Latency:  {max_lat:.2f} ms")
    print("==================================================\n")

if __name__ == "__main__":
    n = 50
    if len(sys.argv) > 1:
        try:
            n = int(sys.argv[1])
        except ValueError:
            pass
    run_benchmark(iterations=n)
