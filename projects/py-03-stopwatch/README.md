# py-03 · 秒表（Python 版状态与绘制入门）

> A 开始 / 暂停，B 清零，屏幕实时显示秒数。整个仓库**最小的「每帧都在画」的程序**，用来讲三件事：布尔开关、时间差、`on_shade` 绘制回调。
> 对应固件：`firmware/08-py-stopwatch.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.py` | **Python 版**，当前 `pxt.json` 编译入口 |
| `main.ts` | **TypeScript 版**，等价实现 |
| `pxt.json` | 含 `"preferredEditor": "pyprj"`（**不能删**） |
| `mkc.json` | F4 硬件编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（3 分钟）

按 A 开始，看数字涨；再按 A 停住；第三次按 A 会**接着走**（不是重新计时）；按 B 清零。
问孩子：「暂停的时候，电脑里的『钟』停了吗？」——答案是没有，`game.runtime()` 一直走，停的只是我们「算不算」。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：三个变量描述「秒表现在是什么状态」

```python
running = False   # 正在计时吗？
start_ms = 0      # 这一段的起点（毫秒）
elapsed_ms = 0    # 已经累计了多久
```

**为什么**：一个秒表只需要这三个数。`running` 是**布尔开关**（只有开/关两种状态），另外两个是时间。
让孩子先说出「需要记住哪几件事」，再写变量，比直接给代码更能建立「状态」的概念。

### 第 2 步：A 键切换开关

```python
def toggle():
    global running, start_ms, elapsed_ms
    if running:
        elapsed_ms = game.runtime() - start_ms
        running = False
    else:
        start_ms = game.runtime() - elapsed_ms
        running = True
```

**为什么**：
- `global` 是 Python 特有的一行：函数里给模块级变量**赋值**时，默认会被当成「新建一个局部变量」。不写 `global`，外面的 `running` 永远不变，秒表就坏了。
- 暂停时把差值存进 `elapsed_ms`；重新开始时 `start_ms = 现在 − 已累计`，这样「现在 − start_ms」刚好等于之前的累计值，所以能**续上**而不是归零。
- `game.runtime()` 是开机到现在的毫秒数，它只会一直变大，我们没法把它停掉。

TS 版不需要 `global`，直接 `running = false`，但要用 `let`（不能用 `const`）。

### 第 3 步：B 键清零

```python
def reset():
    global running, start_ms, elapsed_ms
    running = False
    start_ms = game.runtime()
    elapsed_ms = 0
```

### 第 4 步：绘制 —— 注意是 `on_shade` 不是 `on_update`（全课最关键）

```python
def draw():
    screen.fill(15)
    screen.print_center("STOPWATCH", 16, 5)
    cur = elapsed_ms
    if running:
        cur = game.runtime() - start_ms
    secs = Math.floor(cur / 1000)
    screen.print_center(str(secs) + " s", 52, 7)
    screen.print_center("A:START/STOP B:RESET", 92, 1)

game.on_shade(draw)
```

**为什么必须是 `on_shade`**：引擎每帧顺序是

```
on_update（逻辑）→ scene.render() → background.draw() 全屏清屏 → 精灵 → on_shade → 送屏
```

把 `screen.fill()` / `print_center()` 写在 `on_update` 里，画完立刻被 `background.draw()` 擦掉，真机就是**纯黑屏**。
> 本仓库三个固件曾因此全黑，完整复盘在 `doc/06-屏幕绘图与坐标.md`。TS 版写 `game.onShade(function(){...})`。

**另一个细节**：`draw()` 里用局部变量 `cur`，**没有**给 `elapsed_ms` 赋值。
静态 Python 里，只要在函数里给某个名字赋值，编译器就把整个函数里这个名字都当成局部的 —— 早期版本这里写成直接改 `elapsed_ms` 会导致读未初始化的值。用局部 `cur` 最干净，也顺便教「只读 vs 修改」。

### 第 5 步：绑定按键

```python
controller.A.on_event(ControllerButtonEvent.PRESSED, toggle)
controller.B.on_event(ControllerButtonEvent.PRESSED, reset)
```

> 完整代码见 `main.py`（约 30 行）/ `main.ts`（约 30 行）。

---

## 3. 给孩子讲的教案（25～35 分钟）

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **布尔开关** | 电灯开关，只有开 / 关 | `running = True / False` |
| **时间差** | 手表显示「现在几点」，秒表记「起跑那刻几点」 | `game.runtime() - start_ms` |
| **每帧重画** | 动画书每页都重画一遍，翻快了就像在动 | `game.on_shade(draw)` |

