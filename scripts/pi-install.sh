#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-$HOME/notice-board}"
REPO_URL="${2:-}"

echo "Installing notice board to: $APP_DIR"

if [ -n "$REPO_URL" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — edit ROLE, SESSION_SECRET, and sync settings before production use."
fi

export ROLE=edge
npm install
npm run build
npm run db:seed

mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/noticeboard-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Notice Board Kiosk
Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:3000
X-GNOME-Autostart-enabled=true
EOF

cat > "$HOME/notice-board.service.example" <<'EOF'
[Unit]
Description=Southern Delta University Notice Board
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/pi/notice-board
Environment=ROLE=edge
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=pi

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "Install complete."
echo "1. Edit $APP_DIR/.env"
echo "2. Copy notice-board.service.example to /etc/systemd/system/ and enable it"
echo "3. Reboot to start kiosk mode"
echo "4. Admin on Wi-Fi: http://<pi-ip>:3000/admin/login"
