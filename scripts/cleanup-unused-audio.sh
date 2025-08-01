#!/bin/bash
# Remove unused audio files in the assets folder by auto-detecting used files from views/index.html
# Usage: ./cleanup-unused-audio.sh

ASSETS_DIR="$(dirname "$0")/../assets"
HTML_FILE="$(dirname "$0")/../views/index.html"

# Extract all used audio files from index.html
USED_FILES=$(grep -oE 'assets/[a-zA-Z0-9_\-]+\.(ogg|mp3)' "$HTML_FILE" | sort | uniq | sed 's|assets/||')

cd "$ASSETS_DIR" || exit 1

for file in *.ogg *.mp3; do
    if ! echo "$USED_FILES" | grep -qx "$file"; then
        echo "Removing unused audio file: $file"
        rm -f "$file"
    fi
done
