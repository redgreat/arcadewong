# 06 · RETRO 4-IN-1 四大经典游戏合集

> 一个 UF2 里装 **贪吃蛇 / 横版跳跃 / 横版枪战 / 坦克大战**，每个都有完整玩法系统。
> 这是仓库里最大、也最适合「讲架构」的项目：不用精灵系统，全部**每帧直接画屏**，把 448 KiB Flash 用掉 343 KiB。
> 对应固件：`firmware/09-legend-4in1.uf2`。

⚠️ **定位说明**：这是**玩法与系统的完整原创实现**（物理、碰撞、关卡、敌人 AI、Boss、道具、命与计分），不是 ROM 移植。原版关卡 / 美术 / 音乐有版权，这台机器也没有存储介质放 ROM。游戏名用 `SNAKE / PLATFORM HERO / RUN & GUN / TANK BATTLE` 等原创名。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | **公共层**：调色板、绘图小工具、非阻塞音效、菜单、启动分支、长按 B 返回 |
| `snake.ts` | 贪吃蛇：20×13 网格、4 套障碍图、穿墙、逐级加速、金色奖励食物、最高分存 Flash、暂停 |
| `platformer.ts` | 横版闯关：3 世界卷轴、长短跳、冲刺、问号砖出道具、两种敌人可踩、尖刺深坑、变大、旗帜过关 |
| `contra.ts` | 横版枪战：3 关、八方向射击、4 种武器、步兵/炮台/冲锋兵、移动 Boss + 血条、武器胶囊、爆炸粒子 |
| `tanks.ts` | 坦克大战：13×13 战场 4 图、砖墙四段破坏、钢/水/草、护老鹰基地、4 种敌坦克 AI、子弹对撞、6 道具 |
| `main.py` | **Python 版（教学精简版）**：同样的菜单架构 + 同样 4 个可玩的游戏，压缩成单文件，便于对照学习 |
| `pxt.json` / `mkc.json` | 项目清单（5 个 .ts）/ F4 编译设置 |
| `README.md` | 本文件 |

> TS 版约 1968 行；Python 版约 900 行，是**同源精简实现**（关卡数、道具数比 TS 版少），用来讲语法与架构，不适合当作「完整移植」。
> 两个版本都已实测编译出 F4 固件：TS 343.0 KiB、Python 303.0 KiB。

---

## 1. 先玩，再讲（10 分钟）

开机 `RETRO 4-IN-1` 菜单：↑↓ 选、A 进入；**游戏内长按 B 约 1.2 秒**回菜单（顶部/底部有黄色进度条），短按 B 留给游戏内操作。
四个游戏各玩 1 分钟，然后问：「这四个游戏画面风格差这么远，为什么能塞进同一个固件？」——引出「**它们其实共用一个画图的地基层**」。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：先决定「不用精灵系统」

前 5 个项目都用 `sprites.create` / `onOverlap`，引擎帮忙画、帮忙碰。这里改成**立即模式（immediate mode）**：

```ts
game.onShade(function () {
    screen.fill(BLACK)            // 每帧先自己清屏
    // 然后自己把每个方块、每个敌人、每个字画上去
})
```

**为什么**：
- 四个游戏同时编进一个固件，精灵系统 + 全部图片资源很占空间；直接画矩形几乎不占资源。
- 所有游戏逻辑都变成**普通数字和数组**，非常容易讲清楚，也容易在两种语言之间对照。
- 代价：碰撞要自己写，于是有了公共的 `hit()` 函数。

### 第 2 步：写一层公共工具（`main.ts` 的 `namespace G`）

```ts
namespace G {
    export const SW = 160, SH = 120           // 逻辑分辨率
    export const BLACK = 15, WHITE = 1, ...   // 16 色调色板编号
    export function r(x, y, w, h, c) { screen.fillRect(x, y, w, h, c) }
    export function box(...) { screen.drawRect(...) }
    export function t(s, x, y, c) { screen.print(s, x, y, c) }
    export function tc(s, y, c) { screen.printCenter(s, y, c) }
    export function hit(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }
    export function clamp(v, a, b) { ... }
}
```

