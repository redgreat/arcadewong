# py-01 · 接星星（Python 入门第一例）

> 和 `01-catch-the-pizza` 同一个玩法，但**主程序是 Python**。这个项目是「从 TS 切到 Python」的对照起点：同样的精灵、同样的碰撞、同样的计分，只是名字全换成下划线。
> 对应固件：`firmware/06-py-catch-star.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.py` | **Python 版**，也是当前 `pxt.json` 指向的编译入口 |
| `main.ts` | **TypeScript 版**，与 `main.py` 完全等价，用来逐行对照 |
| `pxt.json` | 项目清单：`"files": ["main.py"]` + **`"preferredEditor": "pyprj"`** |
| `mkc.json` | F4 硬件编译设置 |
| `README.md` | 本文件 |

⚠️ `preferredEditor: "pyprj"` 这一行**绝不能删**：缺了它，命令行编译会静默忽略 `main.py`、编出一个「空壳固件」（照样报 Build OK），真机就是黑屏。本仓库踩过这个坑，见 `doc/06-屏幕绘图与坐标.md`。

---

## 1. 先玩，再讲（5 分钟）

左右移动接住掉下来的星星，接到 +1 分，漏掉 −1 命。
讲这一课时，把 `main.ts` 和 `main.py` **并排打开**，让孩子自己找不同 —— 比直接讲语法有效得多。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：先写旋钮（和 TS 版唯一的区别是少了 `const`）

```python
PLAYER_SPEED = 110
FALL_SPEED = 70
SPAWN_MS = 800
START_LIVES = 3
```

**为什么**：MakeCode 的 Python 是**静态 Python**，变量第一次赋值时就定了类型，后面不能改类型。所以不写 `const`，但行为上这些值我们当成常量用（全大写是约定）。

### 第 2 步：造精灵

```python
hero = sprites.create(img("""
. . . . . . . .
. . 4 4 4 4 . .
. 4 4 4 4 4 4 .
. . f f f f . .
"""), SpriteKind.player)
hero.y = 108
hero.set_stay_in_screen(True)
controller.move_sprite(hero, PLAYER_SPEED, 0)
```

**三个和 TS 不一样的地方，正好是本课重点**：

| 差异 | TS | Python |
| --- | --- | --- |
| 像素画 | ``img`...` ``（反引号） | `img("""...""")`（三引号字符串） |
| 方法名 | 驼峰 `setStayInScreen` | 下划线 `set_stay_in_screen` |
| 枚举 | `SpriteKind.Player` | `SpriteKind.player`（小写） |
| 布尔 | `true` | **`True`**（大写） |

> 变量名不要用 `player`！MakeCode 的 Python 里 `player` 和系统预设名冲突，会导致编译报错。本项目用 `hero`。

### 第 3 步：初始化

```python
scene.set_background_color(9)
info.set_score(0)
info.set_life(START_LIVES)
game.splash("CATCH THE STARS!")
```

**为什么**：界面文字用英文 —— 这台机器默认字库只有 ASCII，中文会显示成方块。

### 第 4 步：把「每 800 毫秒掉一颗」写成一个**有名字的函数**

```python
def on_spawn():
    star = sprites.create_projectile_from_side(img("""..."""), 0, FALL_SPEED)
    star.x = randint(12, 148)
    star.set_kind(SpriteKind.food)

game.on_update_interval(SPAWN_MS, on_spawn)
```

**为什么**：静态 Python **不支持 `lambda`**，也不能像 TS 那样把 `function () {}` 直接塞进参数里。所以每个回调都要先 `def` 起个名字，再把**函数名**（不带括号！）传进去。
这一点反而很适合教孩子：「给一段代码起名字，然后告诉电脑『到时候去叫它』」。

> ⚠️ 写 `game.on_update_interval(SPAWN_MS, on_spawn())` 带括号是**立刻执行**，不是注册回调 —— 这是 Python 入门最经典的错。

### 第 5 步：碰撞与回收

```python
def on_catch(sprite, otherSprite):
    otherSprite.destroy()
    info.change_score_by(1)

def on_update():
    for p in sprites.all_of_kind(SpriteKind.food):
        if p.y > 128:
            p.destroy()
            info.change_life_by(-1)

sprites.on_overlap(SpriteKind.player, SpriteKind.food, on_catch)
game.on_update(on_update)
```

**为什么**：Python 用 `for ... in ...` 遍历，`if` 后面用**冒号 + 缩进**表示代码块，没有大括号。缩进就是语法，不是排版 —— 这是孩子从图形化积木转过来最需要适应的一点。

> 完整代码见 `main.py`；`main.ts` 是同一逻辑的 TS 写法，可逐行对照。

---

## 3. 给孩子讲的教案（30～40 分钟）

> 建议：先上完 `01-catch-the-pizza`，再用这一课做「第二种语言」的对照。不要同时从零教语法和游戏逻辑。

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **同一件事，两种说法** | 中文「请坐」/ 英文 "Sit down" | `setStayInScreen` ↔ `set_stay_in_screen` |
| **缩进 = 归属** | 作文里每段开头空两格，表示这段属于谁 | `def` 下面的 4 个空格 |
| **把函数当东西传** | 把写好的纸条交给老师，到点再拆 | `game.on_update_interval(800, on_spawn)` |

