# 09 · 静态 Python 特别注意事项（最重要的一章）

> ⚠️ **MakeCode Arcade 里的 Python 不是 MicroPython，也不是 CircuitPython。**
> 它是「静态 Python」：先被**转译成 TypeScript**，再和 TS 一样编译成 STM32F401 本机码。
> 所以这台机器上能写什么，取决于转译器支持什么 —— 下面每一条都是本仓库实测过的。

---

## 9.1 不能做的事（硬性限制）

| 不能 | 说明 / 替代 |
| --- | --- |
| `import random` 等任何 `import` | 随机数直接用内置 `randint(a, b)` |
| `lambda` | 回调必须写成具名 `def`，再把函数名传进去 |
| 列表推导式 / 切片 `a[1:]` | 用 `for` / `while` 循环 |
| `pop(0)` | 用 `remove_at(0)`（`pop()` 不带参数可用） |
| `//` 整除 | 用 `Math.floor(a / b)` |
| 第三方库、文件读写、网络 | 硬件没有文件系统/网络 |
| 动态类型 | `n = 0` 之后不能 `n = "abc"` |
| 中文界面 | 默认无中文字库，用英文 |
| f-string | 用 `"..." + str(x)` |

> 报错形如 `TS9514: module 'X' has no attribute 'y'`、`TS9574: lambda expressions are not supported yet`，都是转译阶段报的 —— 说明它真的变成了 TypeScript。

---

## 9.2 空数组必须写类型标注

```python
bx = []                      # ❌ 转译后是 any[]，编译报 implicitly has type 'any[]'
bx: List[number] = []        # ✅
names: List[string] = []     # ✅ 文字数组
```

有初始元素时可以省略（编译器能推断）：

```python
xs = [10, 9, 8]             # ✅ 自动推断为 number[]
MAP = ["....", ".BB."]      # ✅ 自动推断为 string[]
```

---

## 9.3 `global` / `nonlocal`：最容易让程序「看起来没反应」的坑

Python 默认规则：**在函数里给一个名字赋值 = 新建局部变量**，哪怕外面有同名变量。

```python
count = 0

def on_a():
    global count      # ✅ 不写这行，改的是临时变量，屏幕上的数字永远不动
    count = count + 1
```

| 情况 | 写法 |
| --- | --- |
| 改**模块级**变量（写在文件最外层） | `global a, b, c` |
| 改**外层函数**的变量（嵌套函数里） | `nonlocal a, b, c` |
| **只读**不改 | 什么都不用写 |
| 改容器里的元素 `xs[i] = 5` / `xs.append(v)` | 什么都不用写（没给 `xs` 本身重新赋值） |

### 两个绕开 `global` 的常用写法

**① 单元素列表**（`05-toolbox/main.py` 用这个）

```python
running = [False]
n = [0]

def toggle():
    running[0] = not running[0]     # 改元素，不需要 global

def roll():
    n[0] = randint(1, 6)
```

**② 嵌套函数 + `nonlocal`**（`06-legend-collection/main.py` 用这个）

```python
def snake_start():
    score = 0
    def tick():
        nonlocal score
        score = score + 1
    game.on_update(tick)
```

### 绘制函数最好「只读」

```python
elapsed_ms = 0

def draw():
    cur = elapsed_ms             # ✅ 用局部变量，别在函数里给 elapsed_ms 赋值
    if running:
        cur = game.runtime() - start_ms
    screen.print_center(str(Math.floor(cur / 1000)) + " s", 52, 7)
```

静态 Python 里，只要函数体内**任何地方**给某个名字赋过值，这个名字在整个函数里都被当成局部的；早期版本这里会读到未初始化的值。用局部 `cur` 最干净。

---

## 9.4 API 命名：驼峰 → 下划线，枚举大小写不统一

| TypeScript | 静态 Python |
| --- | --- |
| `sprites.create` | `sprites.create` |
| `setStayInScreen` | `set_stay_in_screen` |
| `createProjectileFromSide` | `create_projectile_from_side` |
| `createProjectileFromSprite` | `create_projectile_from_sprite` |
| `allOfKind` | `all_of_kind` |
| `onOverlap` | `on_overlap` |
| `setBackgroundColor` | `set_background_color` |
| `setScore` / `changeScoreBy` | `set_score` / `change_score_by` |
| `onUpdate` / `onShade` / `onUpdateInterval` | `on_update` / `on_shade` / `on_update_interval` |
| `onEvent` | `on_event` |
| `isPressed` | `is_pressed` |
| `readNumber` / `writeNumber` | `read_number` / `write_number` |
| `printCenter` / `fillRect` / `setPixel` | `print_center` / `fill_rect` / `set_pixel` |
| `Math.randomRange(a, b)` | `randint(a, b)` |
| `Math.floor(x)` | `Math.floor(x)`（相同） |
| `game.runtime()` | `game.runtime()`（相同） |

### ⚠️ 枚举的大小写三种风格并存（记这一张表就够）