**为什么**：把长 API 缩成 `r / t / tc`，四个游戏文件里满屏都是短名字，孩子读代码不会被 API 名字劝退。
`hit()` 就是**矩形相交**：两个矩形在 x 和 y 方向都重叠，就是碰上了。这一行值得在黑板上画两个方框讲 5 分钟。

Python 版把这些写成模块级函数 `r() / box() / t() / tc() / hit() / clamp()`，没有 `namespace`。

### 第 3 步：解决「音效会卡住游戏」

```ts
export function beep(f: number, ms: number): void {
    const now = control.millis()
    if (now - lastBeep < 55) return          // 限流，别一帧响几十次
    lastBeep = now
    music.tonePlayable(f, ms).play(music.PlaybackMode.InBackground)
}
```

**为什么**：`music.playTone()` 内部会 `pause()`，直接调用会**阻塞主循环**，游戏一卡一卡。必须拿一个 Playable 对象用 `InBackground` 播放；再加 55 ms 限流防止爆炸时几十个音效叠在一起。
Python 版：`music.tone_playable(f, ms).play(music.PlaybackMode.IN_BACKGROUND)`。

### 第 4 步：菜单 + 启动分支（和 04 同一个套路）

```ts
let _launch = settings.readNumber("lg") || 0
if (_launch !== 0) settings.writeNumber("lg", 0)   // 冷启动永远回菜单
G.cur = _launch
// ...
if (G.cur === 0) { /* 菜单 */ }
else if (G.cur === 1) { Snake.start() }
else if (G.cur === 2) { Platformer.start() }
else if (G.cur === 3) { Contra.start() }
else { Tanks.start() }
```

**为什么**：`settings` 记下「本次复位要启动哪个」，`game.reset()` 后程序重跑，只进一个分支。四个游戏的代码都在 Flash 里，但**同一时刻只跑一个**，所以 SRAM 只装一个游戏的数据。

### 第 5 步：长按 B 返回菜单（解决按键不够）

```ts
export function tickQuit(): void {
    if (controller.B.isPressed()) {
        if (bHold === 0) bHold = control.millis()
        quitProgress = control.millis() - bHold
        if (quitProgress >= 1200 && cur !== 0) toMenu()
    } else { bHold = 0; quitProgress = 0 }
}
// game.onUpdate(function () { G.tickQuit() })
```

**为什么**：B 在游戏里还要用作射击/冲刺，短按不能抢。用 `isPressed()`（持续检测）+ `control.millis()` 计时实现「长按」，再用一条黄色进度条把等待过程画出来，孩子按得住也不会迷惑。

### 第 6 步：每个游戏用「平行数组」管理实体

以子弹为例（TS 版 `contra.ts`）：

```ts
let bx: number[] = []      // 所有子弹的 x
let by: number[] = []      // 所有子弹的 y
let bvx: number[] = []     // 所有子弹的 x 速度
let bvy: number[] = []     // 所有子弹的 y 速度
// 第 i 颗子弹 = (bx[i], by[i], bvx[i], bvy[i])
```

**为什么**：静态 TS / Python 里没有好用的对象数组，用「几个等长数组 + 同一个下标」最省内存也最快。删除第 i 颗就四个数组一起 `removeAt(i)`。
Python 版要写成 `bx: List[number] = []`（`[]` 空数组必须加类型标注，否则转译后是 `any[]` 编译报错），并且**不能用 `lambda`**。

### 第 7 步：一个游戏的主循环长这样

```ts
game.onUpdate(function () {   // 逻辑：只算数，不画
    tickQuit()
    movePlayer()
    spawnEnemies()
    moveBullets()
    checkCollisions()
})
game.onShade(function () {    // 绘制：只画，不改逻辑
    screen.fill(BLACK)
    hud(...)
    drawMap()
    drawPlayer()
    drawEnemies()
    if (isOver) drawOver()
})
```

**为什么分开**：逻辑跑在渲染前，绘制跑在渲染后（否则被清屏擦掉 → 黑屏）。这个「**先算后画**」的分工是所有游戏引擎的基本结构，也是本项目最值得讲的一点。

