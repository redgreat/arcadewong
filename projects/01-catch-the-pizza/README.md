# 01 · 接披萨（Catch the Pizza）

> 左右移动接住从天上掉下来的披萨。这是整个仓库的**第一堂课**，也是最适合给孩子讲的第一个程序。
> 对应固件：`firmware/01-catch-the-pizza.uf2`（把 UF2 直接拖进 <https://arcade.makecode.com> 就能还原成可编辑的网页项目）。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | **TypeScript 版**，也是当前 `pxt.json` 指向的编译入口 |
| `main.py` | **Python 版**，玩法与 TS 版完全一致，只是语法不同 |
| `pxt.json` | MakeCode 项目清单（`files: ["main.ts"]`） |
| `mkc.json` | 命令行编译设置，`hwVariant: "stm32f401"` = 网页版里的「F4」硬件 |
| `README.md` | 本文件 |

两个版本都通过 `tools/build-lang.sh` 实测可编译出 F4 固件。想用 Python 版当主程序，见第 6 节。

---

## 1. 先玩，再讲（5 分钟）

刷进机器后：方向键左右移动，接住披萨得 1 分，漏掉扣 1 条命，3 条命用完结束。
**先让孩子玩两局**，然后问一句：「你觉得这个游戏里，电脑每一秒都在做哪几件事？」
把回答写在纸上：移动小人 / 掉披萨 / 判断有没有接到 / 记分 / 记命。
后面每一步代码，都能对应到纸上的一行。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：把「可以调的旋钮」全部放到最上面

```ts
const PLAYER_SPEED = 110    // 左右移动速度
const FALL_SPEED = 70       // 披萨下落速度
const SPAWN_MS = 800        // 每隔多少毫秒掉一个
const START_LIVES = 3       // 一开始几条命
```

**为什么**：程序越长，越难找数字。把「会影响手感的数字」集中到开头，孩子不用读懂全部代码就能改游戏。
这是整个仓库所有项目共用的约定，教孩子时也建议保持：*先改数字，再改逻辑，最后才自己写*。
Python 版写成 `PLAYER_SPEED = 110`（没有 `const`，也没有类型）。

### 第 2 步：造一个「精灵」，让它能被方向键控制

```ts
const player = sprites.create(img`
    . . 4 4 4 4 . .
    . 4 4 4 4 4 4 .
    . . f f f f . .
`, SpriteKind.Player)
player.y = 108
player.setStayInScreen(true)
controller.moveSprite(player, PLAYER_SPEED, 0)
```

**为什么**：
- `img` 后面那串字符就是**像素画**，一个字符 = 一个像素，数字是调色板编号，`f` 是透明。让孩子改一个 `4` 成 `2`，角色就变色了。
- `SpriteKind.Player` 是给精灵贴的「标签」，后面判断「谁碰到谁」全靠它。
- `y = 108` 放在屏幕底部：屏幕逻辑分辨率是 **160×120**，左上角是 (0,0)，**y 越大越靠下**。
- `moveSprite(..., 110, 0)` 最后一个 0 表示「上下不动」，所以只能左右跑。

Python 对应写法（`main.py`）：

```python
hero = sprites.create(img("""..."""), SpriteKind.player)
hero.y = 108
hero.set_stay_in_screen(True)
controller.move_sprite(hero, PLAYER_SPEED, 0)
```

### 第 3 步：设置背景、分数、生命，开场说一句话

```ts
scene.setBackgroundColor(9)
info.setScore(0)
info.setLife(START_LIVES)
game.splash("左右移动，接住披萨！")
```

**为什么**：`info` 是 MakeCode 自带的「记分牌 + 生命条」，不用自己画。`game.splash` 会暂停游戏并显示提示，等按键才继续——开场说明玩法最省事。

### 第 4 步：每隔一段时间掉一个披萨

```ts
game.onUpdateInterval(SPAWN_MS, function () {
    const pizza = sprites.createProjectileFromSide(img`...`, 0, FALL_SPEED)
    pizza.x = Math.randomRange(12, scene.screenWidth() - 12)
    pizza.setKind(SpriteKind.Food)
})
```

