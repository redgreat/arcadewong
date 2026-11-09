# py-02 · 电子骰子（最小的完整 Python 程序）

> 按 A 掷一个骰子，按 B 连掷两次。全项目 **不到 20 行**，是整个仓库最适合「第一次自己从头敲一遍」的例子。
> 对应固件：`firmware/07-py-dice.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.py` | **Python 版**，当前 `pxt.json` 的编译入口 |
| `main.ts` | **TypeScript 版**，等价实现 |
| `pxt.json` | 含 `"preferredEditor": "pyprj"`（**不能删**） |
| `mkc.json` | F4 硬件编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（3 分钟）

按 A → 显示 `YOU ROLLED` 和一个 1~6 的数字；按 B → 依次显示两次结果；再按任意键继续。
问孩子：「按 10 次 A，数字会一样吗？电脑是怎么『掷』的？」——引出**随机数**。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：一个常量，说明骰子有几面

```python
SIDES = 6
```

**为什么**：把 6 提出来命名，以后改成 20 面骰（桌游 D20）只改一处。这是「给数字起名字」的最早一课。

### 第 2 步：写一个函数，做「掷一次 + 显示」

```python
def roll():
    n = randint(1, SIDES)
    game.splash("YOU ROLLED", str(n))
```

**为什么**：
- `randint(1, 6)` 是 MakeCode Python 内置的随机整数（**不要写 `import random`** —— 静态 Python 不支持 import）。
- `game.splash(标题, 内容)` 会暂停游戏、弹出一屏文字、等按键才继续，是最省事的输出方式。
- `str(n)` 把数字转成文字：屏幕只认字符串，`"YOU ROLLED " + 3` 会报错。

TS 版对应：`Math.randomRange(1, SIDES)` + `game.splash("YOU ROLLED", "" + n)`。

### 第 3 步：写第二个函数，演示「同一个函数可以调很多次」

```python
def roll_again():
    game.splash("FIRST", str(randint(1, SIDES)))
    game.splash("SECOND", str(randint(1, SIDES)))
```

**为什么**：这里故意**不**复用 `roll()`，而是把同一个表达式写两遍。讲的时候可以让孩子改成调用两次 `roll()`，对比「重复代码」和「复用」的区别 —— 这是引出『函数』价值的最好时机。

### 第 4 步：把函数挂到按键上

```python
controller.A.on_event(ControllerButtonEvent.PRESSED, roll)
controller.B.on_event(ControllerButtonEvent.PRESSED, roll_again)
```

**为什么**：
- `on_event(..., roll)` 传的是**函数名**，不带括号。带括号就变成「开机时立刻掷一次」，之后按键没反应。
- `ControllerButtonEvent.PRESSED` 全大写；TS 里是 `ControllerButtonEvent.Pressed`。
- 这两个注册语句是**事件驱动**的最小范例：程序没有主循环，全靠「按键 → 做事」。

### 第 5 步：开场提示

```python
scene.set_background_color(11)
game.splash("A: ROLL  B: TWO DICE")
```

**为什么**：设备没有说明书，程序自己要告诉用户按哪个键。11 是调色板里的浅蓝色。

> 完整代码就是 `main.py` 的 18 行 / `main.ts` 的 20 行。**建议让孩子照着敲一遍**，而不是改现成代码。

---

## 3. 给孩子讲的教案（20～30 分钟）

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **随机数** | 摇号机 / 抽签筒 | `randint(1, 6)` |
| **函数** | 把一套动作写成一张「操作卡」，要用时念卡名 | `def roll():` |
| **事件绑定** | 给门铃接上电线，按下去才会响 | `on_event(..., roll)` |

### 互动提问

1. 「`randint(1, 6)` 会不会掷出 7？」→ 不会，两端都包含，范围是 1~6。
2. 「为什么写 `roll` 不写 `roll()`？」→ 见第 4 步，这是全课最重要的一个点，可以让孩子两种都试。
3. 「`str(n)` 去掉会怎样？」→ 编译报错：数字不能直接和文字拼接。
4. 「按 B 显示的两个数字，有可能是同一个吗？」→ 有可能，随机不保证不同。

### 动手任务

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 改成 20 面骰 | `SIDES = 20` | 掷出大数字 |
| 2 | 改成掷硬币 | `randint(1, 2)` + 显示 `"HEADS"/"TAILS"` | 学到条件判断 |
| 3 | 一次掷 3 个 | 在 `roll_again()` 里加第三行 | 重复调用 |
| 4 | 换背景色 | `set_background_color(11)` → `2` | 红色背景 |
| 5 | 用 `if` 判断大小 | `if n >= 5: game.splash("BIG!")` | 引入分支 |
| 6 | **课堂抽签器** | 把数字换成同学名字数组，用 `names[randint(0, len(names)-1)]` | 变成真实可用的工具 |

### 讲完的延伸

把 `roll_again()` 改成「连续掷到 6 为止，统计掷了几次」，就自然引出 `while` 循环和计数变量 —— 是接 `doc/03-判断与循环.md` 的好跳板。

---

## 4. 可以随便改的旋钮

| 参数 | `main.py` | `main.ts` | 说明 |
| --- | --- | --- | --- |
| `SIDES` | 第 4 行 | 第 4 行 | 骰子面数 |
| 背景色 `11` | 最后一行 | 最后一行 | 16 色调色板编号 0~15 |

---

## 5. TS ↔ Python 对照表

| 作用 | `main.ts` | `main.py` |
| --- | --- | --- |
| 常量 | `const SIDES = 6` | `SIDES = 6` |
| 函数 | `function roll() { ... }` | `def roll():` + 缩进 |
| 随机数 | `Math.randomRange(1, SIDES)` | `randint(1, SIDES)` |
| 数字转文字 | `"" + n` | `str(n)` |
| 弹窗 | `game.splash(a, b)` | `game.splash(a, b)`（相同） |
| 按键事件 | `onEvent(ControllerButtonEvent.Pressed, roll)` | `on_event(ControllerButtonEvent.PRESSED, roll)` |
| 背景 | `scene.setBackgroundColor(11)` | `scene.set_background_color(11)` |

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh py-02-dice py firmware/07-py-dice.uf2
bash tools/build-lang.sh py-02-dice ts firmware/07-py-dice-ts.uf2
```

按复位键 → 拖 UF2 进 `ARCADE-F4` 盘，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 7`。

---

## 7. 常见坑

1. **`preferredEditor` 缺失** → 编出空壳固件、真机黑屏。
2. **写 `import random`** → 静态 Python 不支持 import，随机数直接用内置 `randint()`。
3. **回调写成 `roll()`** → 开机弹一次，之后按键无效。
4. **中文提示乱码** → 默认只有 ASCII 字库。
5. **`game.splash` 会阻塞** → 它等按键才继续，别放在需要持续运行的循环里。

---

## 8. 相关文档

- `doc/02-变量与数字.md`、`doc/04-函数与事件.md`、`doc/09-Python特别注意事项.md`
- `doc/10-TS与Python语法速查表.md`