### 互动提问

1. 「暂停时 `game.runtime()` 停了吗？」→ 没有，只是我们不去看它了。
2. 「重新开始时为什么要 `减去 elapsed_ms`？」→ 让「现在 − 起点」刚好等于之前累计的时间。
3. 「`global` 去掉会怎样？」→ 改的是函数里的临时变量，秒表永远不动。
4. 「为什么 `draw()` 里不直接改 `elapsed_ms`？」→ 绘制函数最好只读不算，逻辑放事件里，程序更好懂。
5. 「把 `on_shade` 改成 `on_update` 会怎样？」→ **全黑屏**（可以真的改一次给他们看）。

### 动手任务

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 显示毫秒 | 去掉 `/ 1000` 和 `Math.floor` | 数字飞快跳 |
| 2 | 改成「倒计时 10 秒」 | `secs = 10 - Math.floor(cur/1000)` | 从 10 减到 0 |
| 3 | 加一行提示文字 | 多加一个 `screen.print_center(..., 72, ...)` | 练习坐标 y |
| 4 | 换配色 | `fill(15)` → `fill(8)`、颜色编号换掉 | 蓝底秒表 |
| 5 | 到 10 秒响一声 | `if secs >= 10: music.ba_ding.play()`（注意会每帧响，讨论怎么只响一次） | 引出「边沿触发」 |
| 6 | 用 `on_shade` 画一个进度条 | `screen.fill_rect(0, 90, secs * 10, 4, 5)` | 练习画矩形 |

### 讲完的延伸

把 `05-toolbox` 里的秒表打开对照：那边用**单元素列表** `running = [False]` 保存状态，就不需要 `global` 了。两种写法各有好处，可以让孩子自己选喜欢的。

---

## 4. 可以改的地方

| 参数 | `main.py` | `main.ts` | 说明 |
| --- | --- | --- | --- |
| 时间单位 | `Math.floor(cur / 1000)` | 同 | 改成 `/ 60000` 就是分钟 |
| 背景色 | `screen.fill(15)` | 同 | 调色板编号 0~15 |
| 文字 y 坐标 | `16 / 52 / 92` | 同 | 屏幕高 120，别超过 |
| 清零键 | `controller.B` | 同 | 可换成 ↑ |

---

## 5. TS ↔ Python 对照表

| 作用 | `main.ts` | `main.py` |
| --- | --- | --- |
| 可变变量 | `let running = false` | `running = False` |
| 函数内改外层变量 | 直接赋值 | 必须 `global running, start_ms, elapsed_ms` |
| 布尔 | `true` / `false` | `True` / `False` |
| 开机时间 | `game.runtime()` | `game.runtime()`（相同） |
| 取整 | `Math.floor(x)` | `Math.floor(x)`（相同） |
| 清屏 / 写字 | `screen.fill(15)` / `printCenter` | `screen.fill(15)` / `print_center` |
| 渲染后回调 | `game.onShade(function(){...})` | `def draw():` + `game.on_shade(draw)` |
| 按键事件 | `onEvent(ControllerButtonEvent.Pressed, fn)` | `on_event(ControllerButtonEvent.PRESSED, fn)` |

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh py-03-stopwatch py firmware/08-py-stopwatch.uf2
bash tools/build-lang.sh py-03-stopwatch ts firmware/08-py-stopwatch-ts.uf2
```

按复位键 → 拖 UF2 进 `ARCADE-F4` 盘，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 8`。

---

## 7. 常见坑

1. **黑屏**：绘制写在 `on_update`；一律用 `on_shade` / `onShade`。
2. **秒表不动**：函数里漏 `global`。
3. **重新开始归零**：`start_ms` 忘了减 `elapsed_ms`。
4. **Python 项目编出空壳**：`pxt.json` 缺 `preferredEditor: "pyprj"`。
5. **中文乱码**：默认无中文字库。
6. **每帧都响音效**：判断条件要配合状态变量（如 `if secs>=10 and not beeped`），否则一秒响 30 次。

---

## 8. 相关文档

- `doc/06-屏幕绘图与坐标.md` —— `onShade` 与清屏顺序（本项目曾因放错回调黑屏）
- `doc/09-Python特别注意事项.md` —— `global` / 静态 Python 限制
- `doc/10-TS与Python语法速查表.md`