**为什么**：
- `onUpdateInterval(800, ...)` = 「每 800 毫秒自动做一次」，不需要自己写循环或计时器。
- `createProjectileFromSide(图片, vx, vy)` 造一个会自己飞的精灵；`vx=0, vy=70` 就是只往下掉。
- `Math.randomRange(12, 148)` 让横坐标随机 —— 这是游戏「每次都不一样」的来源。
- 掉下来的东西贴 `SpriteKind.Food` 标签，下一步才能和玩家区分开。

### 第 5 步：写「碰到」的规则

```ts
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
    music.baDing.play()
})
```

**为什么**：这是全课最重要的一句 —— **「当 A 类精灵碰到 B 类精灵时，做某件事」**。
`sprite` 是玩家、`otherSprite` 是被接住的披萨。销毁披萨、加分、响一声，三条规则一次写完。

### 第 6 步：写「漏掉」的规则（容易被忘）

```ts
game.onUpdate(function () {
    for (const p of sprites.allOfKind(SpriteKind.Food)) {
        if (p.y > scene.screenHeight() + 8) {
            p.destroy()
            info.changeLifeBy(-1)
        }
    }
})
```

**为什么**：`onUpdate` 是**每一帧**都跑（约每秒 30 次）。逐个检查所有食物，掉出屏幕就销毁并扣命。
**一定要销毁**：不销毁的话精灵会永远堆在内存里，机器只有 96 KiB SRAM，几分钟就卡死。这是一个很好的「资源回收」启蒙点。

> 完整代码就是 `main.ts` 的 60 行左右 / `main.py` 的 70 行左右。六步顺序和源码顺序一致，可以边讲边往下翻。

---

## 3. 给孩子讲的教案（建议 30～40 分钟）

### 本堂课只教 3 个概念

| 概念 | 给孩子的类比 | 代码里在哪 |
| --- | --- | --- |
| **精灵 sprite** | 舞台上的演员，每人贴一个名牌 | `sprites.create(..., SpriteKind.Player)` |
| **事件 / 规则** | 「**当**……**就**……」的口令 | `onUpdateInterval`（当时间到）、`onOverlap`（当碰到） |
| **坐标** | 教室座位号：先说第几列 x，再说第几行 y，往下数字变大 | `player.y = 108`、`pizza.x = ...` |

### 互动提问（先问，别急着给答案）

1. 「屏幕右上角是 (0,0) 还是左上角是 (0,0)？」→ 左上角；**往下 y 变大**，和数学课坐标系相反。
2. 「为什么披萨要贴 `Food` 标签，玩家贴 `Player`？」→ 不然电脑分不清「谁碰到谁」。
3. 「如果我不写 `p.destroy()`，玩 10 分钟会怎样？」→ 掉出去的披萨一直留着，越来越卡。
4. 「`SPAWN_MS` 从 800 改成 200，游戏会变难还是变简单？」→ 变难。

### 动手任务（按难度递进，每改一次都重新刷进去看效果）

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 让小人跑得飞快 | `PLAYER_SPEED` 110 → 250 | 左右一按就冲到边 |
| 2 | 让披萨下得慢一点 | `FALL_SPEED` 70 → 25 | 有时间慢慢走过去接 |
| 3 | 一次接住加 5 分 | `changeScoreBy(1)` → `(5)` | 分数跳着涨 |
| 4 | 漏掉不扣命、反而加命 | `changeLifeBy(-1)` → `(1)` | 游戏变得永远输不了 |
| 5 | 让角色变颜色 | 像素画里的 `4` 改成 `2` | 小人从橙色变红色 |
| 6 | 一次掉两个披萨 | 复制一次 `sprites.createProjectileFromSide(...)` | 屏幕更忙 |
| 7 | 加个音效 | 在漏掉分支加 `music.wawawawaa.play()` | 漏掉时有声音反馈 |

### 如果孩子问「为什么」

