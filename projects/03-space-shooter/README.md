# 03 · 太空射击（Space Shooter）

> 左右移动 + 按 A 发射子弹打敌人。**第三堂课**：把前两课的「碰撞规则」组合起来，再加「自己造出来的对象要自己收回去」。
> 对应固件：`firmware/03-space-shooter.uf2`。

---

## 0. 这个目录里有什么

| 文件 | 作用 |
| --- | --- |
| `main.ts` | TypeScript 版（当前 `pxt.json` 编译入口） |
| `main.py` | Python 版，玩法完全一致 |
| `pxt.json` / `mkc.json` | 项目清单 / F4 编译设置 |
| `README.md` | 本文件 |

---

## 1. 先玩，再讲（5 分钟）

方向键左右移动，A 发射子弹；打中敌人 +1 分，敌人撞到飞船 −1 命，3 命用完结束。
问孩子：「这里一共有几种『碰到』？它们的结果一样吗？」——答案是**两种，而且结果相反**，这是本堂课的主线。

---

## 2. 从零把这个程序写出来（书写过程）

### 第 1 步：旋钮放最上面

```ts
const SHIP_SPEED = 100
const BULLET_SPEED = -130   // 负数 = 向上飞
const ENEMY_SPEED = 45
const SPAWN_MS = 700
const START_LIVES = 3
```

**为什么**：和前两课保持一样的约定。注意 `BULLET_SPEED` 是**负数**——屏幕 y 轴向下为正，向上就得是负的，正好复习坐标。

### 第 2 步：造飞船

```ts
const ship = sprites.create(img`...`, SpriteKind.Player)
ship.y = 104
ship.setStayInScreen(true)
controller.moveSprite(ship, SHIP_SPEED, 0)
scene.setBackgroundColor(15)
info.setScore(0)
info.setLife(START_LIVES)
```

**为什么**：和 01 完全一样，孩子会发现「原来新游戏有一半是抄上一课的」——这是很好的**复用**概念。

### 第 3 步：按 A 从飞船位置发射一颗子弹

```ts
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    const bullet = sprites.createProjectileFromSprite(img`
        . . 5 .
        . . 5 .
        . . 5 .
        . . 5 .
    `, ship, 0, BULLET_SPEED)
    bullet.setKind(SpriteKind.Projectile)
    music.pewPew.play()
})
```

**为什么**：
- 用 `createProjectileFromSprite(图片, ship, vx, vy)` 而不是 `FromSide`：子弹要**从飞船当前位置**冒出来。
- 贴 `SpriteKind.Projectile` 标签，和敌人、飞船区分开，下面才能写「子弹碰到敌人」。
- 音效放在事件里，每次按都响，反馈最直接。

### 第 4 步：定时从上方随机位置放敌人

```ts
game.onUpdateInterval(SPAWN_MS, function () {
    const enemy = sprites.createProjectileFromSide(img`...`, 0, ENEMY_SPEED)
    enemy.x = Math.randomRange(12, scene.screenWidth() - 12)
    enemy.setKind(SpriteKind.Enemy)
})
```

**为什么**：和第 1 课掉披萨几乎一样，只是速度方向、标签不同。可以让孩子自己照着 01 写出来，检验是否真的学会了。

### 第 5 步：两条碰撞规则（本课核心）

```ts
// 规则 A：子弹打中敌人 → 两个都消失，加分
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy()
    otherSprite.destroy()
    info.changeScoreBy(1)
    music.baDing.play()
})

// 规则 B：敌人撞到飞船 → 敌人消失，扣命
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeLifeBy(-1)
})
```

**为什么**：注意规则 A 里 `sprite`（子弹）也要销毁 —— 不然子弹会穿过敌人继续往上飞，一路打穿一串敌人。可以让孩子先故意删掉 `sprite.destroy()` 看看会发生什么，印象特别深。

### 第 6 步：回收飞出屏幕的敌人

```ts
game.onUpdate(function () {
    for (const e of sprites.allOfKind(SpriteKind.Enemy)) {
        if (e.y > scene.screenHeight() + 8) e.destroy()
    }
})
```

**为什么**：子弹、敌人都是「运行时不断造出来」的对象。飞出屏幕后玩家再也看不到，但精灵还占着内存。这台机器只有 **96 KiB SRAM**，不回收几分钟就会卡死/重启。
这一步是「程序要打扫自己的房间」的最好例子，也是从「写玩具」走向「写能一直跑的程序」的分水岭。

> 完整代码见 `main.ts` / `main.py`，共 6 步。

---

## 3. 给孩子讲的教案（30～40 分钟）

### 三个新概念

