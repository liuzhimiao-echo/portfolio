#!/usr/bin/env bash
# 云服务器一键部署脚本（适用于 Ubuntu / Debian）
# 用法：
#   1) 把本项目（含本脚本、portfolio.service、server.js、index.html、images、msg-config.json）传到服务器
#   2) 进入项目目录，执行：  bash setup.sh
# 脚本会：安装 Node.js（如需）→ 安装依赖 → 注册 systemd 开机自启 → 启动服务
set -e

echo "==> 检测/安装 Node.js ..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get update
  sudo apt-get install -y nodejs
fi
echo "    Node: $(node -v), npm: $(npm -v)"

# 进入脚本所在目录（保证相对路径正确）
cd "$(dirname "$0")"

echo "==> 安装依赖（nodemailer）..."
npm install --omit=dev

echo "==> 注册 systemd 服务（开机自启）..."
sudo cp portfolio.service /etc/systemd/system/portfolio.service
sudo sed -i "s#__DIR__#$PWD#g; s#__USER__#$USER#g" /etc/systemd/system/portfolio.service
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio

echo ""
echo "==> 部署完成！"
echo "    公开页     : http://<你的服务器公网IP>:3000/"
echo "    私密收件箱 : http://<你的服务器公网IP>:3000/inbox?key=<见 msg-config.json 的 secret>"
echo "    查看日志   : sudo journalctl -u portfolio -f"
echo "    重启服务   : sudo systemctl restart portfolio"
echo ""
echo "    提示：若经 Nginx 反代，把上面地址的 IP:3000 换成你的域名即可。"
