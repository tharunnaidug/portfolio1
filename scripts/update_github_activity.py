"""Refresh the public GitHub contributions snapshot for the static portfolio."""
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
import urllib.request


USERNAME = "tharunnaidug"
ENDPOINT = f"https://github-contributions-api.jogruber.de/v4/{USERNAME}?y=last"
OUTPUT = Path("activity/github.json")


def fetch_activity() -> dict:
    request = urllib.request.Request(
        ENDPOINT,
        headers={"Accept": "application/json", "User-Agent": "TarunGPortfolio/1.0"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.loads(response.read())

    entries = payload.get("contributions")
    if not isinstance(entries, list) or len(entries) < 365:
        raise RuntimeError("GitHub API did not return a full year of contributions")

    normalized = []
    for item in entries:
        if not isinstance(item, dict):
            raise RuntimeError("GitHub API returned a malformed calendar entry")
        day = item.get("date")
        count = item.get("count")
        level = item.get("level")
        if not isinstance(day, str) or not isinstance(count, int) or count < 0:
            raise RuntimeError("GitHub API returned an invalid date or count")
        if not isinstance(level, int) or not 0 <= level <= 4:
            raise RuntimeError("GitHub API returned an invalid contribution level")
        date.fromisoformat(day)
        normalized.append({"date": day, "count": count, "level": level})

    normalized.sort(key=lambda item: item["date"])
    if len({day["date"] for day in normalized}) != len(normalized):
        raise RuntimeError("GitHub API returned duplicate dates")
    last_365 = normalized[-365:]
    parsed = [date.fromisoformat(day["date"]) for day in last_365]
    if any(right - left != timedelta(days=1) for left, right in zip(parsed, parsed[1:])):
        raise RuntimeError("GitHub API calendar has missing dates")

    return {
        "username": USERNAME,
        "source": ENDPOINT,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "startDate": last_365[0]["date"],
        "endDate": last_365[-1]["date"],
        "totalContributions": sum(day["count"] for day in last_365),
        "dailyContributions": last_365,
    }


def main() -> None:
    snapshot = fetch_activity()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {len(snapshot['dailyContributions'])} days, "
        f"{snapshot['totalContributions']} contributions to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
