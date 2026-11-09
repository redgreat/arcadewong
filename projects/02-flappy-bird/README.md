# 02 · 飞扬的小鸟（Flappy Bird）

> 按 A 让小鸟往上扑一下，躲过一根根柱子。这是**第二堂课**：从「精灵移动」进阶到「重力、速度、看不见的规则」。
> 对应固件：`firmware/02-flappy-bird.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | TypeScript 版（当前 `pxt.json` 的编译入口） |
| `main.py` | Python 版，玩法完全一致 |
| `pxt.json` / `mkc.json` | 项目清单 / F4 硬件编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（5 分钟）

按 A（或 ↑）小鸟往上跳，不按就往下掉；穿过柱子中间的缝得 1 分，撞柱子或撞上下边界就结束。
问孩子：「小鸟不按键的时候，是谁在往下拉它？」——引出**重力**，这是这堂课的核心。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：旋钮集中放最上面

```ts
const GRAVITY = 230      // 重力（每秒把速度拉大多少）
const JUMP_VY = -85      // 按 A 时的竖直速度，负数 = 向上
const PIPE_SPEED = -50   // 柱子向左移动
const PIPE_INTERVAL = 1500
const GAP = 46           // 缝隙高度，越小越难
```

**为什么**：这 5 个数字决定了整个「手感」。教孩子时只让他们动 `GRAVITY` 和 `JUMP_VY`，最能直观感受物理。

### 第 2 步：造小鸟，关掉分数以外的花活

```ts
const bird = sprites.create(img`...`, SpriteKind.Player)
bird.x = 32
bird.y = 60
info.setScore(0)
scene.setBackgroundColor(11)
```

**为什么**：这次**不用** `moveSprite` —— 小鸟水平方向固定不动，是**世界（柱子）向左走**，看起来才像鸟在往前飞。这是横版游戏常用的偷懒技巧。

### 第 3 步：每一帧都重新施加重力（关键）

```ts
game.onUpdate(function () {
    bird.ay = GRAVITY
    if (bird.y < 4 || bird.y > scene.screenHeight() - 4) {
        game.over(false)
    }
})
```

**为什么**：
- `ay` 是**加速度**：不是「往下移动 230 像素」，而是「下落速度每秒增加 230」。所以小鸟是**越掉越快**，这才像真的重力。
- 必须写在 `onUpdate` 里每帧设置，写一次在开机时也能生效（引擎会持续用这个值），但每帧写更直观。
- 顺手在同一个回调里检查边界，飞出屏幕就 `game.over(false)` 结束。

### 第 4 步：按 A 只做一件事 —— 把速度改成向上

```ts
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    bird.vy = JUMP_VY
})
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    bird.vy = JUMP_VY
})
```

**为什么**：`ay` 一直在往下拉，`vy` 是「当前竖直速度」。按一下把 `vy` 设成负数，鸟就往上冲，随后被重力慢慢拉回来，形成一条抛物线。
**千万别写成 `bird.y = bird.y - 10`** —— 那样是瞬移，没有「飞」的感觉。这里可以顺便给孩子讲「速度」和「位置」的区别。

### 第 5 步：一次生成三样东西：上柱、下柱、看不见的得分线

```ts
game.onUpdateInterval(PIPE_INTERVAL, function () {
    const gapY = Math.randomRange(35, 85)
    const h1 = gapY - GAP / 2
    const h2 = scene.screenHeight() - (gapY + GAP / 2)

    const upperImg = image.create(18, h1)
    upperImg.fill(7)
    const upper = sprites.createProjectileFromSide(upperImg, PIPE_SPEED, 0)
    upper.setKind(SpriteKind.Enemy)
    upper.y = h1 / 2
    // ... 下柱同理，y = gapY + GAP/2 + h2/2

    const gateImg = image.create(4, GAP)
    const gate = sprites.createProjectileFromSide(gateImg, PIPE_SPEED, 0)
    gate.setKind(SpriteKind.Food)
    gate.setFlag(SpriteFlag.Invisible, true)   // 看不见！
    gate.y = gapY
})
```

**为什么**：
- `image.create(18, h1)` 是**运行时画矩形**，尺寸随 `gapY` 变化，所以每次缝隙位置都不同。
- 缝隙中心 `gapY` 随机 → 上柱高 `gapY - GAP/2`、下柱从 `gapY + GAP/2` 开始，中间的 `GAP` 就是能穿过去的空档。
- **得分线是最巧妙的一招**：一个透明的 `Food` 精灵填在缝隙里。玩家碰到它 = 成功穿过，`onOverlap` 加 1 分。这样不用写「判断 x 坐标超过了柱子」那种复杂逻辑。可以把它讲成「终点线上藏了个看不见的裁判」。

Python 版对应 `gate.set_flag(SpriteFlag.INVISIBLE, True)`（枚举名是全大写，见第 5 节）。

### 第 6 步：两条碰撞规则，两种结果

```ts
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, ...)  // 穿缝 → 加分
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, ...) // 撞柱 → 结束
```

**为什么**：同一个 `onOverlap` 机制，靠**标签不同**得到完全不同的结果。正好复习第一堂课的 `SpriteKind`。

> 完整代码见 `main.ts` / `main.py`，顺序与上面 6 步一致。

---

## 3. 给孩子讲的教案（30～40 分钟）

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **重力 / 加速度** | 有只看不见的手一直往下拽，而且越拽越快 | `bird.ay = GRAVITY` |
| **速度 vs 位置** | 位置是「你在哪」，速度是「你正往哪跑、多快」 | `vy` vs `y` |
| **看不见的对象** | 足球门里站了个隐身裁判，球一过就吹哨 | `Invisible` 的得分线 |

### 互动提问

1. 「不按任何键，小鸟是匀速掉还是越掉越快？」→ 越掉越快（加速度）。
2. 「如果把 `GRAVITY` 设成 0 会怎样？」→ 按一下就一直往上飞 / 停在空中，游戏坏掉。
3. 「柱子真的在往左走吗？小鸟真的在往前飞吗？」→ 只有柱子在动，是视觉错觉。
4. 「为什么得分线要设成看不见？」→ 它只是「规则」，不是画面里的东西。

### 动手任务（每次只改一个，刷进去试）

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 变成「月球小鸟」 | `GRAVITY` 230 → 80 | 飘起来，很好控制 |
| 2 | 一按就冲天 | `JUMP_VY` -85 → -160 | 容易撞上边界 |
| 3 | 把缝变宽 | `GAP` 46 → 70 | 明显变简单 |
| 4 | 柱子来得更密 | `PIPE_INTERVAL` 1500 → 900 | 手忙脚乱 |
| 5 | 柱子变色 | `upperImg.fill(7)` → `fill(8)` | 绿色变蓝色 |
| 6 | 穿过缝隙加 5 分 | `changeScoreBy(1)` → `(5)` | 分数涨得快 |
| 7 | 撞柱子不结束、只扣分 | `game.over(false)` 换成 `info.changeScoreBy(-1)` | 可以一直玩 |

### 讲完的延伸

让孩子试着把「柱子随分数越来越快」写出来：把 `PIPE_SPEED` 从 `const` 改成 `let`，在加分回调里 `PIPE_SPEED = PIPE_SPEED - 5`。这是第一次接触「**变量会在游戏过程中变**」。

---

## 4. 可以随便改的旋钮

| 参数 | TS | Python | 调大 | 调小 |
| --- | --- | --- | --- | --- |
| `GRAVITY` | `main.ts:5` | `main.py:5` | 掉得快，难 | 飘，简单 |
| `JUMP_VY` | `main.ts:6` | `main.py:6` | 数值更负＝跳更猛 | 跳不动 |
| `PIPE_SPEED` | `main.ts:7` | `main.py:7` | 更负＝柱子更快 | 慢速柱子 |
| `PIPE_INTERVAL` | `main.ts:8` | `main.py:8` | 稀疏 | 密集 |
| `GAP` | `main.ts:9` | `main.py:9` | 缝宽，简单 | 缝窄，难 |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript | 静态 Python |
| --- | --- | --- |
| 常量 | `const GAP = 46` | `GAP = 46` |
| 造动态图片 | `image.create(18, h1)` / `.fill(7)` | `image.create(18, h1)` / `.fill(7)`（相同） |
| 隐身标志 | `SpriteFlag.Invisible` | `SpriteFlag.INVISIBLE` ← **全大写** |
| 事件枚举 | `ControllerButtonEvent.Pressed` | `ControllerButtonEvent.PRESSED` |
| 结束游戏 | `game.over(false)` | `game.over(False)` ← **首字母大写** |
| 回调 | 匿名 `function () {}` | 具名 `def flap(): ...` 再传函数名 |

> 静态 Python 不支持 `lambda`，所以每个回调都得先 `def` 一个函数 —— 反而更适合教孩子「给一段代码起名字」。

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 02-flappy-bird ts firmware/02-flappy-bird.uf2
bash tools/build-lang.sh 02-flappy-bird py firmware/02-flappy-bird-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 2`。

---

## 7. 常见坑

1. **柱子高度算出来是小数**：`h1 = gapY - GAP / 2`，MakeCode 的 `number` 不区分整数/小数，`image.create` 能接受；但如果自己写数组下标，记得用 `Math.floor()`。
2. **得分线忘了设 `Invisible`**：会看到一条白色竖条穿过缝隙；功能正常但很丑。
3. **`game.over` 之后代码还在跑**：结束后别再生成柱子，用 `info` 的 life 或直接 `game.over` 交给引擎处理。
4. **把绘制写进 `onUpdate` 会黑屏**：本项目不用直接画屏，不受影响；`04/05/06` 会。

---

## 8. 对应官方积木示例

官网搜索 **Jumpy Platformer**、**Flappy Bird**、**Jungle Jump**，都是「重力 + 按键 + 障碍生成」的同型练习，带完整积木源码。
