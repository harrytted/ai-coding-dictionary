# AI 编程词典 · 中文版

用中英文对照理解 AI 编程的 71 个核心概念，通过动态关系图探索模型、智能体、上下文、工具与协作之间的联系。

在线访问：[AI 编程词典](https://agent.harrylab.cn/dictionary/)

## 功能

- 71 个词条、7 个分类，包含释义、示例和关联词条。
- 中英文图谱标签、标签避让、自然运动与悬停高亮。
- 中英文及别名搜索、分类筛选、列表视图和词条直达链接。
- 图谱平移、缩放、暂停、复位及点击音效开关。
- 三种配色，支持桌面、手机和减少动态效果设置。
- 可选服务器访问统计：今日访问、今日访客、累计访问、累计访客；位于首页介绍区，访客按匿名浏览器标识去重估算。

## 本地运行

需要 Node.js 18 或以上版本。

```bash
npm ci
npm run dev -- --port 5183
```

打开 http://127.0.0.1:5183 。词条链接示例：http://127.0.0.1:5183/?term=spec 。

快捷键：`/` 搜索，`Esc` 关闭词条；页面焦点下 `←` / `→` 切换词条；画板内 `+` / `-` 缩放、`0` 复位。配色和音效偏好保存在本机。

## 检查与构建

```bash
npm run check
npm run build
npm run preview -- --port 5183
```

生产文件输出到 `dist/`，可由静态 HTTP 服务托管。部署到子路径时指定基础路径，例如：

```bash
npm run build -- --base=/dictionary/
```

默认本地运行不连接统计服务。启用统计时，构建前设置 `VITE_STATS_API_BASE=/dictionary/api`；服务端检查可运行 `npm run check:stats`（需要 Python 3.6+）。

服务器部署与回滚说明见 [deploy/README.md](deploy/README.md)。

## 项目结构

- `src/data.js`：词条、分类、搜索别名及概念关联。
- `src/main.js`：页面、图谱、搜索和导航。
- `src/force.js`、`src/layout.js`、`src/motion.js`：节点运动与标签布局。
- `src/sound.js`、`src/style.css`：音效与界面样式。
- `scripts/`：自动检查脚本。
- `server/stats.py`：使用 SQLite 持久保存访问统计的可选服务。
- `deploy/`：服务器部署脚本与说明。
