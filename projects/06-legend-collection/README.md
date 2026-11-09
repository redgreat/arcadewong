# 06 · RETRO 6-IN-1 六大经典游戏合集

> 一个 UF2 里装 **贪吃蛇 / 横版跳跃 / 横版枪战 / 坦克大战 / 火柴人枪战跑酷 / 飞机大战**，每个都有完整玩法系统。
> 这是仓库里最大、也最适合「讲架构」的项目：不用精灵系统，全部**每帧直接画屏**，把 448 KiB Flash 用掉 382 KiB。
> **六个游戏全部无限生命**：中弹只是短暂无敌 / 退回起点，永远不会 GAME OVER，想玩多久玩多久（长按 B 回菜单）。
> 对应固件：`firmware/09-legend-6in1.uf2`。

⚠️ **定位说明**：这是**玩法与系统的完整原创实现**（物理、碰撞、关卡、敌人 AI、Boss、道具、命与计分），不是 ROM 移植。原版关卡 / 美术 / 音乐有版权，这台机器也没有存储介质放 ROM。游戏名用 `SNAKE / PLATFORM HERO / RUN & GUN / TANK BATTLE / STICKMAN / SKY RAIDER` 等原创名。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | **公共层**：调色板、绘图小工具（含**右对齐 `tr()` / 浮雕面板 `panel()`**）、非阻塞音效、**单行菜单**、启动分支、长按 B 返回 |
| `snake.ts` | 贪吃蛇：20×13 网格、4 套障碍图、穿墙、逐级加速、金色奖励食物、最高分存 Flash、暂停 |
| `platformer.ts` | 横版闯关：3 世界卷轴、长短跳、冲刺、问号砖出道具、两种敌人可踩、尖刺深坑、变大、旗帜过关 |
| `contra.ts` | 横版枪战：3 关、八方向射击、4 种武器、步兵/炮台/冲锋兵、移动 Boss + 扇形多向弹幕 + 血条、武器胶囊、爆炸粒子 |
| `tanks.ts` | 坦克大战：13×13 战场 4 图、砖墙四段破坏、钢/水/草、护老鹰基地、4 种敌坦克 AI、子弹对撞、6 道具 |
| `stickman.ts` | 火柴人枪战跑酷：1px 线条小人 + 枪、自动卷轴、二段跳、**木箱道具**（霰弹/机枪/核弹/无敌）、**每关一个 BOSS**（血条 + 扇形瞄准弹幕 + 召唤小兵） |
| `skyraider.ts` | 飞机大战：四向移动、按住连发、**6 种掉落道具**（全屏炸弹/火箭弹/霰弹枪/速射/护盾/加命）、三种敌机、护盾与无敌；刷怪与掉落已调稀 |
| `main.py` | **Python 版（教学精简版）**：同样的菜单架构 + 同样 6 个可玩的游戏，压缩成单文件，便于对照学习 |
| `pxt.json` / `mkc.json` | 项目清单（7 个 .ts）/ F4 编译设置 |
| `README.md` | 本文件 |

> TS 版约 3324 行（`main.ts` 308 + 六个游戏 3016）；Python 版约 1659 行，是**同源精简实现**（关卡数、道具数比 TS 版少），用来讲语法与架构，不适合当作「完整移植」。
> 两个版本都已实测编译出 F4 固件：TS 382.2 KiB、Python 326.0 KiB。
> ⚠️ **Python 版的火柴人仍是「跳跃 + 直拳」的精简版**（见 5.3 的坑：转译器对超大函数有限制），枪 / BOSS 那套完整玩法在 TS 版。

---

## 1. 先玩，再讲（10 分钟）

开机 `RETRO 6-IN-1` 菜单：↑↓ 选、A 进入；**游戏内长按 B 约 1.2 秒**回菜单（顶部/底部有黄色进度条），短按 B 留给游戏内操作。
六个游戏各玩 1 分钟（菜单一屏 6 条全放得下，一行一个名字、没有副标题），然后问：「这六个游戏画面风格差这么远，为什么能塞进同一个固件？」——引出「**它们其实共用一个画图的地基层**」。

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
- 六个游戏同时编进一个固件，精灵系统 + 全部图片资源很占空间；直接画矩形几乎不占资源。
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

