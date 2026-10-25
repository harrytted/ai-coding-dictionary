#!/usr/bin/env bash
# Install the localhost-only statistics service before activating a frontend release.
set -euo pipefail
project_dir=$(cd "$(dirname "$0")/.." && pwd)
if ! id dictionary-stats >/dev/null 2>&1; then
  useradd --system --user-group --no-create-home --shell /sbin/nologin dictionary-stats
fi
install -d -m 755 /opt/ai-coding-dictionary-stats
install -d -m 700 -o dictionary-stats -g dictionary-stats /var/lib/ai-coding-dictionary-stats
install -m 644 "$project_dir/server/stats.py" /opt/ai-coding-dictionary-stats/stats.py
install -m 644 "$project_dir/deploy/dictionary-stats.service" /etc/systemd/system/dictionary-stats.service
systemctl daemon-reload
systemctl enable dictionary-stats
if [[ -n "${STATS_LEGACY_DAY:-}" ]]; then
  systemctl stop dictionary-stats
  install -d -m 700 /var/lib/ai-coding-dictionary-stats/backups
  db_backup=$(mktemp -d /var/lib/ai-coding-dictionary-stats/backups/pre-daily-XXXXXXXX)
  if [[ -f /var/lib/ai-coding-dictionary-stats/stats.sqlite3 ]]; then
    cp -a /var/lib/ai-coding-dictionary-stats/stats.sqlite3* "$db_backup/"
  fi
  runuser -u dictionary-stats -- /usr/bin/python3 /opt/ai-coding-dictionary-stats/stats.py --migrate-legacy-day "$STATS_LEGACY_DAY"
fi
systemctl restart dictionary-stats
for attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:8871/stats; then
    printf '\nSTATS_READY\n'
    exit 0
  fi
  sleep 1
done
systemctl status dictionary-stats --no-pager
exit 1
