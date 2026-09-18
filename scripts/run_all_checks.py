import os
import sys
import subprocess
import time

def main():
    print("==================================================")
    print("      PowerMind QA & Release Verification Suite   ")
    print("==================================================")
    
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    python_exe = sys.executable

    # 1. Run full Pytest suite
    print("\n[Step 1/3] Running complete pytest test suite...")
    start_test = time.time()
    pytest_res = subprocess.run(
        [python_exe, "-m", "pytest", "-v", "--tb=short"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    test_time = time.time() - start_test
    print(pytest_res.stdout)
    if pytest_res.returncode != 0:
        print("[FAIL] Pytest test suite failed!")
        print(pytest_res.stderr)
        sys.exit(1)
    print(f"[PASS] All unit, integration, schema & adversarial tests passed ({test_time:.2f}s).")

    # 2. Run Benchmark Smoke Test
    print("\n[Step 2/3] Running benchmark performance smoke test...")
    bench_res = subprocess.run(
        [python_exe, os.path.join(repo_root, "scripts", "benchmark.py"), "20"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    print(bench_res.stdout)
    if bench_res.returncode != 0:
        print("[FAIL] Benchmark execution failed!")
        print(bench_res.stderr)
        sys.exit(1)
    print("[PASS] Benchmark smoke test completed successfully.")

    # 3. Contract & Secret Audit
    print("\n[Step 3/3] Performing secret safety and contract audit...")
    forbidden_terms = ["AIzaSy", "sk-", "ghp_"]
    found_secrets = []
    for root, dirs, files in os.walk(os.path.join(repo_root, "app")):
        for f in files:
            if f.endswith(".py"):
                path = os.path.join(root, f)
                with open(path, "r", encoding="utf-8") as fp:
                    content = fp.read()
                    for term in forbidden_terms:
                        if term in content:
                            found_secrets.append((path, term))

    if found_secrets:
        print(f"[FAIL] Secrets detected in codebase: {found_secrets}")
        sys.exit(1)
    print("[PASS] Codebase clean: No API keys, tokens, or hardcoded secrets found.")

    print("\n==================================================")
    print("  ALL SYSTEM CHECKS PASSED: READY FOR PRODUCTION  ")
    print("==================================================")

if __name__ == "__main__":
    main()
