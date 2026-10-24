# 服务器部署

目标：`https://agent.harrylab.cn/dictionary/`。静态文件由现有 Nginx 提供，不需要常驻 Node 进程。

- `build-release.sh COMMIT_ID`：从公开仓库下载指定修订，使用锁文件安装依赖，按 `/dictionary/` 基础路径构建，并写入独立版本目录。
- `activate-release.py`：备份 `agent-member.conf`，加入词典路由（已存在且一致则复用），切换 `current` 软链接，检查 Nginx 后 reload；验证首页与 JS/CSS 文件，失败时回退配置与链接。
- `dictionary-location.conf`：供参考的 Nginx 子路径配置。

目录：`/var/www/ai-coding-dictionary/releases/` 为发布版本，`current` 指向当前版本，`backups/` 保存启用前的配置。

在已授权的服务器终端执行，需有修改相应 Nginx 配置与发布目录的权限：

```sh
bash deploy/build-release.sh COMMIT_ID
python3 deploy/activate-release.py
```

`COMMIT_ID` 必须换成经过检查的 Git 提交标识。脚本针对当前服务器的配置结构，换服务器前应检查域名、配置路径与权限。源代码中的根路径开发模式仍可正常使用；部署时通过 Vite `--base=/dictionary/` 指定路径。

运行环境：Node.js 18+、npm、Python 3.6+、Nginx、curl、tar。脚本在 reload 后等待新 worker 就绪，再执行健康检查。
