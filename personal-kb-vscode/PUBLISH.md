# 上架清单

当前状态：**0.2.0 已打包，未上架。** `personal-kb-0.2.0.vsix` 可直接本地安装。

代码侧的上架阻塞项已清（首次运行引导、Windows 软链、定位放宽），剩下的都需要人工操作或账号权限。

## 只有你能做的四步（按顺序）

### 1. 自己开一遍，确认渲染没问题

我验证过单测、静态渲染和无头浏览器截图，但**从没在真实 VS Code / Comate 宿主里看过界面**。上架前必须你自己确认：

- 侧栏两个视图 + 卡片墙 + 点开一张卡的详情浮层
- 切一次深色主题（`Developer: Toggle Light/Dark Theme` 或设置里换）
- 把 `personalKb.kbPath` 改成一个不存在的路径，确认出现引导块而不是空白或报错，点「创建示例卡片」能生成并打开卡片，然后改回来

### 2. 开 GitHub Pages

否则 README 里的在线 demo 链接是 404，Marketplace 页面会挂一个死链。

`Settings → Pages`：Source `Deploy from a branch`，Branch `main`，Folder **`/ (root)`**，Save。等 1–2 分钟。
（`.nojekyll` 已在仓库根，不会卡 Jekyll 构建。）

### 3. 建 Marketplace Publisher 并登录

1. 打开 https://marketplace.visualstudio.com/manage ，用 Microsoft / Azure DevOps 账号建 Publisher
2. **Publisher ID 必须和 `package.json` 里的 `"publisher": "zhouxiaoyan"` 完全一致**，不一致就改其中一个
3. 在 Azure DevOps 建 PAT：Organization 选 `All accessible organizations`，Scopes 选 `Marketplace → Manage`
4. 登录：

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd "路径/personal-kb-vscode"
npx vsce login zhouxiaoyan
```

### 4. 上架

```bash
npm test && npm run package        # 先本地装一遍确认
npx vsce publish                   # 真正上架
```

上架后几分钟内可搜到；README 里的图走的是 GitHub raw 链接，仓库公开即可显示。

## 日常改版

```bash
npm test
# 改 package.json 的 version + CHANGELOG.md
npm run demo && npm run shots      # 界面变了就重新生成 demo 和截图
npm run package
npx vsce publish                   # 或者只出 vsix 本地装
```

## 已经就绪，不用再管

- icon（`media/logo.png`，脚本生成）、LICENSE、CHANGELOG
- `repository` / `bugs` / `homepage` 指向 `Rebecia/rebekah-s-home` 的 `personal-kb-vscode` 子目录
- README 三张截图用绝对 raw 链接（monorepo 子目录下相对路径会被 vsce 改写到仓库根，会变破图）
- `.vscodeignore`：源码、测试、脚本、截图、demo 都排除，包只有 24 个文件 37KB
- vsce 打包零 warning，单测 7/7

## 开 GitHub Pages 的两个坑

- Folder 必须选 `/ (root)`，不能选 `/docs`。这是 monorepo，选 `/docs` 会把发布根锁到仓库根的 `docs/`，跟 `personal-kb-vscode/docs/` 不是一回事。
- `.nojekyll` 必须在仓库根，放子目录没用。

本地先验同一份文件：

```bash
npm run serve      # http://localhost:8080
```

## 想只发这个子项目

可以改用 Actions 部署（`actions/upload-pages-artifact` 只上传 `personal-kb-vscode/docs/demo`），代价是整个仓库的 Pages 被这个 workflow 接管，以后 `tokenlens` 要发页面就得改成汇总站点。一期不建议。