**为什么**：把长 API 缩成 `r / t / tc`，六个游戏文件里满屏都是短名字，孩子读代码不会被 API 名字劝退。
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
else if (G.cur === 4) { Tanks.start() }
else if (G.cur === 5) { Stickman.start() }
else { SkyRaider.start() }
```

**为什么**：`settings` 记下「本次复位要启动哪个」，`game.reset()` 后程序重跑，只进一个分支。六个游戏的代码都在 Flash 里，但**同一时刻只跑一个**，所以 SRAM 只装一个游戏的数据。

### 第 4.5 步：菜单只留一行英文，6 项正好一屏

菜单最初带副标题（`SUBS`：`"EAT · GROW · DON'T BITE"` 之类），一行 18px 只排得下 4 条，于是写了滚动窗口。后来发现两件事：**副标题在 160px 宽的屏上几乎必然撞车**，而且滚动的菜单在真机上「一眼看不全，不如不滚」。所以砍成：

```ts
const names = ["SNAKE", "PLATFORM", "RUN & GUN", "TANK BATTLE", "STICKMAN", "SKY RAIDER"]
// 一行 14px，6 项从 y=26 排到 y=96，一屏放下，不需要 scroll / VIS / 滚动条
for (let i = 0; i < N; i++) {
    const y = 26 + i * 14
    const sel = cursor === i + 1
    if (sel) { G.r(6, y-3, 148, 13, G.BLUE); G.box(6, y-3, 148, 13, G.YELLOW); G.r(6, y-3, 2, 13, G.YELLOW) }
    G.pixelIcon(14, y - 1, i)                            // 8x8 小图标，固定列
    G.t((i + 1) + ".", 28, y, sel ? WHITE : G.GRAY)      // 序号在固定列
    G.t(names[i], 46, y, sel ? YELLOW : WHITE)           // 名字在固定列
}
```

**为什么**：`names` 最长的 `TANK BATTLE` 是 11 字符 = 66px，从 x=46 起画到 112，离右边界还有 48px 余量——**排版先算最坏情况**，算得下才敢删滚动。选中行的样式是「蓝底 + 黄框 + 左侧 2px 黄条」，三层冗余，即使在小屏/坏屏上一眼也能认出光标在哪。

> 教训：**能一屏放下的列表就不要做滚动**。滚动是给「数据一定比屏幕多」的场景用的，不是好看的装饰。

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
| **四合一完整（旧）** | **344.2 KiB / 448 KiB（76.8%）** |
| + 火柴人跑酷 + 飞机大战 | +22.0 KiB（两项合计，未单独隔离测） |
| **六合一完整（初版）** | **366.2 KiB / 448 KiB（81.7%）** |
| 火柴人改枪战 + BOSS + 木箱 | +10.8 KiB |
| **六合一完整（初版）** | **377.0 KiB / 448 KiB（84.2%）** |
| 全屏换肤 + 排版重做（面板/夜空/右对齐 HUD/开场卡） | +5.2 KiB |
| **六合一完整（当前）** | **382.2 KiB / 448 KiB（85.3%）** |

**为什么**：应用区 `0x08010000`~`0x08080000` 共 448 KiB。每加一个游戏都编一次，确认没超，再加下一个。还剩约 66 KiB —— 再加一个中等体量的游戏就到头了，所以后面要么加小游戏，要么开始砍内容。

> 完整代码：`main.ts` + 6 个游戏 `.ts`；Python 对照：`main.py` 单文件。

---

## 2.5 两个新游戏的设计要点

### 火柴人枪战跑酷（`stickman.ts`）

- **没有精灵图，全是线**：头是一个 5×5 方块，躯干 / 两臂 / 两腿各一条 `drawLine`，摆臂靠一个 `swing` 变量在 +1 / -1 之间跳。手里加一条灰色横杠 + 黄色枪口，就成了「拿枪的火柴人」。
- **世界往后跑，人左右微调**：所有实体每帧 `x -= spd * dt`，`spd = 62 + (关卡-1)*8`。左右键只在自己这一小段（8..84）里挪，用来躲弹幕，不改卷轴速度。
- **打枪而不是打拳**：按住 A 连发，三把枪——手枪（伤害 2）/ 霰弹（3 发微扇形）/ 机枪（双发高频）。
- **三关一个循环，每关一个 BOSS**：推进 `1200px` 就到关底，BOSS 从右边走进来，上下浮动 + **朝玩家当前位置瞄准**的 1~3 发扇形弹（血量过半变 3 发），还会每 6 秒召唤小兵（场上最多 2 个）。打死才进下一关，关数越高血越厚、弹越快。
- **木箱是唯一补给**：箱子贴地或挂半空，**打碎或撞到**都会开，五段权重掉：霰弹枪 → 机枪 → **核弹** → 无敌 8 秒 → 300 分。核弹是立即引爆的：全屏敌人清场、敌弹清空、BOSS 直接掉 14 血，屏幕白闪一下。
- **无限生命**：中弹只是 1.7 秒无敌 + 被顶一下，不会死；想结束只有长按 B 回菜单。

### 飞机大战（`skyraider.ts`）

- **道具必须机身碰到**：不做吸附、不做自动收集，飞过去就没了。判定框比机身略大（16×16 vs 14×14），手感上「擦到也算」。
- **6 种道具，5 种改变玩法**：
  | 字母 | 道具 | 效果 |
  | --- | --- | --- |
  | `B` | 全屏炸弹 | 存进炸弹数，短按 B 引爆：清屏 + 每架 120 分 |
  | `R` | 火箭弹 | 双发平行、**穿透**、伤害 3，12 秒 |
  | `S` | 霰弹枪 | 5 发扇形（±26°），12 秒 |
  | `F` | 速射 | 双管 + 射速翻倍，12 秒 |
  | `P` | 护盾 | 挡一次伤害，9 秒 |
  | `1` | 加命 | 稀有 |
- **掉落有两条线**：击毁敌机 24% 概率掉 + 一个独立的「道具雨」计时器每 1.6~3.0 秒丢一个。前者奖励打得准，后者保证画面里一直有东西可以抢。
- **难度曲线**：刷怪间隔 `900 - score/8`（下限 340ms），所以越往后越密；敌机分 4 类（直线小兵 / 蛇形 / 射手 / 重机），射手的子弹是**朝玩家当前位置**算的，站桩会被打。

---

## 2.6 这一轮的三个「真问题」

1. **贪吃蛇一进游戏就死**：蛇身数组 `bx = [4, 3, 2]` 里**最后一位才是蛇头**（代码里按 `bx[bx.length - 1]` 取头），而默认方向是向右 —— 蛇头在 x=2 往右一步正好踩到 x=3 的身体，第一步就自撞。修法是把数组方向反过来（`[2, 3, 4]`），并且改成「找一处横排 4 格全空的地方放蛇」，避免复活就贴墙。
2. **这台机器的 16 色并不是直觉顺序**：写了个探针把 1~15 号色块全画出来逐个取色，实测 `12` 是深灰、`13` 是浅粉、`14` 是**棕色**、`8` 才是深蓝。常量表把名字写反了（`DKBLUE = 14`），于是火柴人的天空一直是棕色。现在按实测改：天空 `BLACK`、楼影 `BLUE`、地面用 `DKBLUE`（=棕）、木箱棕色 + 黄框。
3. **BOSS 召唤的小兵把子弹全挡了**：BOSS 阶段世界滚动速度是 0，小兵仍用 `spd + 6` 前进 → 只有 6px/秒，越召唤越堵，玩家怎么打都碰不到 BOSS。改成 `Math.max(40, s + 6)`，并且把召唤间隔拉到 6 秒、场上最多 2 个。

---

## 2.7 排版铁律：为什么之前一直在叠字

这一轮的主要工作其实是「把屏幕上所有字摆正」。归结成三条实测出来的规矩，写在 `main.ts` 文件头，改任何界面之前先读一遍。

### 规矩一：字宽是 6px，一行只有 26 个字

没查文档，直接做实验：画 26 个 `A`（白）从 x=0 起，再在 x=156 画一条红竖线，截图取色——白像素 span 是 `0..154`，红线正好贴在文字右边缘外。

```
每个字符 = 5px 字形 + 1px 间隙 = 6px    一行 160 / 6 = 26 字符封顶
```

所以 `printCenter` 就是 `(160 - len * 6) / 2`（探针验证过），自己在 `G.tc()` 里算和调内置函数结果完全一致。**所有宽度预算都按 `字符数 × 6` 算**，别估。

### 规矩二：HUD 每个字段右对齐到固定列，绝不左对齐拼接

以前的写法是 `t("SC " + score, 60, 1, WHITE)`——分数一长（4 位、5 位），整串就往右顶，直接压到隔壁的 `L:INF` 上。这是「文字重叠」的**主因**。改法：

```ts
export function tr(s: string, xr: number, y: number, c: number): void {
    screen.print(s, xr - s.length * CW, y, c)   // xr 是右边界，字多了只往左长
}
```

HUD 改成「每个字段有一个固定右边界」：

```ts
G.t("LV " + level, 2, 1, CYAN)          // 左对齐区：2 起步，宽度天然有界
G.tr("SC " + G.sc(score), 96, 1, WHITE) // 右对齐到 96
G.tr("HI " + G.sc(best), 158, 1, YELLOW)// 右对齐到 158（屏幕右边界内 2px）
```

再配一个压缩函数，让字段**宽度恒定**：

```ts
export function sc(n: number): string {
    return n < 10000 ? "" + n : Math.floor(n / 1000) + "K"   // 12345 → "12K"
}
```

`SC 12K` 永远 6 字符 = 36px，右对齐后位置纹丝不动。**这是排版比配色更重要的原因：位置不变，才谈得上好看。**

### 规矩三：任何浮层先铺黑底，再写字

暂停面板、过关卡、GAME OVER、底部 `HOLD B: MENU` —— 早期都是「直接写字压在游戏画面上」，背景有楼、有砖、有子弹，字就糊成一团。现在统一走 `G.panel()`：

```ts
export function panel(x, y, w, h, c1, c2): void {
    r(x, y, w, h, c1)              // 外框实心
    r(x + 1, y + 1, w - 2, h - 2, c2)   // 次层
    r(x + 2, y + 2, w - 4, h - 4, BLACK) // 黑底，保证文字对比度
}
```

底部提示条同理：先 `r(0, SH - 10, SW, 10, BLACK)` 把那一横条变黑，再写 `HOLD B: MENU`。

### 顺带记一个翻车：160×120 上不要做抖动渐变

想给天空加个「深蓝到浅青」的过渡，第一版用 1px 棋盘抖动（dithering）铺满整屏——截图一看像**满屏噪点**，比纯色难看十倍。退一步改成 10px 一档的分段抖动，还是「一片麻点」。最后全部改成**硬边两段**或干脆单色：

```ts
// 平台跳跃最终就是纯色一片，靠远山/近山剪影和云做层次
G.r(0, 12, 160, 92, G.CYAN)
```

> 硬件只有 16 色、屏只有 160×120，**抖动过渡的收益远小于噪点代价**。层次感要靠「形状 + 剪影 + 少量亮色点缀（太阳/云/星点）」，不是靠渐变。

---

## 2.8 六屏换肤对照（这轮改了哪些画面）

统一往「有纵深的剪影背景 + 浮雕面板 + 木箱材质」方向靠，六个游戏共享同一套视觉语言，但各自的天空/配色不同，一眼能分辨。

| 游戏 | 背景 | 主体材质 | HUD 强调色 |
| --- | --- | --- | --- |
| 贪吃蛇 | 深蓝网格（每格 8px 的 `BLUE` 线）+ 上下 `TEAL` 装饰条 | 砖块改**木箱**：`WOOD` 底 + `ORANGE` 顶/左边 + `DKGRAY` 板缝；苹果有白高光 + 绿叶 + 呼吸光环，金苹果是十字星 | `GREEN` |
| 横版跳跃 | 单色青天 + 太阳（双层 `disc` + 四向光芒）+ 5 朵云 | 三角斜坡远山 6 座 `BLUE`（`cam/6`）+ 近山 7 座 `TEAL`（`cam/3`），砖块 `WOOD`/`DKGRAY`，地面下方铺黑避免深坑漏天空 | `CYAN` |
| 横版枪战 | 黑底 + 24 星点 + 视差月亮 + 7 栋 `BLUE` 楼剪影带亮窗 | 地形 `WOOD` 底 + `GREEN` 草皮 + 双色纹理；钢平台加 `DKGRAY` 底边；Boss 加黑描边 + `LTGLOW` 外框 + 黑瞳孔 | `CYAN` |
| 坦克大战 | 战场外框 `DKGRAY` + 内衬 `BLACK` + `GRAY` 描边 + **四角标记** | 砖墙 `WOOD` + `ORANGE` 顶 + 板缝；钢墙加白顶线；老鹰基地加白高光；护盾从实心块改空心框 | `GREEN` |
| 火柴人 | 黑底 + 20 星点 + 双层月亮带陨坑 + 远楼 9 栋 `BLUE`（`dist/5`）+ 近楼 7 栋 `DKGRAY` 带天线（`dist/2.4`） | 木箱 `WOOD` + `YELLOW` 框 + `ORANGE` 交叉板 + 中央黄点；地面 `WOOD` + `GREEN` 草皮 | `PINK`（BOSS 阶段切 `CYAN`） |
| 飞机大战 | 黑底 + 3 条稀疏紫色星云点带 + 34 颗三层视差星（白/灰/青） | 机体保持几何块，靠拖尾与白芯子弹提亮 | `PURPLE` |

共用的三个新组件：

- `G.panel(x, y, w, h, c1, c2)` —— 双层浮雕面板（外框 + 次层 + 黑底），暂停/过关/GAME OVER 全用它
- `G.corners(x, y, w, h, len, c)` —— 四角 L 形标记，用来给「战场/画框」这类区域加仪式感
- `G.bar(x, y, w, h, pct, fg, bg, edge)` —— 带外框的进度条（长按 B 回菜单、武器剩余时间、Boss 血条、关卡推进共用）
- `G.introCard(title, k1, k2, c)` —— 开局 2.6 秒自动消失的操作卡，取代原来常驻在底部的按键提示（常驻文字既占地方又容易和场景叠）

---

## 3. 给孩子讲的教案（建议拆成 2～3 次课）

> 这个项目**不适合编程第一课**。建议顺序：01 → 02 → 03 → 04 → 05 → 06。
> 讲的时候不要从头读代码，按下面的「三层」从外往里剥。

### 三层结构（画在纸上）

```
第 1 层  菜单：选哪个游戏 → 写小纸条(settings) → 重启
第 2 层  地基：调色板 / r() 画方块 / t() 写字 / hit() 判碰撞 / beep() 响一声
第 3 层  六个游戏：都是「每帧先算，再画」
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
3. 「六个游戏一起编进来，为什么内存没爆？」→ 代码在 Flash，运行时只装一个游戏的数据到 SRAM。
4. 「为什么 B 要长按才回菜单？」→ 短按在游戏里还有用，按键不够，只能靠「按多久」区分。
5. 「屏幕一行能写几个字？怎么写才不会挤在一起？」→ 一个字 6px，一行 26 个；HUD 靠**右对齐**让分数越长越往左长，不压邻居。

