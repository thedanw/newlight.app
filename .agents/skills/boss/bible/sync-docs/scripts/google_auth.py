import os
import re
import stat
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow


SKILL_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = SKILL_DIR / ".env"
ENV_EXAMPLE = SKILL_DIR / ".env.example"


class GoogleAuthConfigurationError(RuntimeError):
    """Raised when Google OAuth configuration is missing or invalid."""


def _parse_quoted_value(value: str):
    quote = value[0]
    chars = []
    escaped = False

    for char in value[1:]:
        if escaped:
            chars.append(char)
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == quote:
            return "".join(chars)
        chars.append(char)

    return None


def load_env_file(env_path: Path) -> None:
    """Load a small dotenv-compatible file without adding a runtime dependency."""
    if not env_path.exists():
        return

    with env_path.open("r", encoding="utf-8") as env_file:
        for line_number, raw_line in enumerate(env_file, start=1):
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[7:].lstrip()
            if "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
                raise GoogleAuthConfigurationError(
                    f"Invalid variable name in {env_path} at line {line_number}."
                )

            value = value.strip()
            if value and value[0] in {"'", '"'}:
                parsed_value = _parse_quoted_value(value)
                if parsed_value is None:
                    raise GoogleAuthConfigurationError(
                        f"Unterminated quoted value in {env_path} at line {line_number}."
                    )
                value = parsed_value

            os.environ.setdefault(key, value)


def _protect_secret_file(path: Path) -> None:
    try:
        path.chmod(stat.S_IRUSR | stat.S_IWUSR)
    except (OSError, NotImplementedError):
        pass


def ensure_env_file() -> None:
    if ENV_FILE.exists():
        return

    SKILL_DIR.mkdir(parents=True, exist_ok=True)
    if ENV_EXAMPLE.exists():
        contents = ENV_EXAMPLE.read_text(encoding="utf-8")
    else:
        contents = (
            "# Preferred: path to the Google OAuth client JSON kept outside this workspace.\n"
            "GOOGLE_OAUTH_CLIENT_CONFIG_PATH=\n\n"
            "# Alternative: set both values from the Google OAuth client JSON.\n"
            "GOOGLE_CLIENT_ID=\n"
            "GOOGLE_CLIENT_SECRET=\n"
            "GOOGLE_OAUTH_REDIRECT_URIS=http://localhost\n\n"
            "# Optional overrides.\n"
            "GOOGLE_OAUTH_TOKEN_PATH=\n"
            "SERMON_PLANNING_DATA_DIR=\n"
        )

    with ENV_FILE.open("w", encoding="utf-8", newline="\n") as env_file:
        env_file.write(contents)
    _protect_secret_file(ENV_FILE)

    raise GoogleAuthConfigurationError(
        f"Created {ENV_FILE}. Populate the Google OAuth setting(s), then rerun the script. "
        "Never commit this file."
    )


def load_google_environment() -> None:
    ensure_env_file()
    load_env_file(ENV_FILE)


def get_oauth_client_config():
    config_path_value = os.environ.get("GOOGLE_OAUTH_CLIENT_CONFIG_PATH", "").strip()
    if config_path_value:
        config_path = Path(config_path_value).expanduser().resolve()
        if not config_path.is_file():
            raise GoogleAuthConfigurationError(
                f"GOOGLE_OAUTH_CLIENT_CONFIG_PATH does not point to a file: {config_path}"
            )
        return config_path, None

    client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()
    if not client_id and not client_secret:
        raise GoogleAuthConfigurationError(
            "Configure GOOGLE_OAUTH_CLIENT_CONFIG_PATH, or set both GOOGLE_CLIENT_ID and "
            f"GOOGLE_CLIENT_SECRET in {ENV_FILE}."
        )
    if not client_id or not client_secret:
        raise GoogleAuthConfigurationError(
            "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set together."
        )

    redirect_uris = [
        item.strip()
        for item in os.environ.get("GOOGLE_OAUTH_REDIRECT_URIS", "http://localhost").split(",")
        if item.strip()
    ] or ["http://localhost"]

    client_config = {
        "installed": {
            "client_id": client_id,
            "project_id": os.environ.get("GOOGLE_PROJECT_ID", "sermon-planning"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_secret": client_secret,
            "redirect_uris": redirect_uris,
        }
    }
    return None, client_config


def get_token_path() -> Path:
    override = os.environ.get("GOOGLE_OAUTH_TOKEN_PATH", "").strip()
    if override:
        return Path(override).expanduser().resolve()

    data_root_value = os.environ.get("SERMON_PLANNING_DATA_DIR", "").strip()
    if data_root_value:
        data_root = Path(data_root_value).expanduser()
    elif os.name == "nt":
        local_app_data = os.environ.get("LOCALAPPDATA")
        if not local_app_data:
            raise GoogleAuthConfigurationError(
                "LOCALAPPDATA is unavailable; set SERMON_PLANNING_DATA_DIR or "
                "GOOGLE_OAUTH_TOKEN_PATH."
            )
        data_root = Path(local_app_data)
    else:
        data_root = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))

    return data_root / "SermonPlanning" / "sync-docs" / "token.json"


def authenticate(scopes):
    load_google_environment()
    token_path = get_token_path()

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(token_path, scopes)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            config_path, client_config = get_oauth_client_config()
            if config_path:
                flow = InstalledAppFlow.from_client_secrets_file(config_path, scopes)
            else:
                flow = InstalledAppFlow.from_client_config(client_config, scopes)
            creds = flow.run_local_server(port=0)

        token_path.parent.mkdir(parents=True, exist_ok=True)
        with token_path.open("w", encoding="utf-8") as token_file:
            token_file.write(creds.to_json())
        _protect_secret_file(token_path)

    return creds


if __name__ == "__main__":
    print(f"Skill directory: {SKILL_DIR}")
    print(f"Environment file: {ENV_FILE}")
    print(f"Token file: {get_token_path()}")