| 类型 | TypeScript | 静态 Python |
| --- | --- | --- |
| 精灵类别 | `SpriteKind.Player` | `SpriteKind.player` ← **小写** |
| | `SpriteKind.Food / Enemy / Projectile` | `.food / .enemy / .projectile` |
| 按键事件 | `ControllerButtonEvent.Pressed` | `ControllerButtonEvent.PRESSED` ← **全大写** |
| 精灵标志 | `SpriteFlag.Invisible` | `SpriteFlag.INVISIBLE` ← **全大写** |
| 播放模式 | `music.PlaybackMode.InBackground` | `music.PlaybackMode.IN_BACKGROUND` ← **全大写** |
| 布尔 | `true` / `false` | `True` / `False` ← **首字母大写** |

写错会报 `module 'X' has no attribute 'y'`。

### 其它细节

| TS | Python |
| --- | --- |
| ``img`...` `` | `img("""...""")` |
| `"" + n`（数字转文字） | `str(n)` |
| `function () {}` 直接塞参数里 | 先 `def on_a():` 再传 `on_a` |
| `let x = 0` | `x = 0` |
| `controller.A.onEvent(...)` | `controller.A.on_event(...)` |
| `music.baDing.play()` | `music.ba_ding.play()` |

### 变量名避开保留名

**不要用 `player`**（会和系统预设名冲突，报错信息往往不直观）。本仓库用 `hero` / `ship` / `bird`。
`player2`、`controller` 之类也尽量避开。

---

## 9.5 `pxt.json` 必须有 `preferredEditor`

```json
{
  "name": "py-dice",
  "preferredEditor": "pyprj",     ← 缺了这行就出大事
  "files": ["main.py"],
  "supportedTargets": ["arcade"],
  "dependencies": { "device": "*" }
}
```

**缺了它的后果**（本仓库真实踩过）：
`mkc build` 会**静默忽略 `main.py`、编出一个空壳固件，却照样打印 Build OK**。三个 Python 固件的体积一模一样（267.8 KiB），里面连 `STOPWATCH` 字符串都搜不到，真机全黑。
判断方法：编译后看 UF2 里有没有你的英文提示文字，或比较体积是否异常一致。

`tools/build-lang.sh ... py` 会自动生成正确的 `pxt.json`，不用手记。

---

## 9.6 为什么 Python 版要两步编译

```
main.py ──mkc build -j──▶ built/main.ts ──mkc build──▶ binary.uf2
         （静态 Python → TypeScript）   （TS → STM32F401 本机码）
```

- `mkc build` **直接编 `pyprj` 项目会报 `Exception: Error: no magic`**（mkc 的已知限制）。
- `mkc build -j` 只做转译 + 生成 JS 模拟器版，产出 `built/main.ts` 和 `built/binary.js`。
- 把 `built/main.ts` 放进一个干净的 TS 工程（`pxt.json` 的 `files: ["main.ts"]`，**不要** `preferredEditor`），再 `mkc build`，才得到 F4 固件。

```bash
bash tools/build-lang.sh py-02-dice py firmware/07-py-dice.uf2
```

脚本已完成全部步骤并校验 UF2 魔数与 family ID `0x57755A57`。

---

## 9.7 绘制回调必须 `on_shade`

```python
def draw():
    screen.fill(15)
    screen.print_center("HELLO", 40, 5)

game.on_shade(draw)      # ✅ 渲染之后画，不会被清屏擦掉
# game.on_update(draw)   # ❌ 全黑屏
```

原理见 [第 6 章](06-屏幕绘图与坐标.md)。这是本仓库三个固件真机黑屏的根因之一。

---

## 9.8 完整最小例子（可直接编译刷入）

```python
# main.py
n = 0

def on_a():
    global n
    n = n + 1
    music.ba_ding.play()

def draw():
    screen.fill(15)
    screen.print_center("PYTHON WORKS", 24, 5)
    screen.print_center("A = " + str(n), 52, 2)
    screen.print_center("B = RESET", 92, 1)

def on_b():
    global n
    n = 0

controller.A.on_event(ControllerButtonEvent.PRESSED, on_a)
controller.B.on_event(ControllerButtonEvent.PRESSED, on_b)
game.on_shade(draw)
```

把这段存成某个项目的 `main.py`，用 `bash tools/build-lang.sh <项目名> py` 编译即可。
这一小段同时覆盖了：`global`、具名回调、`on_event`、`on_shade`、`str()`、`PRESSED`、`music.ba_ding`。

---

## 9.9 交付前检查清单（吃过亏之后总结的）

1. `pxt.json` 有 `"preferredEditor": "pyprj"`；
2. `mkc.json` 有 `"hwVariant": "stm32f401"`；
3. 所有 `screen.xxx` 都在 `on_shade` 里；
4. 每个赋值的外层变量都写了 `global` / `nonlocal`；
5. 空数组写了 `List[number]` 标注；
6. 编译后**检查 UF2 里能搜到源码中的英文字符串**（防止空壳）；
7. 校验 UF2 魔数 `0x0A324655` + family `0x57755A57`；
8. 真机或模拟器确认**画面不是纯黑**。

---

上一章：[08 状态机与存档](08-状态机与存档.md) · 下一章：[10 TS ↔ Python 语法速查表](10-TS与Python语法速查表.md)