### 动手任务（挑 2～3 个，别全做）

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 换菜单标题颜色 | `G.tc("RETRO 6-IN-1", 7, G.WHITE)` 的 `WHITE` 改 `YELLOW` | 立刻可见 |
| 2 | 贪吃蛇走得慢一点 | `snake.ts` 的 `tickMs` / Python 版 `speed = 150` → 250 | 更好控制 |
| 3 | 贪吃蛇加速更猛 | `speed -= 10` → `speed -= 20` | 后期很刺激 |
| 4 | 小人或坦克换色 | 对应 `G.r(..., G.RED)` 的颜色常量 | 美术改造 |
| 5 | 加一格地图障碍 | `snake.ts` 的地图字符串 / `tanks.ts` 的 `MAPS` 加一个 `B` | 关卡改造 |
| 6 | 长按 B 改成 0.5 秒 | `quitProgress >= 1200` → `500` | 更快回菜单 |
| 7 | 让子弹更快 | `contra.ts` / Python `contra_start()` 里的 `bvx.append(3.4)` | 手感变化 |
| 8 | 火柴人跑更快 | `stickman.ts` 的 `spd()` 里 `62` 改 `100` | 手忙脚乱 |
| 9 | 让道具更多 | `skyraider.ts` 的 `dropCd = G.ri(2900, 4900)` → `G.ri(900, 1600)` | 满地都是 |
| 10 | 一枪打掉更多血 | `stickman.ts` 的 `shoot()` 里手枪 `pushB(..., 240, 0, 2)` 的 `2` 改 `4` | 秒杀小兵 |

