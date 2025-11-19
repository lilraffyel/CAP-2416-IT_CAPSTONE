"""Utility functions for running Bayesian manual and automatic queries."""

from __future__ import annotations

import sqlite3
from typing import Dict, Optional, Tuple, Union

from prerequisite.prerequisite_api import get_model, determine_next_focus


def _get_connection() -> sqlite3.Connection:
    """Return a SQLite connection configured with row access by name."""

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


def _normalize_score(value: float) -> Union[float, int]:
    """Return an ``int`` when ``value`` is whole, otherwise the original float."""

    if float(value).is_integer():
        return int(value)
    return float(value)


def run_manual_query(
    bif_file: str,
    competency: str,
    score: float,
    total: float,
    student_id: str,
    domain_id: int,
) -> Tuple[Optional[Dict], Optional[str]]:
    """Execute a manual Bayesian query for a competency.

    Returns a tuple of (result, error). When ``error`` is ``None`` the ``result``
    contains the computed mastery probabilities and next focus recommendation.
    """

    if not bif_file:
        return None, "Assessment is not linked to a Bayesian Network"
    if not competency:
        return None, "Missing competency for query"

    model_data = get_model(bif_file)
    if not model_data:
        return None, f"BIF file '{bif_file}' not loaded"

    try:
        score_val = float(score)
        total_val = float(total)
    except (TypeError, ValueError):
        return None, "Invalid score or total value"

    if total_val <= 0:
        return None, "Total must be greater than zero"

    ratio = score_val / total_val

    result: Dict = {
        "competency": competency,
        "score": _normalize_score(score_val),
        "total": _normalize_score(total_val),
        "next_focus": None,
        "mastery_probabilities": None,
    }

    if ratio < 0.7:
        outcome = determine_next_focus(model_data["model"], model_data["infer"], competency, student_id, domain_id, 0)
        result["next_focus"] = outcome.get("next_focus") if outcome else None
        result["mastery_probabilities"] = outcome.get("mastery_probabilities") if outcome else None
    else:
        # Competency is passed. Show the message for any node that is not a bottom-level (leaf) node.
        model = model_data["model"]
        children = model.get_children(competency)
        if children:  # If it has children, it's not a bottom-level node.
            result["next_focus"] = "Competency Passed. Consider focusing on a sibling or parent node."

    return result, None


def run_auto_query(result_id: int) -> Tuple[Optional[Dict], Optional[str]]:
    """Execute an automatic Bayesian query using a stored assessment result."""

    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT sr.student_id, sr.score, sr.total, a.title AS assessment_title, a.bif_file, a.competency_node, a.content_domain_id
        FROM student_results sr
        JOIN assessments a ON sr.assessment_id = a.id
        WHERE sr.id = ?
        """,
        (result_id,),
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None, "Result not found"

    bif_file = row["bif_file"]
    if not bif_file:
        return None, "Assessment is not linked to a Bayesian Network"

    competency_node = row["competency_node"]
    if not competency_node:
        return None, f"Assessment '{row['assessment_title']}' is missing its competency node mapping."

    return run_manual_query(bif_file, competency_node, row["score"], row["total"], row["student_id"], row["content_domain_id"])