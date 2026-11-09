# 04 · 三合一游戏合集（Game Box）

> 一个 UF2 里装 **3 个游戏**，开机用菜单选、B 键随时回菜单。
> 这个项目回答一个常被问到的问题：「这机器一次只能刷一个游戏，那我能不能装好多游戏？」
> 对应固件：`firmware/04-game-collection.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | TypeScript 版：菜单 + 三个游戏（当前编译入口） |
| `main.py` | Python 版，结构完全相同 |
| `pxt.json` / `mkc.json` | 项目清单 / F4 编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（5 分钟）

开机是 `GAME BOX` 菜单：↑↓ 选、A 进入、任意时刻 B 回菜单。三个游戏分别就是 `01/02/03` 的玩法。
问孩子：「机器明明只能装一个程序，为什么这里像装了三个？」——先让他们猜，再揭晓「**菜单本身也是一个程序**」。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：先想清楚「一次只能跑一个程序」这句话

UF2 烧录是把 **整块应用区覆盖**成一个程序，不是往文件夹里复制文件。所以：

- ❌ 拖第二个 UF2 进去 → 覆盖第一个；
- ✅ 在**一个程序里**写三个游戏的分支 → 想装几个装几个。

这台机器有 Flash 可以存少量数据（`settings`），于是有了一个巧妙做法：**把「用户选了第几个」写进 Flash，然后软重启；重启后程序从第一行重新执行，直接跳到选中的分支。**

### 第 2 步：读出选择，然后立刻清零

```ts
const MENU = 0
let selected = settings.readNumber("g") || 0
if (selected !== 0) settings.writeNumber("g", 0)
let cursor = 1
```

**为什么清零**：如果不清零，下次**冷开机**（拔线重插、按复位）也会直接跳进上次那个游戏，永远回不了菜单。
「读完立刻写 0」保证只有**本次软重启**才直达游戏。这是整个合集最容易漏、也最值得讲的一行。

Python 版：

```python
MENU = 0
selected = settings.read_number("g")
if selected != 0:
    settings.write_number("g", 0)
