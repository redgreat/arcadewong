# 10 · TypeScript ↔ 静态 Python 一页速查表

打印出来贴在电脑旁。左列 TS（`main.ts`），右列静态 Python（`main.py`）。

---

## 10.1 基础语法

| 作用 | TypeScript | 静态 Python |
| --- | --- | --- |
| 不变的量 | `const N = 6` | `N = 6`（约定全大写） |
| 会变的量 | `let n = 0` | `n = 0` |
| 空数组 | `const a: number[] = []` | `a: List[number] = []` |
| 有值数组 | `const a = [10, 9, 8]` | `a = [10, 9, 8]` |
| 函数 | `function f(x: number): number { return x + 1 }` | `def f(x):` + 缩进 + `return x + 1` |
| 代码块 | `{ ... }` | `:` + 缩进 4 空格 |
| 语句结束 | `;`（可省） | 换行 |
| 注释 | `// ...` / `/* */` | `# ...` |
| 如果 | `if (a > b) { } else if (...) { } else { }` | `if a > b:` / `elif ...:` / `else:` |
| 三元 | `cond ? A : B` | `A if cond else B` |
| 相等 / 不等 | `===` / `!==` | `==` / `!=` |
| 并且 / 或者 / 非 | `&&` / `\|\|` / `!` | `and` / `or` / `not` |
| 真 / 假 | `true` / `false` | `True` / `False` |
| 遍历 | `for (const x of a) { }` | `for x in a:` |
| 按次数 | `for (let i=0; i<5; i++)` | `for i in range(5):` |
| 条件循环 | `while (i < n) { }` | `while i < n:` |
| 长度 | `a.length` | `len(a)` |
| 追加 | `a.push(v)` | `a.append(v)` |
| 头插 | `a.insertAt(0, v)` | `a.insert_at(0, v)` |
| 删第 i 个 | `a.removeAt(i)` | `a.remove_at(i)` |
| 取整 | `Math.floor(x)` | `Math.floor(x)` |
| 最小 / 最大 / 绝对值 | `Math.min` / `Math.max` / `Math.abs` | `Math.min` / `Math.max` / `abs` |
| 取余 | `%` | `%` |
| 随机数 | `Math.randomRange(1, 6)` | `randint(1, 6)` |
| 数字转文字 | `"" + n` | `str(n)` |
| 字符串拼接 | `+` | `+` |
| 像素画 | ``img`...` `` | `img("""...""")` |

---

## 10.2 这台机器的常用 API

| 作用 | TypeScript | 静态 Python |
| --- | --- | --- |
| 全屏填色 | `screen.fill(15)` | `screen.fill(15)` |
| 实心矩形 | `screen.fillRect(x,y,w,h,c)` | `screen.fill_rect(x,y,w,h,c)` |
| 空心矩形 | `screen.drawRect(...)` | `screen.draw_rect(...)` |
| 画线 | `screen.drawLine(...)` | `screen.draw_line(...)` |
| 一个像素 | `screen.setPixel(x,y,c)` | `screen.set_pixel(x,y,c)` |
| 左对齐文字 | `screen.print(s,x,y,c)` | `screen.print(s,x,y,c)` |
| 居中文字 | `screen.printCenter(s,y,c)` | `screen.print_center(s,y,c)` |
| 背景色 | `scene.setBackgroundColor(9)` | `scene.set_background_color(9)` |
| 屏宽 / 高 | `scene.screenWidth()` / `screenHeight()` | 同 / 或直接写 160 / 120 |
| **每帧逻辑** | `game.onUpdate(fn)` | `game.on_update(fn)` |
| **每帧绘制** | `game.onShade(fn)` | `game.on_shade(fn)` |
| 定时 | `game.onUpdateInterval(ms, fn)` | `game.on_update_interval(ms, fn)` |
| 开机毫秒 | `game.runtime()` / `control.millis()` | 同 |
| 结束 | `game.over(false)` | `game.over(False)` |
| 弹窗 | `game.splash(a, b)` | 同 |
| 软重启 | `game.reset()` | 同 |
| 存 / 取数字 | `settings.writeNumber("k", v)` / `readNumber` | `settings.write_number` / `read_number` |
| 按键瞬间 | `controller.A.onEvent(ControllerButtonEvent.Pressed, fn)` | `controller.A.on_event(ControllerButtonEvent.PRESSED, fn)` |
| 按键按住 | `controller.left.isPressed()` | `controller.left.is_pressed()` |
| 方向键控制精灵 | `controller.moveSprite(s, 100, 0)` | `controller.move_sprite(s, 100, 0)` |
| 造精灵 | `sprites.create(img, SpriteKind.Player)` | `sprites.create(img, SpriteKind.player)` |
| 从边缘发射 | `sprites.createProjectileFromSide(img, vx, vy)` | `sprites.create_projectile_from_side(...)` |
| 从精灵发射 | `sprites.createProjectileFromSprite(img, src, vx, vy)` | `sprites.create_projectile_from_sprite(...)` |
| 动态图片 | `image.create(w,h)` + `.fill(c)` | 同 |
| 改类别 | `.setKind(SpriteKind.Enemy)` | `.set_kind(SpriteKind.enemy)` |
| 隐身 | `.setFlag(SpriteFlag.Invisible, true)` | `.set_flag(SpriteFlag.INVISIBLE, True)` |
| 销毁 | `.destroy()` | `.destroy()` |
| 同类列表 | `sprites.allOfKind(kind)` | `sprites.all_of_kind(kind)` |
| 碰撞规则 | `sprites.onOverlap(kA, kB, fn)` | `sprites.on_overlap(kA, kB, fn)` |
| 分数 / 生命 | `info.setScore(0)` / `changeScoreBy(1)` / `setLife` / `changeLifeBy` | `info.set_score(0)` / `change_score_by(1)` / `set_life` / `change_life_by` |
| 音效 | `music.baDing.play()` / `pewPew` / `powerUp` / `wawawawaa` | `music.ba_ding.play()` / `pew_pew` / … |
| 自定义音（后台） | `music.tonePlayable(f,ms).play(music.PlaybackMode.InBackground)` | `music.tone_playable(f,ms).play(music.PlaybackMode.IN_BACKGROUND)` |