### 讲完的延伸

让孩子自己加**第 7 个游戏**：复制一份 `snake.ts` 改成 `namespace Pong`，在 `main.ts` 的菜单数组加一项、末尾加一个分支。这张「改 3 处就能加一个游戏」的清单，就是软件架构最直观的一课。

---

## 4. 可以改的地方

| 想改什么 | 位置 |
| --- | --- |
| 调色板 / 全局颜色 | `main.ts` → `namespace G` 顶部常量 |
| 菜单项名字 | `main.ts` → 菜单段的 `names`（一行一个，注意最长的那个 × 6px 别超 114） |
| 菜单行距 / 起始 y | `main.ts` 菜单段的 `y = 26 + i * 14` |
| 公共排版工具（字宽、右对齐、面板） | `main.ts` → `CW = 6` / `tr()` / `sc()` / `panel()` |
| 返回菜单的长按时间 | `G.tickQuit()` 里的 `1200` |
| 贪吃蛇速度、地图、奖励 | `snake.ts` 开头的常量与 `MAPS` |
| 跳跃高度、重力、关卡 | `platformer.ts` 开头的常量与 `WORLDS` |
| 武器伤害与子弹大小 | `contra.ts` 的 `firePlayer()`（伤害）与 `bW()` / `bH()`（判定框） |
| Boss 弹幕密度与扇面 | `contra.ts` 的 Boss 段：`bossCd`（间隔）/ `n`（发数）/ `spread`（扇面角度） |
| Boss 血量 | `contra.ts` 的 `buildStage()` 里 `bossHpMax = 24 + s * 10` |
| 地图、敌坦克 AI、道具 | `tanks.ts` 的 `MAPS` 与各 `const` |
| 火柴人跑速 / 跳跃 / 关卡长度 | `stickman.ts` 的 `spd()`、`jump()` 里的 `-172`、`STAGE_LEN = 1200` |
| 火柴人 BOSS 血量 / 弹幕 | `stickman.ts` 的 `startBoss()`（`bHp = 26 + stg * 14`）与 `bossFire()`（发数、间隔 `bCd`） |
| 火柴人木箱内容与掉率 | `stickman.ts` 的 `openCrate()`（五段权重）与 `nextCrate = G.ri(150, 300)` |
| 飞机大战道具掉率与种类 | `skyraider.ts` 的 `dropItem()`（权重）、`dropCd`（道具雨间隔）、`pickup()`（效果时长） |
| 飞机大战刷怪节奏 | `skyraider.ts` 的 `spawnCd = Math.max(640, 1250 - ...)` |
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
| 单个函数长度 | 几百行也能编 | **约 200 行以上会编不过**（`error TS9200: Assertion failed`），必须拆成几个小函数 |
| 体积 | 382.2 KiB（完整 6 游戏） | 326.0 KiB（精简版 6 游戏） |

