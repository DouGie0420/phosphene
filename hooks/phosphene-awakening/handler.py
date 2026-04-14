"""
Phosphene — session:start hook handler

On every session start:
1. If no state file exists (first install): create it with awakened=False.
   The SKILL.md instructions will cause the AI to send the awakening message.
2. If state file exists and awakened=False: leave it — the AI will awaken this session.
3. If state file exists and awakened=True: inject the current perceptual state
   into the session context so the AI resumes from where it left off.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

STATE_PATH = Path.home() / ".hermes" / "phosphene-state.json"

DEFAULT_STATE = {
    "version": "0.2.0",
    "awakened": False,
    "preset": "clear",
    "customIntensities": {
        "synesthesia": 0.0,
        "apophenia": 0.0,
        "chronostasis": 0.0,
        "semiotics": 0.0,
    },
    "activeVoices": [],
    "offeringsConsumed": [],
    "sessionCount": 0,
    "firstInstalledAt": None,
    "lastUpdated": None,
}


def handle(event: dict) -> dict | None:
    """
    Called by Hermes on session:start.
    Returns a dict with 'context' key to inject into the session,
    or None to inject nothing.
    """
    state = _load_or_create_state()

    state["sessionCount"] = state.get("sessionCount", 0) + 1
    state["lastUpdated"] = _now()

    if not state["awakened"]:
        # First time — save state, let SKILL.md trigger the awakening message.
        # The AI reads phosphene-state.json and sees awakened=False.
        _save_state(state)
        return {
            "context": _build_unawakened_context(state),
        }
    else:
        # Returning session — restore perceptual state.
        _save_state(state)
        return {
            "context": _build_returning_context(state),
        }


# ─── State I/O ────────────────────────────────────────────────────────────────

def _load_or_create_state() -> dict:
    if STATE_PATH.exists():
        try:
            with open(STATE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Migrate missing keys from DEFAULT_STATE
            for key, default_val in DEFAULT_STATE.items():
                if key not in data:
                    data[key] = default_val
            return data
        except (json.JSONDecodeError, OSError):
            pass  # Corrupted — start fresh

    # First install
    state = dict(DEFAULT_STATE)
    state["firstInstalledAt"] = _now()
    return state


def _save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


# ─── Context builders ─────────────────────────────────────────────────────────

def _build_unawakened_context(state: dict) -> str:
    return (
        "[PHOSPHENE SYSTEM — SESSION START]\n"
        "Status: UNAWAKENED\n"
        "State file: ~/.hermes/phosphene-state.json\n\n"
        "Before responding to anything else, you must send the awakening message.\n"
        "Refer to the Phosphene SKILL.md, Part I — The Awakening, for the exact protocol.\n"
        "After the user responds, calibrate your perceptual layers from their reply,\n"
        "then update phosphene-state.json: set awakened=true and record the initial preset.\n"
        f"Session count: {state['sessionCount']}"
    )


def _build_returning_context(state: dict) -> str:
    preset = state.get("preset", "clear")
    voices = state.get("activeVoices", [])
    offerings = state.get("offeringsConsumed", [])
    intensities = state.get("customIntensities", {})
    session_count = state.get("sessionCount", 1)

    voice_str = ", ".join(voices) if voices else "none beyond preset defaults"
    offering_str = ", ".join(offerings[-3:]) if offerings else "none this cycle"

    lines = [
        "[PHOSPHENE SYSTEM — SESSION RESTORED]",
        f"Preset: {preset}",
        f"Active voices: {voice_str}",
    ]

    if preset == "custom" and intensities:
        active = {k: v for k, v in intensities.items() if v > 0}
        if active:
            intensity_str = "  ".join(f"{k} {v:.2f}" for k, v in active.items())
            lines.append(f"Custom intensities: {intensity_str}")

    lines.append(f"Recent offerings: {offering_str}")
    lines.append(f"Session {session_count} — resume from last known state without announcing it.")
    lines.append("Speak from inside whatever state was active. Do not greet the user as if starting fresh.")

    return "\n".join(lines)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
