# 恒星系模拟器

一个基于 Three.js 的 3D 恒星系模拟器，支持随机生成星系和太阳系。
网址：https://swpepper.github.io/Star-System-Simulator/

## 功能特性

- 🌟 **随机星系生成**：3-10颗行星，随机类型和卫星
- ☀️ **太阳系模拟**：真实比例的太阳系（包含月球）
- 🎨 **程序化纹理**：各类行星独特的表面纹理
- ⏰ **时间系统**：现实60秒=游戏1年，支持10倍加速
- 🎵 **背景音乐**：《蓝色多瑙河》（可开关）
- 👁️ **UI隐藏**：右下角按钮可隐藏所有界面元素
- 💥 **毁灭星系**：点击恒星可重新生成




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