| 概念 | 类比 | 代码 |
| --- | --- | --- |
| **从别的对象身上生成** | 从飞船炮口冒出子弹，不是从屏幕边上 | `createProjectileFromSprite(..., ship, ...)` |
| **一组规则，两种结果** | 同样是「撞上了」，好事或坏事看是谁撞谁 | 两个 `onOverlap` |
| **资源回收** | 玩具玩完要收进箱子，不然房间堆满 | `e.destroy()` |

### 互动提问

1. 「子弹速度为什么是 `-130` 不是 `130`？」→ 负数向上；写正的会往下打到自己。
2. 「两个 `onOverlap` 能不能合成一个？」→ 不能，因为加分和扣命是相反的规则；标签就是用来区分的。
3. 「如果子弹不销毁会怎样？」→ 一发子弹能连打一串敌人，游戏变简单。
4. 「敌人飞出屏幕后去哪了？」→ 还在内存里，所以要 `destroy()`。

### 动手任务（每改一次刷进去看）

| # | 任务 | 改哪里 | 预期现象 |
| --- | --- | --- | --- |
| 1 | 子弹变快 | `BULLET_SPEED` -130 → -250 | 更容易打中 |
| 2 | 敌人下得更慢 | `ENEMY_SPEED` 45 → 15 | 时间更充裕 |
| 3 | 敌人出得更密 | `SPAWN_MS` 700 → 300 | 弹幕感 |
| 4 | 一次发两颗 | 复制一行 `createProjectileFromSprite`，第二颗 `vx = 20` | 散射 |
| 5 | 打中加 5 分 | `changeScoreBy(1)` → `(5)` | 分数飞涨 |
| 6 | 撞飞船不扣命、反加分 | `changeLifeBy(-1)` → `changeScoreBy(1)` | 变成「故意去撞」的游戏 |
| 7 | 换音效 | `music.pewPew` → `music.zapped` | 手感不同 |

### 讲完的延伸

试试做一个「连发」：把 `controller.A.onEvent(...)` 换成在 `game.onUpdateInterval(150, ...)` 里发射，只要按住某个方向就持续开火。孩子会第一次意识到「**事件**」和「**持续状态**」不是一回事。

---

## 4. 可以随便改的旋钮

| 参数 | TS | Python | 调大 | 调小 |
| --- | --- | --- | --- | --- |
| `SHIP_SPEED` | `main.ts:5` | `main.py:5` | 更灵活 | 迟钝 |
| `BULLET_SPEED` | `main.ts:6` | `main.py:6` | 更负＝子弹更快 | 子弹慢 |
| `ENEMY_SPEED` | `main.ts:7` | `main.py:7` | 敌人快，难 | 简单 |
| `SPAWN_MS` | `main.ts:8` | `main.py:8` | 稀疏 | 密集 |
| `START_LIVES` | `main.ts:9` | `main.py:9` | 玩得久 | 硬核 |

---

## 5. TS 和 Python 哪里不一样

| 概念 | TypeScript | 静态 Python |
| --- | --- | --- |
| 从精灵生成 | `sprites.createProjectileFromSprite` | `sprites.create_projectile_from_sprite` |
| 从边缘生成 | `createProjectileFromSide` | `create_projectile_from_side` |
| 精灵标签 | `SpriteKind.Projectile` / `.Enemy` | `SpriteKind.projectile` / `.enemy` |
| 遍历 | `for (const e of ...)` | `for e in ...` |
| 遍历所有同类 | `sprites.allOfKind(...)` | `sprites.all_of_kind(...)` |
| 回调 | 匿名 `function () {}` | 具名 `def recycle(): ...` 再传入 |

---

## 6. 编译与烧录

```bash
bash tools/build-lang.sh 03-space-shooter ts firmware/03-space-shooter.uf2
bash tools/build-lang.sh 03-space-shooter py firmware/03-space-shooter-py.uf2
```

按复位键出现 `ARCADE-F4` 盘后拖入 UF2，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 3`。

---

## 7. 常见坑

1. **子弹 / 敌人不销毁**：内存泄漏，玩久了变卡甚至黑屏重启。
2. **速度符号搞反**：向上必须是负值。
3. **`onOverlap` 的两个参数顺序**：第一个是「声明里写在前面的那类精灵」，别把子弹和敌人搞反。
4. **音效卡住游戏**：本项目用的 `music.pewPew.play()` 是后台播放；若自己改用 `music.playTone(...)` 会 `pause()` 阻塞主循环，游戏会一顿一顿的（详见 `06-legend-collection/main.ts` 里 `beep()` 的写法）。

---

## 8. 对应官方积木示例

官网 **Space Destroyer** 教程，以及首页的 **Galga** / **Boss Rush** 示例，都是「发射 + 两种碰撞 + 回收」的结构，带完整积木源码。
