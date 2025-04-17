#!/bin/bash
set -e

declare -A SECRETS
SECRETS=(
  ["stocks-secret"]="stocks/.env"
  ["news-secret"]="news/.env"
  ["db-secret"]="db/.env"
)

echo "1. Starting secret creation process..."

for SECRET_NAME in "${!SECRETS[@]}"; do
  ENV_PATH="${SECRETS[$SECRET_NAME]}"
  
  echo ""
  echo "[*] Processing $SECRET_NAME (from $ENV_PATH)"

  # Check if .env file exists
  if [ ! -f "$ENV_PATH" ]; then
    echo "[X] Error: .env file not found at $ENV_PATH, You can use .env.example file with 'cp .env.example .env'"
    continue
  fi

  # Check that all keys in the .env file have non-empty values
  MISSING_KEYS=()
  while IFS='=' read -r key value; do
    # Ignore comments and blank lines
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

    if [ -z "$value" ]; then
      MISSING_KEYS+=("$key")
    fi
  done < "$ENV_PATH"

  if [ ${#MISSING_KEYS[@]} -ne 0 ]; then
    echo "[X] Error: The following keys in $ENV_PATH have empty values:"
    for k in "${MISSING_KEYS[@]}"; do
      echo "   - $k"
    done
    continue
  fi

  # Create or update the secret
  echo "[*] All keys have values. Creating $SECRET_NAME..."
  kubectl create secret generic "$SECRET_NAME" \
    --from-env-file="$ENV_PATH" \
    --dry-run=client -o yaml | kubectl apply -f -

  echo "[!] $SECRET_NAME created/updated successfully."
done

echo ""
echo "[!] All secrets processed."
