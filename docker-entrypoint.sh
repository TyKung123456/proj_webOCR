#!/usr/bin/env bash
set -e

# ใช้โฟลเดอร์ทำงานปัจจุบันจาก compose (โดยปกติคือ /app หรือ /app/server /app/client)
cd "${WORKDIR:-/app}"

# เลือกตัวจัดการแพ็กเกจจาก lockfile
PKG="npm"
if [ -f "pnpm-lock.yaml" ]; then
  PKG="pnpm"
elif [ -f "yarn.lock" ]; then
  PKG="yarn"
elif [ -f "package-lock.json" ]; then
  PKG="npm"
fi

install_if_needed () {
  if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "🔧 Installing dependencies in $(pwd) with ${PKG}..."
    case "$PKG" in
      pnpm) corepack enable && corepack prepare pnpm@latest --activate && pnpm install ;;
      yarn) corepack enable && corepack prepare yarn@stable --activate && yarn install ;;
      npm)  npm install ;;
    esac
  else
    echo "✅ node_modules already present in $(pwd)"
  fi
}

# โหมดโครงสร้างโปรเจกต์:
# 1) root เดียว (มี package.json ที่ /app)
# 2) แยกโฟลเดอร์ /app/server และ /app/client (แต่ละที่มี package.json)
if [ -f "package.json" ]; then
  install_if_needed
elif [ -d "server" ] && [ -f "server/package.json" ]; then
  (cd server && install_if_needed)
fi
if [ -d "client" ] && [ -f "client/package.json" ]; then
  (cd client && install_if_needed)
fi

echo "🚀 Starting command: $*"
exec "$@"
