#!/usr/bin/env python3
"""Activate the prepared dictionary release and add its route with rollback."""
from pathlib import Path
import os
import re
import shutil
import subprocess
import time

root = Path('/var/www/ai-coding-dictionary')
release = (root / 'pending-release').read_text().strip()
if not re.fullmatch(r'[a-f0-9]{7,40}-\d{14}', release):
    raise SystemExit('Invalid release ID')
target = root / 'releases' / release
if not (target / 'index.html').is_file():
    raise SystemExit('Release is missing index.html')
config = Path('/etc/nginx/conf.d/agent-member.conf')
original = config.read_text()
marker = ' location / {\n'
if original.count(marker) != 1:
    raise SystemExit('Unexpected Nginx configuration; inspect before changing it')
route = ''' location = /dictionary { return 301 /dictionary/$is_args$args; }
 location ^~ /dictionary/ {
  alias /var/www/ai-coding-dictionary/current/;
  index index.html;
  add_header X-Content-Type-Options nosniff always;
  add_header Cache-Control "no-cache" always;
 }
'''
has_route = route.strip() in original
if 'location ^~ /dictionary/' in original and not has_route:
    raise SystemExit('Existing dictionary route differs; inspect it first')
backup_dir = root / 'backups'
backup_dir.mkdir(parents=True, exist_ok=True)
backup = backup_dir / ('agent-member.conf.' + time.strftime('%Y%m%d%H%M%S'))
shutil.copy2(config, backup)
current = root / 'current'
if current.exists() and not current.is_symlink():
    raise SystemExit('Current path must be a symlink')
old_target = os.readlink(current) if current.is_symlink() else None
pending = root / 'current.next'
if pending.is_symlink():
    pending.unlink()
os.symlink(target, pending)
os.replace(pending, current)
try:
    if shutil.which('restorecon'):
        subprocess.run(['restorecon', '-RF', str(root)], check=True)
    if not has_route:
        config.write_text(original.replace(marker, route + marker, 1))
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    # reload returns before replacement workers necessarily accept connections.
    time.sleep(2)
    url = 'https://agent.harrylab.cn/dictionary/'
    html = subprocess.check_output(['curl', '--fail', '--silent', '--show-error', '--max-time', '15', '--resolve', 'agent.harrylab.cn:443:127.0.0.1', url], universal_newlines=True)
    assets = re.findall(r'(?:src|href)="(/dictionary/assets/[^"]+)"', html)
    if len(assets) < 2:
        raise RuntimeError('Expected CSS and JS asset paths')
    for asset in assets:
        subprocess.run(['curl', '--fail', '--silent', '--show-error', '--output', '/dev/null', '--max-time', '15', '--resolve', 'agent.harrylab.cn:443:127.0.0.1', 'https://agent.harrylab.cn' + asset], check=True)
except Exception:
    shutil.copy2(backup, config)
    if current.is_symlink():
        current.unlink()
    if old_target:
        os.symlink(old_target, current)
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
    # reload returns before replacement workers necessarily accept connections.
    time.sleep(2)
    raise
print('DEPLOY_OK', release, url)
print('NGINX_BACKUP', backup)
