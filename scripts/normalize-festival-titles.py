#!/usr/bin/env python3
"""
normalize-festival-titles.py
Normaliza comillas tipográficas en títulos de festivals/*.json.
U+2018/U+2019 → ' | U+201C/U+201D → "
Loguea cada título modificado. Corre en onboarding de festival nuevo.
"""
import json, sys, os, re
from pathlib import Path

REPLACEMENTS = {
    '\u2018': "'", '\u2019': "'", '\u02bc': "'", '\u02b9': "'",
    '\u201c': '"', '\u201d': '"', '\u00ab': '"', '\u00bb': '"',
}

def normTitle(t):
    if not t: return t
    for bad, good in REPLACEMENTS.items():
        t = t.replace(bad, good)
    return t

def normalize_json(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    films = data.get('films', [])
    changed = []

    for film in films:
        original = film.get('title', '')
        normalized = normTitle(original)
        if normalized != original:
            changed.append({'original': original, 'normalized': normalized})
            film['title'] = normalized

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return changed

def main():
    festivals_dir = Path(__file__).parent.parent / 'festivals'
    jsons = sorted(festivals_dir.glob('*.json'))

    if not jsons:
        print("No festival JSONs found.")
        return

    total_changed = 0
    for path in jsons:
        changed = normalize_json(path)
        if changed:
            print(f"\n{path.name} — {len(changed)} title(s) normalized:")
            for item in changed:
                print(f"  '{item['original']}' → '{item['normalized']}'")
            total_changed += len(changed)
        else:
            print(f"{path.name} — OK (no changes)")

    print(f"\nTotal: {total_changed} title(s) normalized across {len(jsons)} festival(s).")

if __name__ == '__main__':
    main()
