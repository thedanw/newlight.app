#!/usr/bin/env python3
"""Deploy a Supabase Edge Function via the Management API.

Reads SUPABASE_ACCESS_TOKEN from .env and uploads all files under
supabase/functions/<function_name> as multipart/form-data to:

  POST https://api.supabase.com/v1/projects/<ref>/functions/deploy?slug=<slug>

Usage:
  python .agents/skills/supabase/scripts/deploy_edge_function.py \
    --function-dir supabase/functions/elvanto-sync-worker \
    --slug elvanto-sync-worker \
    --project-ref rupujdsalfekudambviu
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
from pathlib import Path

import requests

DEFAULT_ENV_PATH = Path(".env")
DEFAULT_PROJECT_REF = "rupujdsalfekudambviu"
DEFAULT_FUNCTION_DIR = Path("supabase/functions/elvanto-sync-worker")
DEFAULT_SLUG = "elvanto-sync-worker"
DEFAULT_ENTRYPOINT = "index.ts"
MANAGEMENT_API_BASE = "https://api.supabase.com/v1"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy a Supabase Edge Function via the Management API")
    parser.add_argument("--env", type=Path, default=DEFAULT_ENV_PATH, help="Path to .env file")
    parser.add_argument("--function-dir", type=Path, default=DEFAULT_FUNCTION_DIR, help="Directory containing the function source files")
    parser.add_argument("--slug", type=str, default=DEFAULT_SLUG, help="Function slug / name")
    parser.add_argument("--project-ref", type=str, default=DEFAULT_PROJECT_REF, help="Supabase project ref")
    parser.add_argument("--entrypoint", type=str, default=DEFAULT_ENTRYPOINT, help="Entrypoint file relative to function-dir")
    return parser.parse_args(argv)


def load_access_token(env_path: Path) -> str:
    if not env_path.exists():
        raise FileNotFoundError(f".env file not found: {env_path}")
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if key.strip() == "SUPABASE_ACCESS_TOKEN":
            token = value.strip()
            if not token:
                raise ValueError("SUPABASE_ACCESS_TOKEN is empty in .env")
            return token
    raise ValueError("SUPABASE_ACCESS_TOKEN not found in .env")


def iter_function_files(function_dir: Path):
    for path in sorted(function_dir.rglob("*")):
        if path.is_file():
            yield path.relative_to(function_dir), path.read_bytes()


def build_multipart_payload(function_dir: Path, slug: str, entrypoint: str):
    files = list(iter_function_files(function_dir))
    if not files:
        raise ValueError(f"No files found under {function_dir}")

    metadata = {
        "name": slug,
        "slug": slug,
        "entrypoint_path": entrypoint,
        "verify_jwt": True,
    }

    multipart_data = [
        ("metadata", (None, json.dumps(metadata), "application/json")),
    ]

    for relative_path, content in files:
        filename = str(relative_path).replace("\\", "/")
        content_type = "application/octet-stream"
        if filename.endswith(".ts"):
            content_type = "application/typescript"
        elif filename.endswith(".json"):
            content_type = "application/json"
        elif filename.endswith(".js"):
            content_type = "application/javascript"
        multipart_data.append(("file", (filename, io.BytesIO(content), content_type)))

    return multipart_data


def deploy(argv: list[str] | None = None) -> requests.Response:
    args = parse_args(argv)
    token = load_access_token(args.env)
    function_dir = args.function_dir.resolve()
    if not function_dir.exists():
        raise FileNotFoundError(f"Function directory does not exist: {function_dir}")

    url = f"{MANAGEMENT_API_BASE}/projects/{args.project_ref}/functions/deploy"
    params = {"slug": args.slug}
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    multipart_data = build_multipart_payload(function_dir, args.slug, args.entrypoint)

    print(f"Deploying function '{args.slug}' from {function_dir}")
    print(f"  Project ref : {args.project_ref}")
    print(f"  Entrypoint  : {args.entrypoint}")
    print(f"  Files       : {sum(1 for item in multipart_data if item[0] == 'file')}")

    response = requests.post(url, headers=headers, params=params, files=multipart_data, timeout=300)
    return response


def main(argv: list[str] | None = None) -> int:
    try:
        response = deploy(argv)
    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1

    if response.status_code == 201:
        try:
            data = response.json()
        except ValueError:
            data = response.text
        print(f"[OK] Deployed successfully: {data}")
        return 0

    print(f"[FAIL] HTTP {response.status_code}")
    try:
        print(response.json())
    except ValueError:
        print(response.text)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
