import argparse
import importlib
import sys

AVAILABLE_JOBS = {
    "ticker": "ticker.main",
    "thirteenf": "thirteenf.main",
}

def main() -> None:
    parser = argparse.ArgumentParser(
        description="KubeStock Scraper Entry-Point"
    )
    parser.add_argument(
        "job",
        choices=AVAILABLE_JOBS.keys(),
        help="Which scraping job to run",
    )
    args = parser.parse_args()

    module_path = AVAILABLE_JOBS[args.job]
    try:
        mod = importlib.import_module(module_path)
        mod.run()          # 각 모듈에 반드시 run() 함수가 있어야 함
    except Exception as e:
        print(f"[!] {args.job} failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