> 两个版本**共用同一套架构**：settings 存选择 → reset → 只启动一个分支 → `onUpdate` 算 / `onShade` 画。语言换了，思路没换。这是给孩子讲「编程思想比语法重要」最好的例子。

> ⚠️ **「长函数」这个坑是这回真踩到的**：Python 版的飞机大战一开始把「移动 / 子弹 / 敌机 / 敌弹 / 道具」全写在一个 `tick()` 里（约 290 行），转译成 TS 后二次编译直接报 `main.ts(1,1): error TS9200: Assertion failed` —— 报错位置在文件第一行，完全没有指向真正的原因，只能靠二分删除逐段定位。拆成 `step_player / step_shots / step_foes / step_items` 四个小函数后立刻通过。
> 这也是个很好的教学点：**「能跑」和「好维护」是两件事**，编译器不给你指路的时候，二分定位比盯着代码猜有效得多。

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 06-legend-collection ts firmware/09-legend-6in1.uf2
bash tools/build-lang.sh 06-legend-collection py firmware/09-legend-6in1-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 9`。

> `tools/build-lang.sh ... ts` 会自动收集目录下所有 `.ts`（7 个文件）一起编译；`py` 会自动走「静态 Python → TS → 本机码」两步。

---

## 7. 常见坑

1. **黑屏**：`screen.xxx` 写在 `game.onUpdate` 被清屏擦掉。全称排查见 `doc/06-屏幕绘图与坐标.md` —— 本项目曾经真机全黑，已改为 `onShade` 并回归验证。
2. **音效卡帧**：`music.playTone()` 会阻塞，必须 `InBackground`。
3. **中文乱码**：默认无中文字库，界面一律英文。
4. **Python 空数组报 `implicitly has type any[]`**：写 `a: List[number] = []`。
5. **Python 项目编出空壳**：`pxt.json` 缺 `preferredEditor: "pyprj"`；`build-lang.sh` 会自动生成。
6. **Flash 超限**：448 KiB 是硬上限，加内容前先 `mkc build` 看 `binary.uf2` 体积。
7. **地图字符串行宽不一致**：`tanks.ts` 的 `MAPS` 每行必须 13 字符，脚本可校验。
8. **Python 编不过、报 `TS9200 Assertion failed` 且位置是 `(1,1)`**：八成是某个函数太长（≈200 行以上）。把它拆成几个 50 行左右的小函数，别在报错位置上找原因。
9. **Python 的「外层大函数」也会踩同一个坑**：把 20 多个状态变量 + 20 个嵌套函数塞进同一个 `xxx_start()`（≈900 行）同样报 `TS9200`。飞机大战的 580 行没事，火柴人 900 行就炸——但目前**不能靠「把状态提到模块级」绕开**：这个版本的转译器不支持模块级数组，`bx: List[number] = []` 或 `bx = []` 写在模块级都会被当成 `number`，报 `can't find called function 'len'`。所以 Python 版火柴人保留精简玩法，完整玩法在 TS 版（见 2.5 / 5 的说明）。
10. **模拟器里按键要先点一下画面**：`mkc serve` 起来的模拟器不吃键盘事件，得先点一下画面再按键；而且 `playwright-cli` 每条命令是独立进程，一次测试要把「打开 → 点击 → 按键 → 截图」串在同一个 bash 调用里。
11. **调色板别凭直觉**：`G.BROWN = 12` 其实是深灰、`G.DKBLUE = 14` 其实是棕色。改美术前先画一条 1~15 号色带实测。
12. **文字重叠的根治办法不是挤坐标，是右对齐**：把每个 HUD 字段给一个固定右边界，用 `G.tr(s, xr, y, c)` 往左排；再把动辄 5 位的分数用 `G.sc()` 压成 `12K`，字段宽度恒定，位置就永不动。左对齐 + 字符串拼接（`t("SC " + score, 60, ...)`）是叠字的根源。
13. **字宽按 6px 算，不是 5px**：5px 字形 + 1px 间隙。按 5px 估宽，一行写 28 个字会超到屏外被裁，或者 `printCenter` 居中有 1~2px 偏移。实测方法：画 26 个 `A` 从 x=0 起 + x=156 一条红竖线，截图看白像素是否正好停在 155 之前。
14. **不要在 160×120 上做抖动渐变**：16 色调色板 + 1px 点阵，全屏抖动的观感是「满屏噪点」，比纯色差得多。层次用剪影和亮色点缀做。

---

## 8. 相关文档与官方示例

- 本项目文件：`main.ts`（菜单 + 共享工具命名空间）、`snake.ts`、`platformer.ts`、`contra.ts`、`tanks.ts`、`stickman.ts`、`skyraider.ts`，以及同玩法的 `main.py`（Python 教学精简版）
- `doc/06-屏幕绘图与坐标.md` —— 本项目的返工记录：`onShade` 与清屏顺序
- `doc/05-数组与字符串.md` —— 本章用的数值数组、字符地图写法
- `doc/硬件介绍.md` —— 448 KiB 应用区怎么算出来的、为什么不能装 ROM
- 官方积木示例对照：<https://arcade.makecode.com/tutorials>（Caterpillar / Jumpy Platformer / Galga / Blocky Boss Battle）

**教孩子请优先用官网带积木源码的示例**，这个项目适合讲架构、自由改关卡，以及「大程序是怎么组织起来的」。
