import hashlib
import urllib.parse

_GRADIENTS = [
    ("6366f1", "a855f7"),  # indigo → purple
    ("ec4899", "f43f5e"),  # pink → rose
    ("f59e0b", "ef4444"),  # amber → red
    ("10b981", "06b6d4"),  # emerald → cyan
    ("3b82f6", "8b5cf6"),  # blue → violet
    ("14b8a6", "22d3ee"),  # teal → cyan
    ("f97316", "facc15"),  # orange → yellow
    ("8b5cf6", "ec4899"),  # violet → pink
]


def generate_cover_url(title: str) -> str:
    """Generate a deterministic placeholder cover URL based on episode title."""
    digest = hashlib.md5(title.encode()).hexdigest()
    idx = int(digest, 16) % len(_GRADIENTS)
    bg, fg = _GRADIENTS[idx]

    encoded_title = urllib.parse.quote(title[:20])
    return f"https://placehold.co/800x800/{bg}/{fg}.png?text={encoded_title}"