### 第 8 步：一次只加一个游戏，边加边测体积

实测（把其余游戏换成空壳单独编译）：

| 构建 | 代码量 |
| --- | --- |
| 空壳（菜单 + 运行时） | 280.5 KiB |
| + 贪吃蛇 | +8.0 KiB |
| + 横版闯关 | +18.2 KiB |
| + 横版枪战 | +19.0 KiB |
| + 坦克大战 | +19.2 KiB |
| **四合一完整** | **343.0 KiB / 448 KiB（76.6%）** |

**为什么**：应用区 `0x08010000`~`0x08080000` 共 448 KiB。每加一个游戏都编一次，确认没超，再加下一个。还剩约 105 KiB。

> 完整代码：`main.ts` + 4 个游戏 `.ts`；Python 对照：`main.py` 单文件。

---

## 3. 给孩子讲的教案（建议拆成 2～3 次课）

> 这个项目**不适合编程第一课**。建议顺序：01 → 02 → 03 → 04 → 05 → 06。
> 讲的时候不要从头读代码，按下面的「三层」从外往里剥。

### 三层结构（画在纸上）

```
第 1 层  菜单：选哪个游戏 → 写小纸条(settings) → 重启
第 2 层  地基：调色板 / r() 画方块 / t() 写字 / hit() 判碰撞 / beep() 响一声
第 3 层  四个游戏：都是「每帧先算，再画」
```

### 三个最重要的概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **坐标与矩形** | 方格纸上用一个 (x, y) + 宽高描述每个东西 | `r(x, y, w, h, c)` |
| **矩形碰撞** | 两张纸片在桌上有没有叠在一起 | `hit(...)` 的 4 个条件 |
| **先算后画** | 先想好棋子怎么走，再摆到棋盘上 | `onUpdate` 算 / `onShade` 画 |

### 互动提问

1. 「`hit()` 里为什么是 4 个条件，不是 2 个？」→ 要 x、y **两个方向都重叠**才算碰到。
2. 「为什么音效要『后台播放』？」→ 前台播放会把游戏「按暂停」，一卡一卡的。
3. 「四个游戏一起编进来，为什么内存没爆？」→ 代码在 Flash，运行时只装一个游戏的数据到 SRAM。
4. 「为什么 B 要长按才回菜单？」→ 短按在游戏里还有用，按键不够，只能靠「按多久」区分。

### 动手任务（挑 2～3 个，别全做）

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 换菜单标题颜色 | `G.tc("RETRO 4-IN-1", 9, G.WHITE)` 的 `WHITE` 改 `YELLOW` | 立刻可见 |
| 2 | 贪吃蛇走得慢一点 | `snake.ts` 的 `tickMs` / Python 版 `speed = 150` → 250 | 更好控制 |
| 3 | 贪吃蛇加速更猛 | `speed -= 10` → `speed -= 20` | 后期很刺激 |
| 4 | 小人或坦克换色 | 对应 `G.r(..., G.RED)` 的颜色常量 | 美术改造 |
| 5 | 加一格地图障碍 | `snake.ts` 的地图字符串 / `tanks.ts` 的 `MAPS` 加一个 `B` | 关卡改造 |
| 6 | 长按 B 改成 0.5 秒 | `quitProgress >= 1200` → `500` | 更快回菜单 |
| 7 | 让子弹更快 | `contra.ts` / Python `contra_start()` 里的 `bvx.append(3.4)` | 手感变化 |

### 讲完的延伸

让孩子自己加**第 5 个游戏**：复制一份 `snake.ts` 改成 `namespace Pong`，在 `main.ts` 的菜单数组加一项、末尾加一个分支。这张「改 3 处就能加一个游戏」的清单，就是软件架构最直观的一课。

---

## 4. 可以改的地方

