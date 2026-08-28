#!/usr/bin/env bash
# 拍界面图和录使用视频。截图必须对着真实运行中的窗口，所以要你手动框选，脚本只负责存到正确的位置和文件名。
#
#   ./scripts/capture.sh shots     交互式拍三张界面图
#   ./scripts/capture.sh video 40  录一段 40 秒的使用视频（默认 30 秒）
#   ./scripts/capture.sh demo      在浏览器打开两个 demo 页面，用来拍图
#
# 首次运行会弹权限申请：系统设置 → 隐私与安全性 → 屏幕录制，勾上终端。
set -euo pipefail

cd "$(dirname "$0")/.."
SHOTS="media/screenshots"
mkdir -p "$SHOTS"

shot() {
  local name="$1" desc="$2"
  echo ""
  echo "▸ 要拍：$desc"
  echo "  按回车后光标变十字，拖框选区域；想放弃按 Esc。"
  read -r
  screencapture -i "$SHOTS/$name.png" || true
  if [ -f "$SHOTS/$name.png" ]; then
    echo "  已存 $SHOTS/$name.png"
  else
    echo "  跳过了 $name"
  fi
}

case "${1:-shots}" in
  shots)
    shot sidebar "侧栏统计：hero + 三段指标 + 分类环形饼图"
    shot wall    "卡片墙全貌：顶栏 + bento 网格 + 底部条"
    shot detail  "点开一张卡后的详情浮层"
    echo ""
    echo "拍完了。README 里的图片引用路径是 media/screenshots/<名字>.png"
    ;;
  video)
    dur="${2:-30}"
    out="media/screenshots/walkthrough.mov"
    echo "▸ 开始录屏 ${dur} 秒 → $out"
    echo "  建议流程：打开侧栏 → 点分类筛选 → 打开卡片墙 → 点开一张卡 → 点标签筛选。"
    echo "  3 秒后开始。"
    sleep 3
    screencapture -v -V "$dur" "$out"
    echo "  已存 $out"
    if command -v ffmpeg >/dev/null 2>&1; then
      echo "▸ 检测到 ffmpeg，同时转一份 GIF"
      ffmpeg -y -i "$out" -vf "fps=12,scale=900:-1:flags=lanczos" media/screenshots/walkthrough.gif
    else
      echo "  没装 ffmpeg，没生成 GIF。"
      echo "  GitHub 的 README 不能直接嵌本地 mov：把 walkthrough.mov 拖进 GitHub 的 issue"
      echo "  或 release 描述框，它会返回一个可嵌入的链接，再贴回 README。"
    fi
    ;;
  demo)
    open "docs/demo/index.html" "docs/demo/sidebar.html"
    echo "两个 demo 页面已在浏览器打开。窗口宽度拉到 1200 以上，bento 布局才铺得开。"
    ;;
  *)
    echo "用法：$0 [shots|video [秒数]|demo]" >&2
    exit 1
    ;;
esac
