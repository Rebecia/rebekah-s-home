# 发版手册

当前状态：**0.2.0 已上架。** https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb

Publisher ID 是 `Rebekah`（不可改），必须和 `package.json` 里的 `"publisher"` 永远一致。

## 日常改版：一条命令 + 一个 tag

> 在 **`rebekah-s-home/personal-kb-vscode`** 这份工作副本里做。tag 必须打在 `rebekah-s-home` 仓库上，CI 才会被触发。

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd ~/Desktop/工作/rebekah-s-home/personal-kb-vscode

npm run release:patch        # 修 bug；加功能用 release:minor
```

这一条命令会：改版本号 → 在 CHANGELOG 顶部插一段 TODO 占位 → 重新生成 demo 页和截图 → 跑单测 → 打出 vsix。任何一步失败就停住，不会留下半成品。

然后人工做三件事：

1. 把 CHANGELOG.md 里那一版的 `TODO` 换成真内容（CI 会检查这一版有没有条目，但不会检查你写了什么）
2. 本地装一遍看一眼：
   ```bash
   "/Applications/Comate.app/Contents/Resources/app/bin/comate" --install-extension personal-kb-<版本>.vsix --force
   ```
3. 提交并打 tag，剩下的交给 CI：
   ```bash
   git add -A && git commit -m "release: <版本>"
   git tag v<版本> && git push && git push --tags
   ```

tag 一推上去，仓库根的 `.github/workflows/personal-kb-release.yml` 就会跑：校验 tag 和 `package.json` 版本号一致 → 校验 CHANGELOG 有这一版 → 跑单测 → `vsce publish` 发到 Marketplace → 把 vsix 挂到 GitHub Release，说明取 CHANGELOG 里这一版的段落。

（workflow 必须放在**仓库根**的 `.github/workflows/`，放 `personal-kb-vscode/.github/` 里 GitHub 根本不会读。所以它用 `working-directory: personal-kb-vscode` 进子目录。）

**前置条件（做一次）**：在 GitHub 仓库 `Settings → Secrets and variables → Actions` 加一个 secret `VSCE_PAT`，值是 Azure DevOps 的 PAT（Organization 选 `All accessible organizations`，Scopes 选 `Marketplace → Manage`）。没配的话 CI 会在 publish 那步失败，本地照样能 `npx vsce publish` 手动发。

### 不想走 CI 的时候

```bash
npm run release:patch
# 补 CHANGELOG
npx vsce publish            # 本地直接发，需要先 npx vsce login Rebekah
```

### PAT 过期了

Azure DevOps 的 PAT 最长一年。过期后 CI 会报 401，重建一个 PAT 覆盖 `VSCE_PAT` 这个 secret 即可，跟插件身份无关。

## 已经就绪，不用再管

- GitHub Pages 已开（`main` + `/ (root)`），README 里的在线 demo 链接可用
- icon（`media/logo.png`，脚本生成）、LICENSE、CHANGELOG
- `repository` / `bugs` / `homepage` 指向 `Rebecia/rebekah-s-home` 的 `personal-kb-vscode` 子目录
- README 三张截图用绝对 raw 链接（monorepo 子目录下相对路径会被 vsce 改写到仓库根，会变破图）
- `.vscodeignore`：源码、测试、脚本、截图、demo 都排除，包只有 24 个文件 37KB
- vsce 打包零 warning，单测 7/7

## GitHub Pages 的两个坑（重配时才需要看）

- Folder 必须选 `/ (root)`，不能选 `/docs`。这是 monorepo，选 `/docs` 会把发布根锁到仓库根的 `docs/`，跟 `personal-kb-vscode/docs/` 不是一回事。
- `.nojekyll` 必须在仓库根，放子目录没用。

本地先验同一份文件：

```bash
npm run serve      # http://localhost:8080
```

## 想只发这个子项目

可以改用 Actions 部署（`actions/upload-pages-artifact` 只上传 `personal-kb-vscode/docs/demo`），代价是整个仓库的 Pages 被这个 workflow 接管，以后 `tokenlens` 要发页面就得改成汇总站点。一期不建议。
