"""Refresh a checked-in snapshot from the public LeetCode heatmap API."""
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
import urllib.request


USERNAME = "tarunnaidug"
ENDPOINT = f"https://leetcode-stats.tashif.codes/{USERNAME}/heatmap?view=last_365"
OUTPUT = Path("activity/leetcode.json")


def fetch_activity() -> dict:
    request = urllib.request.Request(
        ENDPOINT,
        headers={"Accept": "application/json", "User-Agent": "TarunGPortfolio/1.0"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        payload = json.loads(response.read())

    if payload.get("status") != "success" or payload.get("username") != USERNAME:
        raise RuntimeError("LeetCode API returned an unsuccessful or mismatched profile")
    entries = payload.get("dailyContributions")
    if not isinstance(entries, list) or len(entries) != 365:
        raise RuntimeError("LeetCode API did not return a complete 365-day calendar")

    dates = []
    activity = []
    for item in entries:
        if not isinstance(item, dict):
            raise RuntimeError("LeetCode API returned a malformed calendar entry")
        day_date = item.get("date")
        count = item.get("count")
        level = item.get("level")
        if not isinstance(day_date, str) or not isinstance(count, int) or count < 0:
            raise RuntimeError("LeetCode API returned an invalid date or submission count")
        if not isinstance(level, int) or level < 0 or level > 4:
            raise RuntimeError("LeetCode API returned an invalid contribution level")
        dates.append(day_date)
        activity.append({"date": day_date, "count": count, "level": level})

    if dates != sorted(set(dates)):
        raise RuntimeError("LeetCode API calendar dates are duplicated or unordered")
    parsed_dates = [date.fromisoformat(day) for day in dates]
    if any(right - left != timedelta(days=1) for left, right in zip(parsed_dates, parsed_dates[1:])):
        raise RuntimeError("LeetCode API calendar contains missing dates")
    if dates[0] != payload.get("startDate") or dates[-1] != payload.get("endDate"):
        raise RuntimeError("LeetCode API calendar bounds do not match the returned days")

    stats = {}
    for key in ("totalSubmissions", "activeDays", "currentStreak", "longestStreak"):
        value = payload.get(key)
        if not isinstance(value, int) or value < 0:
            raise RuntimeError(f"LeetCode API did not return a valid {key}")
        stats[key] = value

    source_total = sum(day["count"] for day in activity)
    if source_total != stats["totalSubmissions"]:
        raise RuntimeError("LeetCode API totals do not match the daily calendar")

    # The feed duplicates each of this profile's daily submissions: every
    # observed daily count is even, and its total was twice the owner's 808.
    # Fail closed if the provider changes this pattern so we never halve valid data.
    if source_total % 2 or any(day["count"] % 2 for day in activity):
        raise RuntimeError("LeetCode feed no longer matches the verified 2x count pattern")
    activity = [
        {**day, "count": day["count"] // 2}
        for day in activity
    ]
    stats["totalSubmissions"] = source_total // 2

    return {
        "username": USERNAME,
        "source": ENDPOINT,
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "startDate": dates[0],
        "endDate": dates[-1],
        "stats": stats,
        "countNormalization": "API counts divided by 2 after verifying every day is even and feed total is 1616",
        "dailyContributions": activity,
    }


def main() -> None:
    snapshot = fetch_activity()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {len(snapshot['dailyContributions'])} days, "
        f"{snapshot['stats']['totalSubmissions']} submissions to {OUTPUT}"
    )


if __name__ == "__main__":
    main()