### 互动提问

1. 「为什么 `on_spawn` 后面不加括号？」→ 加括号是「现在就做」，不加是「记下来，到点再做」。
2. 「`True` 写成 `true` 会怎样？」→ 编译报错，Python 大小写敏感。
3. 「把 `set_kind` 写成 `setKind` 行不行？」→ 不行，Python 版 API 全是下划线。
4. 「缩进少了一格会怎样？」→ 那行就不属于这个函数了，逻辑会跑偏（或直接报错）。

### 动手任务

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 改速度 | `PLAYER_SPEED` 110 → 250 | 跑得飞快 |
| 2 | 星星变色 | 像素画里的 `5` 改成 `2` | 黄星变红星 |
| 3 | 加音效 | `on_catch` 里加 `music.ba_ding.play()` | 接到有声音 |
| 4 | 加 5 分 | `change_score_by(1)` → `(5)` | 分数跳涨 |
| 5 | 一次掉两颗 | 复制一次生成代码块到 `on_spawn()` 里 | 屏幕更忙 |
| 6 | **对照练习** | 把 `main.py` 的改动，照样改到 `main.ts` | 理解两种语法的对应 |

### 讲完的延伸

在网页版 <https://arcade.makecode.com> 右上角把语言切到 **Python**，把 `main.py` 全选粘进去，再切回 **JavaScript** —— 电脑会自动把 Python 翻成 TS。让孩子对比自动翻译结果和手写的 `main.ts`，是理解「语言只是写法」最直观的一课。

---

## 4. 可以随便改的旋钮

| 参数 | `main.py` | `main.ts` | 调大 | 调小 |
| --- | --- | --- | --- | --- |
| `PLAYER_SPEED` | 第 6 行 | 第 6 行 | 更灵活 | 迟钝 |
| `FALL_SPEED` | 第 7 行 | 第 7 行 | 变难 | 变简单 |
| `SPAWN_MS` | 第 8 行 | 第 8 行 | 出得少 | 出得密 |
| `START_LIVES` | 第 9 行 | 第 9 行 | 玩得久 | 一命挑战 |

---

## 5. TS ↔ Python 逐行对照表

| 作用 | `main.ts` | `main.py` |
| --- | --- | --- |
| 常量 | `const X = 110` | `X = 110` |
| 像素画 | ``img`...` `` | `img("""...""")` |
| 造精灵 | `sprites.create(..., SpriteKind.Player)` | `sprites.create(..., SpriteKind.player)` |
| 限制在屏内 | `.setStayInScreen(true)` | `.set_stay_in_screen(True)` |
| 方向键控制 | `controller.moveSprite(...)` | `controller.move_sprite(...)` |
| 背景色 | `scene.setBackgroundColor(9)` | `scene.set_background_color(9)` |
| 分数 | `info.setScore(0)` / `changeScoreBy(1)` | `info.set_score(0)` / `change_score_by(1)` |
| 定时生成 | `game.onUpdateInterval(800, function(){})` | `def on_spawn():` + `game.on_update_interval(800, on_spawn)` |
| 随机 | `Math.randomRange(12, 148)` | `randint(12, 148)` |
| 碰撞 | `sprites.onOverlap(..., function(a,b){})` | `def on_catch(a,b):` + `sprites.on_overlap(..., on_catch)` |
| 遍历 | `for (const p of ...)` | `for p in ...` |

---

## 6. 编译与烧录

```bash
# Python 版（pxt.json 当前指向它）
bash tools/build-lang.sh py-01-catch-star py firmware/06-py-catch-star.uf2
# TS 版
bash tools/build-lang.sh py-01-catch-star ts firmware/06-py-catch-star-ts.uf2
```

**Python 版为什么要两步**：`mkc build` 直接编 `pyprj` 项目会报 `no magic`（mkc 已知限制）。`build-lang.sh` 自动完成：
`mkc build -j`（静态 Python → TypeScript，输出 `built/main.ts`）→ 把 `main.ts` 放进 `native/` → `mkc build`（TS → STM32F401 本机码）。

刷机：按复位键 → 拖 UF2 进 `ARCADE-F4` 盘，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 6`。

---

## 7. 常见坑

1. **编出空壳固件**：`pxt.json` 缺 `preferredEditor: "pyprj"`。
2. **变量名 `player` 冲突**：改用 `hero` / `ship`。
3. **`player` / `player2` 等保留名**：静态 Python 转译时会和内置变量撞车，报错信息往往不直观。
4. **中文界面乱码**：默认无中文字库。
5. **不 `destroy()`**：掉出屏幕的星星越积越多，96 KiB SRAM 很快耗尽。
6. **回调写成 `on_spawn()`**：立刻执行而不是注册。
7. **`lambda` / `import` / 第三方库**：静态 Python 全部不支持，它不是 MicroPython。

---

## 8. 相关文档

- `doc/09-Python特别注意事项.md` —— 静态 Python 的完整限制清单
- `doc/10-TS与Python语法速查表.md` —— API 命名转换速查
- `projects/README.md` —— 怎么在网页版切 Python / 积木、怎么把项目导入编辑器