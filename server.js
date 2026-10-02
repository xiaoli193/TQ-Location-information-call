const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 静态页面
app.get(['/', '/aini.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'aini.html'));
});
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// 数据存储目录
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// 统一数据文件：所有采集到的数据都保存在这一个文件中
const collectedFile = path.join(dataDir, 'collected-data.json');

// 兼容旧版本使用的分文件（仅用于首次迁移）
const legacyDeviceFile = path.join(dataDir, 'device-info.json');

// 首次启动时把旧数据迁移到统一文件
function migrateLegacyData() {
    let records = [];
    if (fs.existsSync(collectedFile)) {
        try {
            records = JSON.parse(fs.readFileSync(collectedFile, 'utf8')) || [];
        } catch (error) {
            console.error('Error reading collected data:', error);
            records = [];
        }
    } else if (fs.existsSync(legacyDeviceFile)) {
        try {
            records = JSON.parse(fs.readFileSync(legacyDeviceFile, 'utf8')) || [];
        } catch (error) {
            console.error('Error migrating device info:', error);
            records = [];
        }
    }
    // 规范化并去重后写回，避免数据冗余
    const normalized = normalizeRecords(records);
    saveRecords(normalized);
    console.log(`Loaded ${records.length} records, ${normalized.length} kept after dedup`);
}

// 读取统一数据文件
function readRecords() {
    try {
        if (!fs.existsSync(collectedFile)) return [];
        const data = fs.readFileSync(collectedFile, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        console.error('Error reading collected data:', error);
        return [];
    }
}

// 写入统一数据文件
function saveRecords(records) {
    try {
        fs.writeFileSync(collectedFile, JSON.stringify(records, null, 2));
    } catch (error) {
        console.error('Error saving collected data:', error);
    }
}

// 只保留必要字段，截断过长的用户代理
function simplifyRecord(record) {
    const out = {};
    ['userAgent', 'platform', 'language', 'screenResolution', 'timezone', 'timestamp', 'receivedAt'].forEach(function(key) {
        if (record[key] !== undefined) out[key] = record[key];
    });
    if (typeof out.userAgent === 'string' && out.userAgent.length > 120) {
        out.userAgent = out.userAgent.substring(0, 120);
    }
    if (record.location && typeof record.location === 'object') {
        out.location = {};
        ['latitude', 'longitude', 'accuracy'].forEach(function(key) {
            if (record.location[key] !== undefined) out.location[key] = record.location[key];
        });
    } else if (typeof record.location === 'string') {
        out.location = record.location;
    }
    return out;
}

// 同一设备指纹，用于去重
function fingerprint(record) {
    return [record.userAgent, record.platform, record.screenResolution, record.timezone, record.language].join('|');
}

// 规范化并去重：同一设备只保留最新一条
function normalizeRecords(records) {
    const map = new Map();
    records.forEach(function(record) {
        const simplified = simplifyRecord(record);
        const fp = fingerprint(simplified);
        const existing = map.get(fp);
        if (!existing) {
            map.set(fp, simplified);
            return;
        }
        const prevTime = new Date(existing.receivedAt || existing.timestamp).getTime() || 0;
        const currTime = new Date(simplified.receivedAt || simplified.timestamp).getTime() || 0;
        if (currTime >= prevTime) map.set(fp, simplified);
    });
    return Array.from(map.values());
}

// 从统一数据中提取位置信息
function extractLocationInfo(records) {
    return records
        .filter(record => record.location && typeof record.location === 'object')
        .map(record => ({
            ...record.location,
            deviceTimestamp: record.timestamp,
            receivedAt: record.receivedAt,
            userAgent: record.userAgent
        }));
}

// 接收设备信息的API端点
app.post('/api/device-info', (req, res) => {
    try {
        // 精简字段并添加接收时间戳
        const deviceInfo = simplifyRecord(req.body);
        deviceInfo.receivedAt = new Date().toISOString();

        // 同一设备只保留最新一条，避免冗余
        const records = readRecords();
        const fp = fingerprint(deviceInfo);
        const idx = records.findIndex(function(record) {
            return fingerprint(record) === fp;
        });
        if (idx === -1) {
            records.push(deviceInfo);
        } else {
            records[idx] = deviceInfo;
        }
        saveRecords(records);

        console.log(`Device info saved (total: ${records.length})`);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing device info:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 获取所有设备信息
app.get('/api/device-info', (req, res) => {
    try {
        res.json(readRecords());
    } catch (error) {
        console.error('Error retrieving device info:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 获取所有位置信息（从统一文件中提取）
app.get('/api/location-info', (req, res) => {
    try {
        res.json(extractLocationInfo(readRecords()));
    } catch (error) {
        console.error('Error retrieving location info:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 生成统计报告
app.get('/api/stats', (req, res) => {
    try {
        const deviceData = readRecords();
        const locationData = extractLocationInfo(deviceData);
        
        const stats = {
            totalDevices: deviceData.length,
            devicesWithLocation: locationData.length,
            uniqueUserAgents: [...new Set(deviceData.map(d => d.userAgent))].length,
            platforms: [...new Set(deviceData.map(d => d.platform))],
            languages: [...new Set(deviceData.map(d => d.language))],
            timezones: [...new Set(deviceData.map(d => d.timezone))],
            dataFile: collectedFile,
            recentDevices: deviceData.slice(-10).map(d => ({
                userAgent: d.userAgent,
                timestamp: d.timestamp,
                receivedAt: d.receivedAt
            }))
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error generating stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 启动前迁移旧数据
migrateLegacyData();

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Data file: ${collectedFile}`);
    console.log(`Device info available at: http://localhost:${PORT}/api/device-info`);
    console.log(`Location info available at: http://localhost:${PORT}/api/location-info`);
    console.log(`Stats available at: http://localhost:${PORT}/api/stats`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('Server is shutting down...');
    process.exit(0);
});