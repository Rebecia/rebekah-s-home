# 上架清单

当前状态：**已打包，未上架**。`personal-kb-0.1.0.vsix` 可直接本地安装。

## 上架前必须确认

- [x] 截图已生成：`media/screenshots/{wall,detail,sidebar}.png`，由 `npm run demo && npm run shots`
      用无头 Chrome 拍的，改完界面重跑即可。
- [ ] **仓库是 monorepo，README 里的图必须用绝对 URL。** 插件放在
      `Rebecia/rebekah-s-home` 的子目录 `personal-kb-vscode/` 下。
      vsce 会把 README 里的相对路径改写成「仓库根 + 路径」，在子目录场景下会指错，
      所以 README 里的三张图写的是完整 raw 链接：
      `https://raw.githubusercontent.com/Rebecia/rebekah-s-home/main/personal-kb-vscode/media/screenshots/*.png`
      如果实际推上去的目录名不叫 `personal-kb-vscode`，这三个链接和 `package.json` 里的
      `repository.directory` / `homepage` 都要改。
- [ ] 图片必须真的推到 GitHub 上，raw 链接才有内容；只打进 vsix 不管用。
- [ ] 使用视频：**不放**。改用 GitHub Pages 上的可交互 demo（见下节），读者能自己点，比录屏有用。
      真要录屏：`./scripts/capture.sh video 40`，但 `.mov` 不能直接嵌 README，
      得先拖进 GitHub issue 输入框换一个可嵌入链接。
- [ ] README 第一屏那句话确认过：说清「沉淀发生在 Comate 对话里，本插件只负责看和连」。
- [ ] 决定要不要公开。插件读的是 `~/.comate/skills/personal-kb/kb/`，
      公开版要写清默认路径，避免误解为会上传内容。

## 开 GitHub Pages（在线 demo）

demo 页已经生成好并会随代码提交：`docs/demo/index.html`（卡片墙）、`docs/demo/sidebar.html`（统计侧栏）。
两页都是单文件、无外部依赖，纯静态托管即可。

1. 仓库 → **Settings → Pages**
2. **Source** 选 `Deploy from a branch`，**Branch** 选 `main`，**Folder** 选 `/ (root)`，Save
3. 等一两分钟，demo 地址就是
   **https://rebecia.github.io/rebekah-s-home/personal-kb-vscode/docs/demo/**
4. 顺手在**仓库根目录**放一个空文件 `.nojekyll`。
   Pages 默认走 Jekyll，遇到 monorepo 里某些 Markdown 可能构建失败；
   放了 `.nojekyll` 就跳过 Jekyll，直接当静态文件发。
   注意必须在仓库根，放在子目录里没用。

选 `/ (root)` 而不是 `/docs`，是因为这是 monorepo：选 `/docs` 会把发布根锁到仓库根的 `docs/`，
和本插件自己的 `personal-kb-vscode/docs/` 不是一回事。

想只发这个子项目、并且让 demo 落在更短的地址上，可以改用 Actions 部署
（`actions/upload-pages-artifact` 只上传 `personal-kb-vscode/docs/demo`）。
代价是整个仓库的 Pages 都会被这个 workflow 接管，如果以后 `tokenlens` 之类也要发页面就得改成汇总站点。
一期不建议。

本地先验一遍（和线上同一份文件）：

```bash
npm run serve      # http://localhost:8080
```

## 上架步骤

```bash
export PATH="$HOME/.local/node/bin:$PATH"

# 1. 在 https://marketplace.visualstudio.com/manage 建 Publisher（需要 Azure DevOps 账号）
#    Publisher ID 必须和 package.json 里的 "publisher": "zhouxiaoyan" 一致

# 2. 在 Azure DevOps 建 PAT：Organization 选 All accessible organizations，
#    Scopes 选 Marketplace → Manage
npx vsce login zhouxiaoyan

# 3. 改版本号 + 写 CHANGELOG，然后
npm test
npm run package        # 先出 vsix 本地装一遍，确认没问题
npx vsce publish       # 真正上架
```

## 日常改版

```bash
npm test
# 改 package.json 的 version + CHANGELOG.md
npm run package
# 命令面板 → Extensions: Install from VSIX…
```
