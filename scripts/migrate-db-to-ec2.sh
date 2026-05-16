#!/usr/bin/env bash
# Copies your local SQLite database to the EC2 instance.
# Run this ONCE after the EC2 is set up (Phase D) and BEFORE going live.
#
# Usage:
#   bash scripts/migrate-db-to-ec2.sh <ec2-ip> <path-to-pem>
#
# Example:
#   bash scripts/migrate-db-to-ec2.sh 54.123.45.67 ~/Downloads/jobs-tracker-key.pem

set -euo pipefail

EC2_IP="${1:?Usage: $0 <ec2-ip> <path-to-pem>}"
PEM="${2:?Usage: $0 <ec2-ip> <path-to-pem>}"
REMOTE_USER="ec2-user"
LOCAL_DB="data/jobs.db"
REMOTE_DIR="/home/ec2-user/data"

if [[ ! -f "$LOCAL_DB" ]]; then
  echo "ERROR: $LOCAL_DB not found. Run from the project root."
  exit 1
fi

echo "==> Stopping backend on EC2 to prevent DB writes during copy..."
ssh -i "$PEM" -o StrictHostKeyChecking=no "${REMOTE_USER}@${EC2_IP}" \
  "cd ~/jobs && docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend"

echo "==> Creating remote data directory..."
ssh -i "$PEM" "${REMOTE_USER}@${EC2_IP}" "mkdir -p ${REMOTE_DIR}"

echo "==> Copying local DB to EC2..."
scp -i "$PEM" "${LOCAL_DB}" "${REMOTE_USER}@${EC2_IP}:${REMOTE_DIR}/jobs.db"

echo "==> Restarting backend..."
ssh -i "$PEM" "${REMOTE_USER}@${EC2_IP}" \
  "cd ~/jobs && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend"

echo "==> Waiting for health check..."
for i in $(seq 1 12); do
  if ssh -i "$PEM" "${REMOTE_USER}@${EC2_IP}" "curl -sf http://localhost/healthz" > /dev/null 2>&1; then
    echo "==> Done! Backend is healthy. Your data is live on EC2."
    exit 0
  fi
  sleep 5
done

echo "ERROR: Backend did not become healthy. Check: ssh -i $PEM ${REMOTE_USER}@${EC2_IP} 'docker compose logs backend'"
exit 1
