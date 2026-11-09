# 05 · 工具箱（Tool Box）

> 计算器、秒表、电子骰子、手电筒、反应速度测试 —— **5 个不是游戏的程序**装在一个 UF2 里。
> 这个项目回答：「这台机器除了游戏，能不能跑普通应用？」
> 对应固件：`firmware/05-toolbox.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | TypeScript 版：菜单 + 5 个工具（当前编译入口） |
| `main.py` | Python 版，结构相同；状态用单元素列表保存，方便讲闭包 |
| `pxt.json` / `mkc.json` | 项目清单 / F4 编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（5 分钟）

↑↓ 选工具、A 打开、B 回菜单。逐个玩一遍，问孩子：「这 5 个里，哪个最不像游戏？程序凭什么算『应用』？」
引出结论：**只要有输入（按键）→ 处理（计算）→ 输出（画面），就是程序**；有没有输赢根本不重要。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：菜单骨架直接复用 04

```ts
const MENU = 0
const TOOLS = ["CALCULATOR", "STOPWATCH", "DICE", "TORCH", "REACTION"]
let selected = settings.readNumber("t") || 0
if (selected !== 0) settings.writeNumber("t", 0)
let cursor = 1

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    settings.writeNumber("t", MENU)
    game.reset()
})
```

**为什么**：和 04 一模一样的 `settings + reset` 套路，只是键名从 `"g"` 换成 `"t"`、菜单项从 3 个变 5 个。
菜单文字不写死 5 行，而是用**数组 + 循环**生成，这是本课第一个新东西：

```ts
game.onShade(function () {
    screen.fill(15)
    screen.printCenter("TOOL BOX", 4, 5)
    for (let i = 0; i < 5; i++) {
        screen.printCenter((i + 1) + " " + TOOLS[i], 24 + i * 18, cursor === i + 1 ? 5 : 1)
    }
})
```

`TOOLS[i]` 是「数组第 i 个」，加一个工具只要往数组里加一个名字、再补一个分支。

### 第 2 步：计算器 —— 四则运算 + 状态

```ts
function startCalculator() {
    let a = 1, b = 1, op = 0
    const syms = ["+", "-", "*", "/"]
    controller.up.onEvent(..., function () { a = a + 1 })
    controller.down.onEvent(..., function () { a = a - 1 })
    controller.right.onEvent(..., function () { b = b + 1 })
    controller.left.onEvent(..., function () { b = b - 1 })
    controller.A.onEvent(..., function () { op = (op + 1) % 4 })
    game.onShade(function () {
        let r = 0
        if (op === 0) r = a + b
        else if (op === 1) r = a - b
        else if (op === 2) r = a * b
        else r = Math.floor(a / b)
        // ...画出来
    })
}
```

**为什么**：
- `% 4` 是**取余**，让 `op` 在 0→1→2→3→0 之间循环，不用写「如果到 4 就变回 0」。
- 除法用 `Math.floor` 取整，屏幕小，显示小数反而看不清。
- `a`、`b`、`op` 是**状态**：按键改状态，绘制读状态。这就是所有应用的核心结构。

### 第 3 步：秒表 —— 时间差

```ts
let running = false, startMs = 0, elapsed = 0
controller.A.onEvent(..., function () {
    if (running) {
        elapsed = game.runtime() - startMs
        running = false
    } else {
        startMs = game.runtime() - elapsed   // 继续计时，不清零
        running = true
    }
})
game.onShade(function () {
    if (running) elapsed = game.runtime() - startMs
    screen.printCenter(Math.floor(elapsed / 1000) + " s", 52, 7)
})
```

**为什么**：`game.runtime()` 返回开机到现在的毫秒数，它不是「秒表」，只是**一个一直在走的钟**。
秒表 = 记下开始时刻，然后每帧算「现在 − 开始」。暂停时把差值存进 `elapsed`，重新开始时把 `startMs` 往回拨，所以能续上。
这个「绝对时间 → 相对时间」的转换，是编程里非常通用的一个模式。

### 第 4 步：骰子 —— 随机数

```ts
controller.A.onEvent(..., function () { n = Math.randomRange(1, 6) })
```

**为什么**：整个工具只有一行逻辑。很适合让孩子自己从零写出来，或者改成「抽签器」（把 `1..6` 换成同学名字数组）。

### 第 5 步：手电筒 —— 全屏填色

```ts
game.onShade(function () {
    if (level === 0) screen.fill(1)
    else if (level === 1) screen.fill(2)
    else screen.fill(15)
})
```

**为什么**：屏幕本身就是输出设备，`fill` 一个颜色就是最朴素的「手电筒」。这里是讲**16 色调色板编号**的最佳时机（0~15，每个数字一种颜色）。

### 第 6 步：反应测试 —— 状态机

```ts
let state = 0   // 0 待开始 / 1 随机等待 / 2 变绿计时 / 3 显示结果
controller.A.onEvent(..., function () {
    if (state === 0) { state = 1; waitUntil = game.runtime() + Math.randomRange(1000, 4000) }
    else if (state === 2) { result = game.runtime() - t0; state = 3 }
    else if (state === 3) state = 0
})
```

**为什么**：一个变量 `state` 记录「现在处于哪一步」，不同状态下**同一个 A 键含义完全不同**。
随机等待 1~4 秒是为了防止「抢按」。这套「状态 + 事件」的写法，就是所有互动程序的通用骨架。

> 完整代码见 `main.ts` / `main.py`。注意所有绘制都在 `game.onShade` / `game.on_shade`。

---

## 3. 给孩子讲的教案（30～45 分钟）

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **状态** | 黑板上的记分，按一次键就擦掉重写 | `a` / `op` / `state` |
| **状态机** | 红绿灯：同样是「按按钮」，在不同灯下意义不同 | `state = 0/1/2/3` |
| **时间差** | 手表只能告诉你现在几点；秒表要记「起跑那一刻」 | `game.runtime() - startMs` |

### 互动提问

1. 「计算器的 `+` 号是按 A 才变，还是每帧都在变？」→ 只在按键事件里变，绘制只负责显示。
2. 「秒表暂停后再开始，为什么能接着走？」→ `startMs = now - elapsed`。
3. 「反应测试为什么要随机等 1~4 秒？」→ 不然可以数拍子抢按。
4. 「`% 4` 是什么？」→ 除以 4 的余数，用来做「转圈圈」。

### 动手任务

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 骰子改成 20 面 | `randomRange(1, 6)` → `(1, 20)` | 桌游 D20 |
| 2 | 计算器加一个 `a × 10` 键 | 给 `controller.B` 加事件（注意 B 已用于回菜单，先讨论冲突） | 引出按键冲突 |
| 3 | 手电筒加第 4 种颜色 | `level % 3` → `% 4`，补一个 `else if` | 多一种光 |
| 4 | 秒表显示毫秒 | 去掉 `/ 1000` 和 `Math.floor` | 数字飞快跳动 |
| 5 | 反应测试显示「太快了！」 | `state === 1` 时按 A 加一个提示 | 学会处理「抢跑」 |
| 6 | 新增第 6 个工具：随机点名 | 往 `TOOLS` 加名字、写 `startPick()`、补一个分支 | 完整走一遍架构 |

### 讲完的延伸

把「计算器」升级成真正能输入数字的版本需要**多位数输入**（`a = a * 10 + digit`），但按键不够用。正好讨论「硬件限制会反过来决定软件设计」——这台机器只有 6 个键。

---

## 4. 可以改的地方

| 想改什么 | 位置（TS / Python 同理） |
| --- | --- |
| 菜单项 | `TOOLS` 数组、`cursor === 1 ? 5 : ...`、末尾分支 |
| 计算器运算符 | `syms` 数组、`op = (op+1) % 4`、绘制里的 4 个分支 |
| 秒表单位 | `Math.floor(elapsed / 1000)` |
| 骰子面数 | `Math.randomRange(1, 6)` / `randint(1, 6)` |
| 手电筒颜色 | `screen.fill(1 / 2 / 15)` 的调色板编号 |
| 反应等待区间 | `Math.randomRange(1000, 4000)` |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript | 静态 Python |
| --- | --- | --- |
| 数组 | `const TOOLS = [...]` | `TOOLS = [...]` |
| 循环 | `for (let i = 0; i < 5; i++)` | `while i < 5: ... i = i + 1`（`for i in range(5)` 也行） |
| 取余 | `%` | `%`（相同） |
| 布尔 | `true` / `false` | `True` / `False` |
| 闭包里改状态 | 直接 `a = a + 1` | 要么写 `nonlocal a`，要么像本项目用**单元素列表** `a[0] = a[0] + 1` |
| 取整 | `Math.floor(a / b)` | `Math.floor(a / b)`（相同） |
| 绘制回调 | `game.onShade(function(){...})` | 具名函数 + `game.on_shade(draw)` |

> **为什么 Python 版用 `a = [1]` 这种写法**：静态 Python 里，嵌套函数给外层变量赋值要写 `nonlocal`，变量一多就很啰嗦。把状态放进「单元素列表」，改的是列表里的元素，不需要 `nonlocal`。这也是让孩子理解「容器」和「变量」区别的好例子。

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 05-toolbox ts firmware/05-toolbox.uf2
bash tools/build-lang.sh 05-toolbox py firmware/05-toolbox-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 5`。

---

## 7. 常见坑

1. **全黑屏**：绘制放 `onUpdate` 被引擎清屏擦掉 → 必须 `onShade` / `on_shade`。
2. **中文乱码**：默认字库只有 ASCII，界面文字用英文。
3. **按键冲突**：`B` 已全局绑定「回菜单」，工具内部再用 B 会抢事件；`06` 用长按方案规避。
4. **秒表暂停后跳数**：`startMs` 记得减掉 `elapsed`。
5. **反应测试能抢按**：`state === 1` 时按 A 不做任何处理即可。
6. **除零**：计算器里 `b` 一直按左会减到 0；本例用 `Math.floor(a/0)` 得到很大数但不崩，正式项目应加判断。

---

## 8. 相关文档与可做的应用

- `doc/硬件介绍.md` —— 这台机器还能跑什么：口算练习、番茄钟、计分板、节拍器、像素画板、电子宠物…
- `doc/06-屏幕绘图与坐标.md` —— `screen.fill / print_center / fill_rect` 与 16 色调色板
- `doc/08-状态机与存档.md` —— `settings` / `game.reset()` 的入门章节
