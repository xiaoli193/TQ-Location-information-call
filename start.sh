#!/bin/bash

# 启动设备信息收集系统

echo "正在启动设备信息收集系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: 未找到npm，请先安装npm"
    exit 1
fi

# 安装依赖
echo "正在安装依赖..."
npm install

# 启动服务器
echo "正在启动服务器..."
echo "服务器将在 http://localhost:3000 启动"
echo "仪表板将在 http://localhost:3000/dashboard.html (需要手动打开)"
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
node server.js