| 想改什么 | 位置 |
| --- | --- |
| 调色板 / 全局颜色 | `main.ts` → `namespace G` 顶部常量 |
| 菜单项、图标、副标题 | `main.ts` → `names` / `subs` / `pixelIcon()` |
| 返回菜单的长按时间 | `G.tickQuit()` 里的 `1200` |
| 贪吃蛇速度、地图、奖励 | `snake.ts` 开头的常量与 `MAPS` |
| 跳跃高度、重力、关卡 | `platformer.ts` 开头的常量与 `WORLDS` |
| 武器、敌人、Boss 血量 | `contra.ts` 开头的常量 |
| 地图、敌坦克 AI、道具 | `tanks.ts` 的 `MAPS` 与各 `const` |
| Python 版所有玩法参数 | `main.py` 各 `xxx_start()` 函数开头 |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript | 静态 Python |
| --- | --- | --- |
| 命名空间 | `namespace Snake { export function start() {} }` | 一个 `def snake_start():` + 内部嵌套函数 |
| 常量 | `const SW = 160` | `SW = 160` |
| 空数组 | `let bx: number[] = []` | `bx: List[number] = []` ← **必须标注类型** |
| 删数组元素 | `bx.removeAt(i)`（无参数版本 `pop()` 可用） | `bx.remove_at(i)`（`pop(0)` 不支持） |
| 头插 | `bx.insertAt(0, v)` | `bx.insert_at(0, v)` |
| 闭包改外层变量 | 直接赋值 | 必须写 `nonlocal x, y, ...` |
| 整数除法 | `Math.floor(a / b)` | `Math.floor(a / b)`（`//` 不保证可用） |
| 音效 | `music.PlaybackMode.InBackground` | `music.PlaybackMode.IN_BACKGROUND` |
| 绘制回调 | `game.onShade(function(){...})` | 具名 `def draw(): ...` + `game.on_shade(draw)` |
| 体积 | 343.0 KiB（完整 4 游戏） | 303.0 KiB（精简版 4 游戏） |

> 两个版本**共用同一套架构**：settings 存选择 → reset → 只启动一个分支 → `onUpdate` 算 / `onShade` 画。语言换了，思路没换。这是给孩子讲「编程思想比语法重要」最好的例子。

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 06-legend-collection ts firmware/09-legend-4in1.uf2
bash tools/build-lang.sh 06-legend-collection py firmware/09-legend-4in1-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 9`。

> `tools/build-lang.sh ... ts` 会自动收集目录下所有 `.ts`（5 个文件）一起编译；`py` 会自动走「静态 Python → TS → 本机码」两步。

---

## 7. 常见坑

1. **黑屏**：`screen.xxx` 写在 `game.onUpdate` 被清屏擦掉。全称排查见 `doc/06-屏幕绘图与坐标.md` —— 本项目曾经真机全黑，已改为 `onShade` 并回归验证。
2. **音效卡帧**：`music.playTone()` 会阻塞，必须 `InBackground`。
3. **中文乱码**：默认无中文字库，界面一律英文。
4. **Python 空数组报 `implicitly has type any[]`**：写 `a: List[number] = []`。
5. **Python 项目编出空壳**：`pxt.json` 缺 `preferredEditor: "pyprj"`；`build-lang.sh` 会自动生成。
6. **Flash 超限**：448 KiB 是硬上限，加内容前先 `mkc build` 看 `binary.uf2` 体积。
7. **地图字符串行宽不一致**：`tanks.ts` 的 `MAPS` 每行必须 13 字符，脚本可校验。

---

## 8. 相关文档与官方示例

- 本项目文件：`main.ts`（菜单 + 共享工具命名空间）、`snake.ts`、`platformer.ts`、`contra.ts`、`tanks.ts`，以及同玩法的 `main.py`（Python 教学精简版）
- `doc/06-屏幕绘图与坐标.md` —— 本项目的返工记录：`onShade` 与清屏顺序
- `doc/05-数组与字符串.md` —— 本章用的数值数组、字符地图写法
- `doc/硬件介绍.md` —— 448 KiB 应用区怎么算出来的、为什么不能装 ROM
- 官方积木示例对照：<https://arcade.makecode.com/tutorials>（Caterpillar / Jumpy Platformer / Galga / Blocky Boss Battle）

**教孩子请优先用官网带积木源码的示例**，这个项目适合讲架构、自由改关卡，以及「大程序是怎么组织起来的」。
