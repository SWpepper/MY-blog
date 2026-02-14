# 恒星系模拟器

一个基于 Three.js 的 3D 恒星系模拟器，支持随机生成星系和太阳系。

## 功能特性

- 🌟 **随机星系生成**：3-10颗行星，随机类型和卫星
- ☀️ **太阳系模拟**：真实比例的太阳系（包含月球）
- 🎨 **程序化纹理**：各类行星独特的表面纹理
- ⏰ **时间系统**：现实60秒=游戏1年，支持10倍加速
- 🎵 **背景音乐**：《蓝色多瑙河》（可开关）
- 👁️ **UI隐藏**：右下角按钮可隐藏所有界面元素
- 💥 **毁灭星系**：点击恒星可重新生成

## 免费部署方案

### 方案一：GitHub Pages（推荐，永久免费）

1. 在 GitHub 创建一个新仓库
2. 上传以下文件：
   - `index.html`
   - `css/style.css`
   - `js/main.js`
   - `assets/background.mp3`（如果需要音乐）
3. 进入仓库 Settings → Pages
4. Source 选择 "main" 分支，点击 Save
5. 几分钟后，网站就会在 `https://你的用户名.github.io/仓库名/` 上线

### 方案二：Vercel（免费，自动部署）

1. 访问 https://vercel.com
2. 用 GitHub 账号登录
3. 点击 "Add New" → "Project"
4. 导入你的 GitHub 仓库
5. 点击 "Deploy"，等待约1分钟
6. 完成后会得到一个 `*.vercel.app` 的域名

### 方案三：Netlify（免费，拖拽上传）

1. 访问 https://netlify.com
2. 用 GitHub 账号登录
3. 点击 "Add new site" → "Deploy manually"
4. 将你的项目文件夹（只需要 index.html, css, js, assets）拖进去
5. 等待上传，完成后会得到一个 `*.netlify.app` 的域名

## 本地开发

### 使用 Python（简单）

```bash
cd 项目目录
python -m http.server 8080
```

然后访问 http://localhost:8080

### 使用 Node.js（快速）

```bash
cd 项目目录
npx serve
```

## 技术栈

- **Three.js** - 3D 渲染引擎
- **OrbitControls** - 相机控制
- **Canvas** - 程序化纹理生成
- **Web Audio API** - 背景音乐

## 文件结构

```
youxi/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   └── main.js            # 主程序
├── assets/
│   └── background.mp3     # 背景音乐
└── README.md              # 说明文档
```

## 浏览器兼容性

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

需要支持 WebGL 的现代浏览器。

## 开源许可

MIT License
