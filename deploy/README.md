# 服务器部署

目标：`https://agent.harrylab.cn/dictionary/`。静态文件由现有 Nginx 提供；访问统计由仅监听 `127.0.0.1:8871` 的 Python 服务提供，不需要常驻 Node 进程。

- `build-release.sh COMMIT_ID`：从公开仓库下载指定修订，使用锁文件安装依赖，按 `/dictionary/` 基础路径构建，并写入独立版本目录。
- `activate-release.py`：备份 `agent-member.conf`，加入词典路由（已存在且一致则复用），切换 `current` 软链接，检查 Nginx 后 reload；验证首页与 JS/CSS 文件，失败时回退配置与链接。
- `install-stats.sh`：安装统计服务及 systemd 配置，使用独立低权限用户运行。
- `dictionary-location.conf`：供参考的 Nginx 子路径配置。

目录：`/var/www/ai-coding-dictionary/releases/` 为发布版本，`current` 指向当前版本，`backups/` 保存启用前的配置。

在已授权的服务器终端执行，需有修改相应 Nginx 配置与发布目录的权限：

```sh
bash deploy/install-stats.sh
bash deploy/build-release.sh COMMIT_ID
python3 deploy/activate-release.py
```

`COMMIT_ID` 必须换成经过检查的 Git 提交标识。脚本针对当前服务器的配置结构，换服务器前应检查域名、配置路径与权限。源代码中的根路径开发模式仍可正常使用；部署时通过 Vite `--base=/dictionary/` 指定路径。

运行环境：Node.js 18+、npm、Python 3.6+、Nginx、curl、tar。脚本在 reload 后等待新 worker 就绪，再执行健康检查。

## 访问统计

累计数据从统计启用后持续保留，不补造历史数据；今日数据按北京时间（Asia/Shanghai，UTC+8）统计，每日零点切换。前端每分钟通过只读接口更新显示，不增加访问次数。每次打开或刷新页面计一次访问，切换词条不重复计数。访客按浏览器本地保存的随机匿名标识去重；换设备、清理浏览器数据或禁用存储会影响去重，因此访客数是估算值，不是精确人数。

统计接口不记录 IP、账号或完整浏览历史。SQLite 数据库保存在 `/var/lib/ai-coding-dictionary-stats/stats.sqlite3`，独立于前端发布目录，更新页面和重启服务不会清零。需单独备份此目录；不要将运行中的数据库加入 Git。

服务管理：`systemctl status dictionary-stats`、`systemctl restart dictionary-stats`。健康检查：`curl http://127.0.0.1:8871/stats`。前端部署脚本自动设置 `VITE_STATS_API_BASE=/dictionary/api`，访问接口走同域 Nginx 反向代理。服务异常时页面显示“访问统计暂不可用”，词典仍可正常使用。

升级已有累计统计时，默认保留累计数据，日统计从升级后开始。仅当能够确定全部旧数据属于同一日期时，可在首次升级时使用 `STATS_LEGACY_DAY=YYYY-MM-DD bash deploy/install-stats.sh` 将旧数据归入该日；迁移只执行一次，不会覆盖已有日统计。