cursor = 1
```

### 第 3 步：注册一个「随时按 B 回菜单」的全局规则

```ts
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    settings.writeNumber("g", MENU)
    game.reset()
})
```

**为什么**：`game.reset()` 是**软重启**，程序从头开始跑，所有事件回调、精灵、分数全部清空——相当于「换游戏」最干净的复位方式，不用自己写一堆清理代码。

### 第 4 步：菜单分支（注意画在哪）

```ts
if (selected === MENU) {
    scene.setBackgroundColor(15)
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 1 ? 3 : cursor - 1
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 3 ? 1 : cursor + 1
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        settings.writeNumber("g", cursor)
        game.reset()
    })
    game.onShade(function () {          // ← 必须是 onShade！
        screen.fill(15)
        screen.printCenter("GAME BOX", 10, 5)
        screen.printCenter("1 CATCH PIZZA", 40, cursor === 1 ? 5 : 1)
        // ...
    })
}
```

**为什么用 `onShade`**：引擎每帧的顺序是
`onUpdate（逻辑）→ scene.render() → background.draw() 全屏清屏 → 精灵 → onPaint / onShade → 送屏`。
把 `screen.fill()` 写在 `onUpdate` 里，画完立刻被清掉，结果就是**纯黑屏**。
> 这个坑本仓库真的踩过，三个固件曾全部黑屏。完整复盘见 `doc/06-屏幕绘图与坐标.md`。
> Python 版写 `game.on_shade(draw_menu)`。

### 第 5 步：其余分支各启动一个游戏

```ts
} else if (selected === 1) {
    startCatch()
} else if (selected === 2) {
    startFlappy()
} else {
    startShooter()
}
```

三个 `startXxx()` 函数就是把 `01/02/03` 的 `main.ts` 整段搬进来，包在函数里。
**关键点**：因为 `game.reset()` 之后只会有**一个**分支被执行，所以三个游戏的事件回调不会互相干扰；如果直接把三段代码平铺在顶层，三个游戏会同时跑起来。

### 第 6 步：把每个游戏的函数补完

打开 `main.ts` 往下翻即可。写的时候建议一次只搬一个、编一次、刷一次，确认能进能出，再搬下一个。

---

## 3. 给孩子讲的教案（30～45 分钟）

> 建议在讲完 `01` 之后再上这一课，因为要用到「三个游戏已经写好了」这个前提。

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **分支 / 选择** | 到岔路口看路牌，只走其中一条 | `if / else if / else` |
| **记住一件事（存档）** | 把「我选了 2 号」写在小纸条上，重启后还能看到 | `settings.writeNumber` |
| **重启 / 状态清空** | 换一局桌游要把棋子全收回去 | `game.reset()` |

### 互动提问

1. 「菜单是第 4 个游戏吗？」→ 不是，菜单就是这个程序本身的一个分支。
2. 「如果删掉『读完立刻清零』那一行，会发生什么？」→ 以后开机永远直接进上次的游戏，回不到菜单。
3. 「为什么不把三个游戏的代码都平铺写？」→ 三个游戏会同时运行，屏幕上到处乱跑。
4. 「想加到 10 个游戏要改几处？」→ 菜单多 7 行、分支多 7 行、每个游戏一个函数；**架构不用变**。

### 动手任务

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 改菜单标题 | `"GAME BOX"` → 孩子的名字 | 开机就看到自己的名字 |
| 2 | 菜单换配色 | `printCenter(..., 5)` 的 5 改成 8 | 高亮变蓝色 |
| 3 | 加第 4 个菜单项 | `cursor === 1 ? 3 : ...` 改成 `4`，再补一行文字 | 多一个选项 |
| 4 | 让某个游戏变简单 | 进 `startCatch()` 把 `SPAWN_MS` 800 改 1500 | 该游戏难度下降 |
| 5 | 换成「按 A 直接回菜单」 | 把 B 的事件改成 A（注意和菜单 A 冲突，先讨论再动手） | 引出「同一个键在不同界面含义不同」 |
| 6 | 用 Python 版重写菜单 | 照着 `main.py` 改文字 | 理解两种语言是同一套逻辑 |

### 讲完的延伸

让孩子画一张**流程图**：开机 → 读 settings → 是 0 吗？是 → 菜单；否 → 清 0 → 第 N 个游戏 → 按 B → 写 0 → 重启。
这张图就是「状态机」的雏形，比任何术语都好懂。

---

## 4. 可以改的地方

这里没有集中的数字旋钮（三个游戏的参数在各自 `startXxx()` 函数里），可改的是**结构**：

| 想改什么 | 改哪里 |
| --- | --- |
| 菜单项数量 | `cursor === 1 ? 3 : ...` / `cursor === 3 ? 1 : ...`、`onShade` 里的文字行、末尾分支 |
| 每个游戏难度 | `startCatch()` 的 800 / 70 / 110，`startFlappy()` 的局部常量，`startShooter()` 的 700 / 45 |
| 存档键名 | `settings.readNumber("g")` / `writeNumber("g", ...)`，注意读写要一致 |
| 回菜单的键 | `controller.B.onEvent(...)` |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript | 静态 Python |
| --- | --- | --- |
| 变量 | `let cursor = 1` | `cursor = 1` |
| 三元表达式 | `cursor === 1 ? 3 : cursor - 1` | `3 if cursor == 1 else cursor - 1` |
| 相等 | `===` | `==` |
| 逻辑非 | `!==` | `!=` |
| 分支 | `if / else if / else` | `if / elif / else` |
| 存档 | `settings.readNumber` / `writeNumber` | `settings.read_number` / `write_number` |
| 绘制回调 | `game.onShade(function () {...})` | 先 `def draw_menu(): ...` 再 `game.on_shade(draw_menu)` |
| 改外层变量 | 直接赋值 | 函数里给模块级变量赋值要写 `global cursor` |

> `global` 是本项目 Python 版最值得讲的一个语法点：Python 默认「在函数里赋值 = 新建局部变量」，不加 `global` 会改不到外面那个 `cursor`。

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 04-game-collection ts firmware/04-game-collection.uf2
bash tools/build-lang.sh 04-game-collection py firmware/04-game-collection-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 4`。

---

## 7. 常见坑

1. **黑屏**：绘制放 `onUpdate` 被清屏擦掉 → 一律放 `onShade` / `on_shade`。本项目曾因此返工。
2. **开机直接进游戏、回不了菜单**：忘了「读完立刻清零」。
3. **settings 键名不一致**：读 `"g"` 写 `"h"`，菜单永远不生效。
4. **三个游戏同时跑**：把三段代码平铺在顶层，而不是放进分支函数。
5. **B 键冲突**：某个游戏内部也用 B，回菜单会抢事件；`06-legend-collection` 用「长按 B 1.2 秒」解决了这个问题。

---

## 8. 相关文档

- `doc/06-屏幕绘图与坐标.md` —— `onShade` 的完整原理与回归数据
- `doc/08-状态机与存档.md` —— settings / reset / 菜单的入门章节
- `doc/硬件介绍.md` —— 为什么「加载好多 ROM」做不到，而「一个程序里装好多游戏」做得到