---

## 10.3 枚举大小写（最容易写错）

| 概念 | TS | Python |
| --- | --- | --- |
| 精灵类别 | `SpriteKind.Player / Food / Enemy / Projectile` | `SpriteKind.player / food / enemy / projectile` |
| 按键事件 | `ControllerButtonEvent.Pressed` | `ControllerButtonEvent.PRESSED` |
| 精灵标志 | `SpriteFlag.Invisible` | `SpriteFlag.INVISIBLE` |
| 播放模式 | `music.PlaybackMode.InBackground` | `music.PlaybackMode.IN_BACKGROUND` |
| 布尔 | `true` / `false` | `True` / `False` |

---

## 10.4 回调写法对照（TS 匿名 / Python 具名）

```ts
// TypeScript：匿名函数直接写进参数
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    info.changeScoreBy(1)
})
game.onShade(function () {
    screen.fill(15)
    screen.printCenter("" + info.score(), 40, 5)
})
```

```python
# 静态 Python：先 def 起名字，再传函数名（不带括号！）
def on_a():
    info.change_score_by(1)

def draw():
    screen.fill(15)
    screen.print_center(str(info.score()), 40, 5)

controller.A.on_event(ControllerButtonEvent.PRESSED, on_a)
game.on_shade(draw)
```

⚠️ `game.on_shade(draw())` 是**立刻执行**，不是注册回调。不支持 `lambda`。

---

## 10.5 常见报错速查

| 报错 / 现象 | 原因 | 修法 |
| --- | --- | --- |
| `TS9514: module 'X' has no attribute 'y'` | 枚举大小写或命名写错 | 查 10.3 表 |
| `TS9574: lambda expressions are not supported yet` | 用了 `lambda` | 改具名 `def` |
| `implicitly has type 'any[]'` | Python 空数组没标注 | `a: List[number] = []` |
| `too many arguments in call to 'Array.pop'` | 用了 `pop(0)` | `remove_at(0)` |
| `Exception: Error: no magic` | `mkc build` 直接编 `pyprj` 项目 | 用 `tools/build-lang.sh ... py` 两步编译 |
| Build OK 但真机黑屏 / 固件体积异常一致 | `pxt.json` 缺 `preferredEditor: "pyprj"`，编出空壳 | 补上；检查 UF2 里能否搜到源码字符串 |
| 屏幕纯黑 | `screen.xxx` 写在 `onUpdate` / `on_update` | 改 `onShade` / `on_shade` |
| 屏幕全白 / 花屏 | family ID 不对，刷了别的硬件固件 | `mkc.json` 加 `hwVariant: "stm32f401"` |
| 中文变方块 | 无中文字库 | 界面用英文 |
| 变量改了没反应 | Python 函数里漏 `global` / `nonlocal` | 补声明，或改用单元素列表 |
| 玩久了卡死 | 精灵 / 子弹没 `destroy()` | 飞出屏幕就回收 |
| 游戏一顿一顿 | 用了 `music.playTone()`（阻塞） | 改 `InBackground` |
| `player` 相关奇怪报错 | 变量名与系统预设冲突 | 改名 `hero` / `ship` |

---

## 10.6 一页之外的建议

- **先改数字，再改逻辑，最后自己写**：所有项目的旋钮都在文件开头。
- **教孩子从积木开始**：手写代码反编译成积木会出现灰色代码块，见 `projects/README.md`。
- **每加一点东西就编译一次**：`bash tools/build-lang.sh <项目> <ts|py>`，脚本会校验 UF2。
- **真机验证不能省**：编译通过 ≠ 画面正常，尤其是直接画屏的项目。

---

返回 [00 入门导读](00-入门导读.md) · 各项目教程见 `projects/*/README.md`
