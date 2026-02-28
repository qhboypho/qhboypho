#!/bin/bash
# ============================================
#  QH Clothes - Deploy Script
#  Usage: ./deploy.sh "commit message"
# ============================================

set -e  # Dừng nếu có lỗi

ACCOUNT_ID="4713c2b0ffcb83a2ee325b6cce8a0181"
PROJECT_NAME="qhclothes"
COMMIT_MSG=${1:-"Update: $(date '+%Y-%m-%d %H:%M')"}

echo ""
echo "🚀 QH Clothes - Bắt đầu deploy..."
echo "=================================="

# 1. Build project
echo ""
echo "📦 [1/4] Building project..."
npm run build
echo "✅ Build thành công!"

# 2. Deploy lên Cloudflare Pages
echo ""
echo "☁️  [2/4] Deploy lên Cloudflare Pages..."
CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID npx wrangler pages deploy dist --project-name $PROJECT_NAME
echo "✅ Deploy Cloudflare thành công!"

# 3. Commit & push lên GitHub
echo ""
echo "📤 [3/4] Push lên GitHub..."
git add -A

# Kiểm tra có gì để commit không
if git diff --staged --quiet; then
  echo "ℹ️  Không có thay đổi mới để commit."
else
  git commit -m "$COMMIT_MSG"
  echo "✅ Commit: $COMMIT_MSG"
fi

git push origin main
echo "✅ Push GitHub thành công!"

# 4. Hoàn thành
echo ""
echo "=================================="
echo "🎉 Deploy hoàn tất!"
echo ""
echo "🌐 Production URL:"
echo "   https://$PROJECT_NAME.pages.dev"
echo ""
echo "📁 GitHub:"
echo "   https://github.com/qhboypho/qhboypho"
echo "=================================="
