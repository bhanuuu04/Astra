"""
Heuristic and rule-based detector primitives ported from the threat engine.
Includes homoglyph normalization, Levenshtein distance, suspicious TLD/shortener checks,
and regex extraction for cryptocurrency wallets and mobile APK payloads.
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple

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


def damerau_levenshtein_distance(a: str, b: str) -> int:
    """Calculate true Damerau-Levenshtein edit distance accounting for adjacent transpositions (swaps)."""
    da: Dict[str, int] = {}
    for c in a + b:
        da[c] = 0
    d = [[0] * (len(b) + 2) for _ in range(len(a) + 2)]
    maxdist = len(a) + len(b)
    d[0][0] = maxdist
    for i in range(len(a) + 1):
        d[i + 1][0] = maxdist
        d[i + 1][1] = i
    for j in range(len(b) + 1):
        d[0][j + 1] = maxdist
        d[1][j + 1] = j
    for i in range(1, len(a) + 1):
        db = 0
        for j in range(1, len(b) + 1):
            k = da.get(b[j - 1], 0)
            l = db
            cost = 0 if a[i - 1] == b[j - 1] else 1
            if cost == 0:
                db = j
            d[i + 1][j + 1] = min(
                d[i][j + 1] + 1,
                d[i + 1][j] + 1,
                d[i][j] + cost,
                d[k][l] + (i - k - 1) + 1 + (j - l - 1),
            )
        da[a[i - 1]] = i
    return d[len(a) + 1][len(b) + 1]


LOOKALIKE_ADDED_WORDS: Set[str] = {
    'support', 'help', 'care', 'service', 'desk', 'official',
    'rewards', 'verify', 'security', 'team', 'pay', 'login',
    'portal', 'app', 'claim', 'giveaway', 'wallet', 'bonus',
    'promo', 'assist', 'center', 'global', 'bot', 'airdrop'
}

BENIGN_DECOY_TRIGGERS: Set[str] = {
    'plumbing', 'bakery', 'contractor', 'landscaping', 'restaurant',
    'cafe', 'mechanic', 'dentist', 'hardware', 'construction',
    'electrician', 'roofing', 'salon', 'laundry', 'barber', 'carpentry',
    'pharmacy', 'vet', 'florist', 'bookstore', 'towing', 'cleaners'
}


def detect_lookalike_variations(
    candidate: str,
    brand_name: str,
    content: str = "",
) -> Dict[str, Any]:
    """
    Evaluates whether a candidate string (username, title, domain) is a lookalike variation
    of the authoritative brand name.
    
    Identifies:
    1. CHARACTER_SWAP: Adjacent letter transpositions (e.g. nvoapay vs novapay)
    2. ADDED_WORD: Added high-risk prefixes or suffixes (e.g. novapay_support, official_novapay)
    3. SPACING_CHANGE: Punctuation or spacing insertion (e.g. nova pay, nova-pay vs novapay)
    4. HOMOGLYPH: Visual character confusions (e.g. n0vapay vs novapay)
    5. BENIGN_DECOY_GUARD: Detects benign businesses to prevent false positives (e.g. Nova Pay Plumbing)
    """
    raw_cand = candidate.strip().lower()
    raw_brand = brand_name.strip().lower()
    norm_cand = normalize_homoglyphs(raw_cand)
    norm_brand = normalize_homoglyphs(raw_brand)

    variations: List[str] = []
    matched_words: List[str] = []
    is_benign = False
    details: List[str] = []

    # 1. Benign Decoy Guard
    full_text = f"{candidate} {content}".lower()
    found_benign = [w for w in BENIGN_DECOY_TRIGGERS if w in full_text]
    if found_benign:
        # Check if scam triggers override benign classification
        scam_present = any(trig in full_text for trig in (URGENCY_TRIGGERS + CREDENTIAL_HARVEST_TRIGGERS))
        if not scam_present:
            is_benign = True
            details.append(f"Benign business indicator detected: '{found_benign[0]}'")

    # 2. Spacing / Punctuation Variation
    # Candidate without spaces/hyphens matches brand, but original had spacing
    clean_spacing_cand = re.sub(r'[\s_\-\.]+', '', raw_cand)
    clean_spacing_brand = re.sub(r'[\s_\-\.]+', '', raw_brand)
    if clean_spacing_cand == clean_spacing_brand and raw_cand != raw_brand:
        variations.append("SPACING_CHANGE")
        details.append(f"Spacing/delimiter difference ('{raw_cand}' vs '{raw_brand}')")

    # 3. Character Swap (Damerau distance < Levenshtein distance)
    d_dist = damerau_levenshtein_distance(norm_cand, norm_brand)
    l_dist = levenshtein_distance(norm_cand, norm_brand)
    if d_dist < l_dist and d_dist <= 2 and len(norm_brand) >= 4:
        variations.append("CHARACTER_SWAP")
        details.append(f"Adjacent character transposition detected (Damerau distance: {d_dist})")

    # 4. Added High-Risk Words
    # Check if candidate has brand name plus an added keyword (e.g. novapay_support)
    for word in LOOKALIKE_ADDED_WORDS:
        pattern = rf"(^|[_\-\. ]){re.escape(word)}([_\-\. ]|$)|{re.escape(norm_brand)}[_\-\.]?{re.escape(word)}|{re.escape(word)}[_\-\.]?{re.escape(norm_brand)}"
        if re.search(pattern, raw_cand):
            variations.append("ADDED_WORD")
            matched_words.append(word)
            details.append(f"Added high-risk keyword: '{word}'")

    # 5. Homoglyph Substitution
    if norm_cand == norm_brand and raw_cand != raw_brand and "SPACING_CHANGE" not in variations:
        variations.append("HOMOGLYPH")
        details.append("Visual character/homoglyph substitution")

    return {
        "has_lookalike": len(variations) > 0 and not is_benign,
        "variations": list(set(variations)),
        "matched_added_words": list(set(matched_words)),
        "is_benign_decoy": is_benign,
        "details": details,
        "damerau_distance": d_dist,
        "levenshtein_distance": l_dist,
    }

