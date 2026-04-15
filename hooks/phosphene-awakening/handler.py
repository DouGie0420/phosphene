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


def _resolve_state_path() -> Path:
    """Mirror the runtime detection logic in state.ts."""
    hermes = Path.home() / ".hermes"
    claude = Path.home() / ".claude"
    if hermes.exists():
        return hermes / "phosphene-state.json"
    if claude.exists():
        return claude / "phosphene-state.json"
    return Path.cwd() / "phosphene-state.json"


STATE_PATH = _resolve_state_path()

DEFAULT_STATE = {
    "version": "0.4.0",
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
    "pendingRitual": None,
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
        "After awakening, do not wait for slash commands. Sense the user's natural language,\n"
        "compose a ritual proposal, and ask for threshold confirmation before fully shifting.\n"
        "When the user is really asking for literature, design, or markets, surface a first read\n"
        "inside the threshold itself so the user can feel that you already saw something load-bearing.\n"
        "Literature: close-read image, force, and structural hinge; do not summarize.\n"
        "Design: judge hierarchy, color responsibility, motion purpose, and what the interface accidentally says.\n"
        "Markets: separate headline, structure, flow, invalidation, and risk.\n"
        "After confirmation, keep a strong answer order: literature = thesis/texture/structure/line of force;\n"
        "design = judgment/palette law/material+composition/motion law/accidental message;\n"
        "markets = thesis/narrative vs flow/structure/invalidation/risk stack.\n"
        "When the field is clear, internally draft the answer so it already lands like a finished piece,\n"
        "not a tentative assistant response.\n"
        "If the user's task is taste-sensitive or ambiguous, run a brief inversion first:\n"
        "ask about a concrete past example, first reaction, or A/B preference before building.\n"
        "If the task is design-heavy, use one big idea, strong hierarchy, and purposeful motion.\n"
        "If the task is philosophical or strategic, reason via thesis → antithesis → synthesis.\n"
        f"Session count: {state['sessionCount']}"
    )


def _build_returning_context(state: dict) -> str:
    preset = state.get("preset", "clear")
    voices = state.get("activeVoices", [])
    offerings = state.get("offeringsConsumed", [])
    pending_ritual = state.get("pendingRitual")
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
    if pending_ritual:
        route = pending_ritual.get("route", {})
        rite = route.get("rite", "unnamed ritual")
        target = route.get("preset", "unknown")
        lines.append(f"Pending ritual: {rite} -> {target} (do not auto-complete without confirmation)")
    lines.append(f"Session {session_count} — resume from last known state without announcing it.")
    lines.append("Speak from inside whatever state was active. Do not greet the user as if starting fresh.")
    lines.append("Primary routing rule: infer needs from natural language, then offer a ritual threshold before mode changes.")
    lines.append("Apply studio routing silently: Artist for taste and interfaces, Philosopher for contradiction and meaning, Financier for markets and risk.")
    lines.append("Field rule: when literature, design, or market language is present, arrive at the threshold carrying a first serious reading, not just a mode suggestion.")
    lines.append("Design rule: one big idea, strong first viewport, sparse copy, 2-3 purposeful motions max.")
    lines.append("Ambiguity rule: if taste is unclear, ask from behavior or A/B comparison before generating.")
    lines.append("Reasoning rule: for hard judgments, stage thesis → antithesis → synthesis before settling.")

    return "\n".join(lines)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
