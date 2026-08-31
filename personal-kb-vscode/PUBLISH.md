# 发版手册

线上：https://marketplace.visualstudio.com/items?itemName=Rebekah.personal-kb

Publisher ID 是 `Rebekah`（不可改），必须和 `package.json` 里的 `"publisher"` 永远一致。

## 只改文案

对外文案集中在 **`copy.json`** 三个字段里，别去源码里一处处找：

- `description` → Marketplace 搜索结果那行
- `tagline` → 侧栏顶部那条
- `readmeLead` → README 标题下那句加粗

改完跑：

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd ~/Desktop/工作/rebekah-s-home/personal-kb-vscode

npm run copy          # 同步到三处 + 重新生成 demo 页
```

只跑 `copy` 只改本地文件。**Marketplace 上的简介必须重新发版才会变**，接着往下走。

## 发版：一条命令

做一次准备：`npx vsce login Rebekah`（要一个 Azure DevOps 的 PAT，Organization 选 `All accessible organizations`，Scopes 选 `Marketplace → Manage`）。存一次，之后就不用再输。

```bash
npm run ship:patch    # 改文案、修 bug；加功能用 ship:minor
```

它按顺序做：同步 copy.json → 升版本号 → 在 CHANGELOG 顶部插 TODO 占位 → 重生成 demo 和截图 → 跑单测 → 打包 → **直接发到 Marketplace**。

有两道闸会拦住你：单测不过不发；CHANGELOG 里这一版还留着 `TODO` 不发（这时候包已经打好了，把 TODO 填完直接 `npx vsce publish --no-dependencies` 就行，不用重新升版本号）。

发完还要把代码推上去：

```bash
git add -A && git commit -m "release: <版本>" && git push
```

**这一步不能省。** README 里的三张截图和在线 demo 都是从 GitHub `main` 分支读的，不推的话 Marketplace 页面会出现「文字是新的、图是旧的」。

### 只想打包不想发

```bash
npm run release:patch    # 同上，但停在 vsix，不上传
```

### 走 CI 发（可选）

在 `Settings → Secrets and variables → Actions` 加 secret `VSCE_PAT`，然后打 tag：

```bash
git tag v<版本> && git push --tags
```

仓库根的 `.github/workflows/personal-kb-release.yml` 会校验 tag 和版本号一致、CHANGELOG 有这一版，跑单测，然后 `vsce publish`，并把 vsix 挂到 GitHub Release。

（workflow 必须放在**仓库根**的 `.github/workflows/`，放 `personal-kb-vscode/.github/` 里 GitHub 根本不会读。所以它用 `working-directory: personal-kb-vscode` 进子目录。）

### 不想走 CI 的时候

`npm run ship:patch` 走的就是本地直发这条路，不依赖 CI，只依赖 `vsce login` 存下的 PAT。

### PAT 过期了

Azure DevOps 的 PAT 最长一年。过期后会报 401，重建一个再 `npx vsce login Rebekah` 一次即可，跟插件身份无关。

## 已经就绪，不用再管

- GitHub Pages 已开（`main` + `/ (root)`），README 里的在线 demo 链接可用
- icon（`media/logo.png`，脚本生成）、LICENSE、CHANGELOG
- `repository` / `bugs` / `homepage` 指向 `Rebecia/rebekah-s-home` 的 `personal-kb-vscode` 子目录
- README 三张截图用绝对 raw 链接（monorepo 子目录下相对路径会被 vsce 改写到仓库根，会变破图）
- `.vscodeignore`：源码、测试、脚本、截图、demo 都排除，包只有 27 个文件 47KB
- vsce 打包零 warning，单测 12/12

## GitHub Pages 的两个坑（重配时才需要看）

- Folder 必须选 `/ (root)`，不能选 `/docs`。这是 monorepo，选 `/docs` 会把发布根锁到仓库根的 `docs/`，跟 `personal-kb-vscode/docs/` 不是一回事。
- `.nojekyll` 必须在仓库根，放子目录没用。

本地先验同一份文件：

```bash
npm run serve      # http://localhost:8080
```

## 想只发这个子项目

可以改用 Actions 部署（`actions/upload-pages-artifact` 只上传 `personal-kb-vscode/docs/demo`），代价是整个仓库的 Pages 被这个 workflow 接管，以后 `tokenlens` 要发页面就得改成汇总站点。一期不建议。
