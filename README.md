# arcadewong

给 **ELECFREAKS Retro Arcade（饼干游戏编程学习机 / MakeCode Arcade「F4」/ STM32F401）** 写的示例项目与教程。

每个示例项目都同时提供 **TypeScript** 与 **静态 Python** 两套等价源码，并在项目根目录配一份详细 README（从零书写过程 + 针对孩子的教案）。

---

## 快速开始

```bash
# 编译某个项目的 TS 版或 Python 版（脚本自动校验 UF2 头）
bash tools/build-lang.sh 01-catch-the-pizza ts firmware/my-game.uf2
bash tools/build-lang.sh 01-catch-the-pizza py firmware/my-game-py.uf2
```

```powershell
# 按一下机身复位键 → 出现 ARCADE-F4 盘 → 自动写入
powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 1
```

也可以直接把 `firmware/*.uf2` 拖进 `ARCADE-F4` 盘；把 UF2 拖进 <https://arcade.makecode.com> 编辑器还能**还原成可编辑的网页项目**。

---

## 目录

```
doc/           ★ 硬件介绍 + TS / Python 入门基础（分章节，只讲这台机器用得到的）
  硬件介绍.md                    ★ 机身按键、规格、内存地图、屏幕与调色板（带图）、能跑什么
  00-入门导读.md                 ← 学习路线从这看
  01-认识这台机器与开发环境.md
  02-变量与数字.md
  03-判断与循环.md
  04-函数与事件.md
  05-数组与字符串.md
  06-屏幕绘图与坐标.md          ★ 黑屏陷阱
  07-精灵碰撞与计分.md
  08-状态机与存档.md            ★ 一个 UF2 装多个游戏
  09-Python特别注意事项.md      ★ 静态 Python 的限制
  10-TS与Python语法速查表.md
  images/                       文档配图（官方产品图 + 脚本生成的示意图）

projects/      9 个示例项目，每个都有 README.md + main.ts + main.py
  01-catch-the-pizza     接披萨（入门第 1 课）
  02-flappy-bird         飞扬的小鸟（重力 / 手感）
  03-space-shooter       太空射击（两类碰撞 / 回收）
  04-game-collection     三合一游戏合集（菜单切换）
  05-toolbox             工具箱：计算器 / 秒表 / 骰子 / 手电筒 / 反应测试
  06-legend-collection   RETRO 4-IN-1：贪吃蛇 / 闯关 / 枪战 / 坦克
  py-01-catch-star       Python 入门：接星星
  py-02-dice             Python 入门：电子骰子
  py-03-stopwatch        Python 入门：秒表
  README.md              项目总索引与刷机说明

firmware/      9 个已校验的 UF2（魔数 0x0A324655 + family 0x57755A57）
tools/
  build-lang.sh          ★ 用任一语言版本编译出 F4 固件
  flash.ps1              自动等待 ARCADE 盘并烧录（-Game 1~9）
  install-driver.cmd     可选：消掉设备管理器里那个感叹号
```

---

## 三条最容易踩的坑

1. **直接画屏必须放 `game.onShade()` / `game.on_shade()`**，放 `onUpdate` 会被引擎清屏擦掉 → 全黑屏。见 `doc/06-屏幕绘图与坐标.md`。
2. **Python 是「静态 Python」，不是 MicroPython**：不能 `import`、不能 `lambda`、空数组要写 `a: List[number] = []`。`pxt.json` 还必须有 `"preferredEditor": "pyprj"`，否则会编出空壳固件。见 `doc/09-Python特别注意事项.md`。
3. **一个 UF2 = 一个程序**，拖第二个会覆盖第一个；想装多个游戏要在**一个程序里写菜单分支**，用 `settings` + `game.reset()` 切换。见 `doc/08-状态机与存档.md`。

---

## 硬件与能力边界（一句话版）

160×120 逻辑分辨率、16 色调色板、6 个按键、96 KiB SRAM、约 448 KiB 可用 Flash、**无 SD 卡 / 无文件系统 / 无中文字库**。
计算器、秒表、多个自制游戏都跑得动；**GB 模拟器 / 加载一堆 ROM 做不到**。详细分析见 `doc/硬件介绍.md`。

---

## 教孩子的建议路线

官网积木教程 **Chase the Pizza** → `projects/01-catch-the-pizza/README.md` 的教案 → 网页版切 JavaScript 看代码 → 切 Python 对照 `main.py`。
**不要**一上来就读手写的大项目：手写代码反编译成积木会出现灰色代码块，原因见 `projects/README.md`「导入网页版」一节。
