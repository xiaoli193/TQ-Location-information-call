# TQ-Location-information-call

一个用于收集设备和位置信息的后端服务器系统，支持实时数据收集、去重和可视化展示。

## 📋 项目概述

这是一个基于 Node.js + Express.js 的设备信息收集系统，能够：

- 收集访问者的设备指纹信息（用户代理、平台、语言、屏幕分辨率、时区等）
- 获取地理位置信息（经纬度、精度）
- 实时数据去重和规范化处理
- 提供Web仪表板进行数据展示和管理
- 支持API接口获取统计数据

## 🚀 功能特性

### 核心功能
- **设备信息收集**：自动收集访问者的设备指纹信息
- **地理位置获取**：请求用户授权获取位置信息
- **数据去重**：基于设备指纹自动去重，保留最新数据
- **实时仪表板**：Web界面实时展示收集到的数据
- **API接口**：提供RESTful API供外部调用

### 数据字段
- **设备信息**：
  - userAgent（用户代理）
  - platform（平台）
  - language（语言）
  - screenResolution（屏幕分辨率）
  - timezone（时区）
  - timestamp（时间戳）

- **位置信息**：
  - latitude（纬度）
  - longitude（经度）
  - accuracy（精度）

## 🛠️ 技术栈

- **后端**：Node.js + Express.js
- **前端**：HTML5 + CSS3 + JavaScript
- **数据存储**：JSON文件
- **开发工具**：nodemon（热重载）

## 📦 安装和使用

### 环境要求
- Node.js 14.0+
- npm 6.0+

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd device-info-collector
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start

# 或使用启动脚本
./start.sh
```

4. **访问服务**
- 服务器地址：http://localhost:3000
- 仪表板：http://localhost:3000/dashboard.html
- 数据收集页面：http://localhost:3000/aini.html

## 📊 API 文档

### 设备信息接口

#### POST /api/device-info
接收设备信息数据

**请求体**：
```json
{
  "userAgent": "Mozilla/5.0...",
  "platform": "Win32",
  "language": "zh-CN",
  "screenResolution": "1920x1080",
  "timezone": "Asia/Shanghai",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "location": {
    "latitude": 39.9042,
    "longitude": 116.4074,
    "accuracy": 50
  }
}
```

**响应**：
```json
{
  "success": true
}
```

#### GET /api/device-info
获取所有设备信息

**响应**：
```json
[
  {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "zh-CN",
    "screenResolution": "1920x1080",
    "timezone": "Asia/Shanghai",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "receivedAt": "2024-01-01T00:00:01.000Z"
  }
]
```

### 位置信息接口

#### GET /api/location-info
获取所有位置信息

**响应**：
```json
[
  {
    "latitude": 39.9042,
    "longitude": 116.4074,
    "accuracy": 50,
    "deviceTimestamp": "2024-01-01T00:00:00.000Z",
    "receivedAt": "2024-01-01T00:00:01.000Z",
    "userAgent": "Mozilla/5.0..."
  }
]
```

### 统计接口

#### GET /api/stats
获取统计数据

**响应**：
```json
{
  "totalDevices": 100,
  "devicesWithLocation": 80,
  "uniqueUserAgents": 45,
  "platforms": ["Win32", "MacIntel", "Linux x86_64"],
  "languages": ["zh-CN", "en-US", "ja-JP"],
  "timezones": ["Asia/Shanghai", "America/New_York"],
  "dataFile": "/path/to/data/collected-data.json",
  "recentDevices": [
    {
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "receivedAt": "2024-01-01T00:00:01.000Z"
    }
  ]
}
```

## 📁 项目结构

```
device-info-collector/
├── server.js              # 主服务器文件
├── start.sh               # 启动脚本
├── package.json           # 项目配置
├── LICENSE                # 许可证
├── dashboard.html         # 数据仪表板
├── aini.html             # 设备信息收集页面
└── data/                 # 数据存储目录
    └── collected-data.json # 收集的数据文件
```

## 🔧 配置说明

### 服务器配置
- **端口**：3000（可在 `server.js` 中修改）
- **数据存储路径**：`data/collected-data.json`
- **跨域支持**：已启用 CORS

### 数据处理
- **去重策略**：基于设备指纹（userAgent + platform + screenResolution + timezone + language）
- **数据保留**：同一设备只保留最新的一条记录
- **数据清理**：自动截断过长的用户代理字符串

## 📈 仪表板功能

### 统计卡片
- 总设备数
- 有位置信息的设备数
- 不同浏览器类型数量
- 不同平台数量

### 数据筛选
- **设备信息筛选**：
  - 搜索：用户代理、平台、语言、时区、屏幕分辨率
  - 平台筛选
  - 位置状态筛选（已获取/拒绝授权/不支持/未知）
  - 时间范围筛选（全部/1小时/24小时/7天）
  - 去重开关

- **位置信息筛选**：
  - 搜索：用户代理
  - 时间范围筛选
  - 去重开关（相同坐标去重）

### 实时更新
- 自动刷新间隔：30秒
- 手动刷新按钮
- 实时数据统计

## 🚨 注意事项

### 隐私和合规
- 本系统收集的数据应遵守相关隐私法规
- 建议在收集用户信息前获得明确授权
- 位置信息需要用户明确授权才能获取

### 安全考虑
- 数据存储为JSON文件，确保文件访问权限安全
- API接口无认证机制，建议在生产环境中添加
- 定期备份重要数据

### 性能优化
- 数据去重机制避免重复记录
- 定期清理过期数据
- 合理设置数据存储策略

## 📄 许可证

本项目采用 GNU Affero General Public License v3.0 许可证。详见 [LICENSE](LICENSE) 文件。


---

**注意**：本项目仅供学习和研究使用，请在合法合规的前提下使用。