- **「为什么改了数字没变化？」** → 改的是源码，要重新编译或重新下载 UF2；顺便讲「写程序 ≠ 改机器，中间还有一次编译」。
- **「为什么是 800 毫秒不是 800 秒？」** → 计算机里时间单位常用毫秒，1 秒 = 1000 毫秒。
- **「随机是真的随机吗？」** → 对小朋友说是「算出来的、看起来随机」，不用展开伪随机。

### 讲完可以顺手做的一件事

网页版右上角切到 **积木** 视图，把这 6 步和积木一一对应：
「当开机」/「建立精灵」/「移动精灵」/「每 800ms」/「当精灵重叠」/「分数改变」。
官方分步教程 <https://arcade.makecode.com/tutorials> 里的 **Chase the Pizza** 就是同一套思路，让孩子照着搭一遍，比读代码更直观。

---

## 4. 可以随便改的旋钮

| 参数 | TS 位置 | Python 位置 | 调大 | 调小 |
| --- | --- | --- | --- | --- |
| `PLAYER_SPEED` | `main.ts:6` | `main.py:6` | 跑得快、更难对准 | 跑得慢、容易漏 |
| `FALL_SPEED` | `main.ts:7` | `main.py:7` | 掉得快，变难 | 掉得慢，变简单 |
| `SPAWN_MS` | `main.ts:8` | `main.py:8` | 出得少，变简单 | 出得密，变难 |
| `START_LIVES` | `main.ts:9` | `main.py:9` | 玩得久 | 一命挑战 |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript (`main.ts`) | 静态 Python (`main.py`) |
| --- | --- | --- |
| 常量 | `const PLAYER_SPEED = 110` | `PLAYER_SPEED = 110` |
| 像素画 | ``img`...` `` | `img("""...""")` |
| 命名风格 | 驼峰 `setStayInScreen` | 下划线 `set_stay_in_screen` |
| 枚举 | `SpriteKind.Player` | `SpriteKind.player` |
| 按键常量 | `ControllerButtonEvent.Pressed` | `ControllerButtonEvent.PRESSED` |
| 回调 | `function () { ... }` 直接写在括号里 | 先 `def on_spawn():` 再把函数名传进去 |
| 随机数 | `Math.randomRange(12, 148)` | `randint(12, 148)` |
| 真 / 假 | `true` / `false` | `True` / `False` |

> ⚠️ Python 版是 MakeCode 的**静态 Python**，会先转成 TypeScript 再编译成本机码，不是 MicroPython：不能 `import`、不能写 `lambda`、回调必须是有名字的函数。

---

## 6. 编译与烧录

```bash
# TS 版（也是 pxt.json 当前指向的版本）
bash tools/build-lang.sh 01-catch-the-pizza ts firmware/01-catch-the-pizza.uf2
# 或者进入目录直接 mkc build

# Python 版：脚本自动完成「静态 Python → TS → F4 本机码」两步
bash tools/build-lang.sh 01-catch-the-pizza py firmware/01-catch-the-pizza-py.uf2
```

刷机：按一下机身**复位键** → 电脑出现 `ARCADE-F4` 盘 → 把 `.uf2` 拖进去；或

```powershell
powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 1
```

---

## 7. 常见坑

1. **中文显示不出来**：默认字库只有 ASCII，界面文字请用英文或自绘点阵。TS 版里的 `game.splash("左右移动…")` 在真机上可能显示成方块，Python 版已改成英文提示。
2. **精灵越积越多**：飞出屏幕一定要 `destroy()`。
3. **直接画屏放错回调会黑屏**：本项目用标准精灵系统，引擎负责画，不会遇到；但 `04/05/06` 和 Python 秒表用 `screen.xxx` 时必须放 `game.onShade()` / `game.on_shade()`，详见 `doc/06-屏幕绘图与坐标.md`。
4. **Python 项目编出空壳**：`pxt.json` 必须写 `"preferredEditor": "pyprj"`，否则 mkc 会静默忽略 `main.py` 却报 Build OK。`tools/build-lang.sh` 会自动生成正确配置。

---

## 8. 对应官方积木示例

<https://arcade.makecode.com/tutorials> → **Chase the Pizza**（ beginner 系列）。
另有 **Caterpillar**、**Dodge the Snake** 等同类练习，可在官网首页搜索 "catch"。
