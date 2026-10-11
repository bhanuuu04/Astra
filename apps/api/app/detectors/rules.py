"""
Heuristic and rule-based detector primitives ported from the threat engine.
Includes homoglyph normalization, Levenshtein distance, suspicious TLD/shortener checks,
and regex extraction for cryptocurrency wallets and mobile APK payloads.
"""

import re
from typing import Dict, List, Optional, Set, Tuple

HOMOGLYPHS: Dict[str, str] = {
    'а': 'a', 'а́': 'a', 'ä': 'a', '@': 'a', '4': 'a',
    'Ь': 'b', 'в': 'b', '8': 'b',
    'с': 'c', 'ç': 'c', '(': 'c',
    'ԁ': 'd', 'cl': 'd',
    'е': 'e', 'ё': 'e', 'é': 'e', '3': 'e',
    'ɡ': 'g', '9': 'g',
    'һ': 'h',
    'і': 'i', 'í': 'i', '1': 'i', '!': 'i',
    'ј': 'j',
    'k': 'k', 'к': 'k',
    'ӏ': 'l', '|': 'l',
    'м': 'm', 'rn': 'm',
    'п': 'n',
    'о': 'o', 'ö': 'o', '0': 'o', 'ø': 'o',
    'р': 'p',
    'ԛ': 'q',
    'г': 'r',
    'ѕ': 's', '5': 's', '$': 's',
    'т': 't', '7': 't', '+': 't',
    'υ': 'u', 'ü': 'u', 'v': 'u',
    'ν': 'v',
    'w': 'w', 'vv': 'w',
    'х': 'x', '×': 'x',
    'у': 'y', 'ý': 'y',
    'z': 'z', '2': 'z'
}

URL_SHORTENERS: Set[str] = {
    'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rb.gy', 't.me/'
}

HIGH_RISK_TLDS: Set[str] = {
    '.xyz', '.top', '.click', '.ru', '.cfd', '.buzz', '.cam', '.live', '.space', '.tk', '.ml', '.ga', '.work'
}

URGENCY_TRIGGERS: List[str] = [
    'account suspended', 'account scheduled for deletion', 'within 24 hours',
    'immediate action required', 'copyright violation', 'trademark infringement notice',
    'verify your identity', 'security alert', 'unauthorized login detected',
    'wallet verification', 'claim reward', 'airdrop distribution'
]

CREDENTIAL_HARVEST_TRIGGERS: List[str] = [
    'enter your password', 'verify seed phrase', 'recovery phrase', 'provide 2fa code',
    'otp sent', 'fill this form to verify', 'reset credentials', 'connect wallet'
]

ROGUE_APP_TRIGGERS: List[str] = [
    '.apk', '.ipa', 'download our mobile app', 'download the official app here',
    'install app from link', 'new mobile version released', 'updated apk file'
]


def normalize_homoglyphs(text: str) -> str:
    """Normalize string by replacing known lookalike homoglyphs with standard ASCII."""
    result = text.lower()
    for char, rep in HOMOGLYPHS.items():
        result = result.replace(char, rep)
    return re.sub(r'[^a-z0-9]', '', result)


def levenshtein_distance(a: str, b: str) -> int:
    """Calculate standard Levenshtein edit distance between two strings."""
    if len(a) < len(b):
        return levenshtein_distance(b, a)
    if len(b) == 0:
        return len(a)

    previous_row = list(range(len(b) + 1))
    for i, c1 in enumerate(a):
        current_row = [i + 1]
        for j, c2 in enumerate(b):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def calculate_similarity(s1: str, s2: str) -> int:
    """Calculate normalized similarity percentage (0 to 100)."""
    longer = s1 if len(s1) > len(s2) else s2
    shorter = s2 if len(s1) > len(s2) else s1
    if len(longer) == 0:
        return 100
    dist = levenshtein_distance(longer, shorter)
    return round(((len(longer) - dist) / len(longer)) * 100)


def extract_crypto_wallets(content: str) -> List[str]:
    """Extract Ethereum and Bitcoin wallet addresses from raw content."""
    eth = re.findall(r'0x[a-fA-F0-9]{40}', content)
    btc = re.findall(r'[13][a-km-zA-HJ-NP-Z1-9]{25,34}', content)
    return list(set(eth + btc))


def extract_urls(content: str) -> List[str]:
    """Extract URLs from raw content."""
    return re.findall(r'https?://[^\s]+', content)
