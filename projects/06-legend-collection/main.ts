// ===================================================================
//  RETRO 6-IN-1  ——  一个 UF2 里装 6 个完整玩法的经典游戏
//  贪吃蛇 / 横版跳跃 / 横版枪战 / 坦克大战 / 火柴人枪战 / 飞机大战
//  全部使用「立即模式」直接画屏，不用精灵系统，最大限度省 RAM。
//
//  排版铁律（160x120 的硬账，实测过，别改）：
//    · 每个字符宽 6px（5px 字形 + 1px 间距），高 7px，行距取 9~10px
//    · 一行最多 26 个字符；HUD 字段一律用 tr() 右对齐到固定列，
//      这样分数从 0 涨到 5 位数也只是往左长，永远不会压到隔壁字段
//    · 所有浮层（提示卡 / 暂停 / 结算）先铺黑底再写字，绝不叠在游戏画面上
// ===================================================================

namespace G {
    export const SW = 160
    export const SH = 120
    export const CW = 6              // 字符步进，实测值

    // 16 色调色板索引。12/13/14 的实测颜色和名字完全不符，别凭直觉用：
    //   12 = 深灰   13 = 浅粉   14 = 棕   8 = 深蓝
    export const BLACK = 15
    export const WHITE = 1
    export const RED = 2
    export const PINK = 3
    export const ORANGE = 4
    export const YELLOW = 5
    export const TEAL = 6
    export const GREEN = 7
    export const BLUE = 8
    export const CYAN = 9
    export const PURPLE = 10
    export const GRAY = 11
    export const BROWN = 12          // 实为深灰
    export const DKRED = 13          // 实为浅粉
    export const DKBLUE = 14         // 实为棕
    export const DKGRAY = 12
    export const LTGLOW = 13
    export const WOOD = 14

    export function r(x: number, y: number, w: number, h: number, c: number): void {
        screen.fillRect(x, y, w, h, c)
    }
    export function box(x: number, y: number, w: number, h: number, c: number): void {
        screen.drawRect(x, y, w, h, c)
    }
    export function line(x0: number, y0: number, x1: number, y1: number, c: number): void {
        screen.drawLine(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), c)
    }
    export function t(s: string, x: number, y: number, c: number): void {
        screen.print(s, x, y, c)
    }
    // 居中：自己算，行为和 printCenter 一致但可预期
    export function tc(s: string, y: number, c: number): void {
        screen.print(s, Math.floor((SW - s.length * CW) / 2), y, c)
    }
    // 右对齐：xr 是右边界（不含）。HUD 靠它保证字段互不重叠
    export function tr(s: string, xr: number, y: number, c: number): void {
        screen.print(s, xr - s.length * CW, y, c)
    }
    export function tw(s: string): number {
        return s.length * CW
    }
    // 分数压缩：过万就写成 12K，保证 HUD 字段宽度恒定，永远挤不到隔壁
    export function sc(n: number): string {
        return n < 10000 ? "" + n : Math.floor(n / 1000) + "K"
    }
    export function ri(a: number, b: number): number {
        return Math.randomRange(a, b)
    }
    export function clamp(v: number, a: number, b: number): number {
        return v < a ? a : (v > b ? b : v)
    }
    export function hit(ax: number, ay: number, aw: number, ah: number,
        bx: number, by: number, bw: number, bh: number): boolean {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }
    export function abs(v: number): number {
        return v < 0 ? -v : v
    }

    // ---------------- 通用绘制积木 ----------------

    // 实心圆：用一条条横线拼，避免依赖可能不存在的 fillCircle
    export function disc(cx: number, cy: number, rad: number, c: number): void {
        for (let dy = -rad; dy <= rad; dy++) {
            const w = Math.floor(Math.sqrt(rad * rad - dy * dy) + 0.4)
            r(cx - w, cy + dy, w * 2 + 1, 1, c)
        }
    }
    // 两色天空：mid 以上铺 ca、以下铺 cb。刻意做成硬边——1px 点阵抖动在
    // 160x120 上会变成满屏噪点，反而更难看（实测过）。
    export function sky(y0: number, y1: number, ca: number, cb: number, mid: number): void {
        if (mid > y0) r(0, y0, SW, mid - y0, ca)
        const rest = y1 - mid + 1
        if (rest > 0) r(0, mid, SW, rest, cb)
    }
    // 双层浮雕面板：外框 c1、次层 c2、内部铺黑（保证写的字不会和底下的画重叠）
    export function panel(x: number, y: number, w: number, h: number, c1: number, c2: number): void {
        r(x, y, w, h, c1)
        r(x + 1, y + 1, w - 2, h - 2, c2)
        r(x + 2, y + 2, w - 4, h - 4, BLACK)
    }
    // 四角标记，用来给战术框 / 关卡框加「仪器感」
    export function corners(x: number, y: number, w: number, h: number, len: number, c: number): void {
        r(x, y, len, 1, c); r(x, y, 1, len, c)
        r(x + w - len, y, len, 1, c); r(x + w - 1, y, 1, len, c)
        r(x, y + h - 1, len, 1, c); r(x, y + h - len, 1, len, c)
        r(x + w - len, y + h - 1, len, 1, c); r(x + w - 1, y + h - len, 1, len, c)
    }
    // 带外框的进度条（pct 取 0~1），帧内左右各留 1px 给边框
    export function bar(x: number, y: number, w: number, h: number, pct: number, fg: number, bg: number, edge: number): void {
        r(x, y, w, h, bg)
        const fw = Math.floor((w - 2) * clamp(pct, 0, 1))
        if (fw > 0) r(x + 1, y + 1, fw, h - 2, fg)
        box(x, y, w, h, edge)
    }
    // 顶部状态条：0..11 黑底，第 11 行一条主题色分隔线，画面从 12 起
    export function hudTop(c: number): void {
        r(0, 0, SW, 11, BLACK)
        r(0, 11, SW, 1, c)
    }
    // 开局操作卡：居中的双描边提示块，只在开局两秒出现，之后彻底消失
    export function introCard(title: string, k1: string, k2: string, c: number): void {
        panel(8, 40, 144, 38, c, DKGRAY)
        r(8, 40, 144, 1, c)
        tc(title, 46, c)
        tc(k1, 57, WHITE)
        if (k2 !== "") tc(k2, 67, GRAY)
    }

    // 非阻塞音效：playTone 会 pause()，会卡住游戏循环，必须用后台 Playable
    let lastBeep = 0
    export function beep(f: number, ms: number): void {
        const now = control.millis()
        if (now - lastBeep < 55) return
        lastBeep = now
        music.tonePlayable(f, ms).play(music.PlaybackMode.InBackground)
    }

    // ---- 通用状态 ----
    export let cur = 0            // 0=菜单 1..6=游戏
    export let isOver = false
    export let overTitle = ""
    export let overScore = 0
    export let overBest = 0
    let bHold = 0
    export let quitProgress = 0

    export function playGame(n: number): void {
        settings.writeNumber("lg", n)
        game.reset()
    }
    export function toMenu(): void {
        settings.writeNumber("lg", 0)
        game.reset()
    }
    export function replay(n: number): void {
        playGame(n)
    }

    // 长按 B 1.2 秒回菜单（游戏内短按 B 仍是正常操作）
    export function tickQuit(): void {
        if (controller.B.isPressed()) {
            if (bHold === 0) bHold = control.millis()
            quitProgress = control.millis() - bHold
            if (quitProgress >= 1200 && cur !== 0) toMenu()
        } else {
            bHold = 0
            quitProgress = 0
        }
    }
    // 回菜单提示条：铺一条黑底再写字，绝不和 HUD / 游戏画面叠字
    export function drawQuitBar(): void {
        if (quitProgress <= 0) return
        r(0, SH - 10, SW, 10, BLACK)
        const w = Math.floor(quitProgress * SW / 1200)
        r(0, SH - 10, Math.min(SW, w), 2, YELLOW)
        tc("HOLD B: MENU", SH - 8, YELLOW)
    }

    export function setOver(title: string, sc: number, bestKey: string): void {
        if (isOver) return
        isOver = true
        overTitle = title
        overScore = sc
        let b = settings.readNumber(bestKey) || 0
        if (sc > b) {
            settings.writeNumber(bestKey, sc)
            b = sc
        }
        overBest = b
        beep(196, 180)
    }

    export function drawOver(): void {
        panel(6, 30, 148, 58, CYAN, BLUE)
        tc(overTitle, 36, YELLOW)
        tc("SCORE " + overScore, 47, WHITE)
        tc("BEST  " + overBest, 57, CYAN)
        tc("A=RETRY  HOLD B=MENU", 70, GREEN)
    }

    // 画一个 8x8 的像素图标（菜单用）
    export function pixelIcon(x: number, y: number, kind: number): void {
        if (kind === 0) {           // 蛇
            r(x + 1, y + 1, 4, 4, GREEN); r(x + 4, y + 3, 4, 3, GREEN)
            r(x + 2, y + 2, 1, 1, WHITE); r(x + 6, y + 5, 2, 2, RED)
        } else if (kind === 1) {    // 跳跃小人
            r(x + 2, y, 5, 2, RED); r(x + 2, y + 2, 5, 3, ORANGE)
            r(x + 1, y + 5, 7, 2, BLUE)
        } else if (kind === 2) {    // 枪
            r(x + 1, y + 2, 5, 5, CYAN); r(x + 5, y + 3, 5, 2, WHITE)
            r(x + 1, y, 2, 2, YELLOW)
        } else if (kind === 3) {    // 坦克
            r(x + 1, y + 2, 8, 5, GREEN); r(x + 4, y, 2, 3, GREEN)
            r(x + 3, y + 3, 4, 2, BLACK)
        } else if (kind === 4) {    // 火柴人
            r(x + 3, y, 3, 3, WHITE)
            line(x + 4, y + 3, x + 4, y + 5, WHITE)
            line(x + 4, y + 3, x + 1, y + 5, WHITE)
            line(x + 4, y + 3, x + 7, y + 5, WHITE)
            line(x + 4, y + 5, x + 2, y + 7, WHITE)
            line(x + 4, y + 5, x + 6, y + 7, WHITE)
        } else {                    // 飞机
            r(x + 3, y, 2, 5, CYAN); r(x, y + 2, 8, 2, CYAN)
            r(x + 2, y + 5, 4, 1, YELLOW)
        }
    }
}

// ================== 启动逻辑 ==================
// settings 里存的是「本次复位后要启动的游戏」，读完立刻清零，
// 因此冷启动永远回菜单，只有游戏内 game.reset() 才会直达对应游戏。
let _launch = settings.readNumber("lg") || 0
if (_launch !== 0) settings.writeNumber("lg", 0)
G.cur = _launch
let cursor = 1

game.onUpdate(function () { G.tickQuit() })

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (G.isOver) G.replay(G.cur)
    else if (G.cur === 0) G.playGame(cursor)
})

if (G.cur === 0) {
    scene.setBackgroundColor(G.BLACK)
    // 6 个游戏一屏全能放下（每项一行 14px），不再需要滚动
    const N = 6
    const names = ["SNAKE", "PLATFORM HERO", "RUN & GUN", "TANK BATTLE", "STICKMAN", "SKY RAIDER"]

    function moveSel(d: number): void {
        cursor += d
        if (cursor > N) cursor = 1
        if (cursor < 1) cursor = N
        G.beep(660, 40)
    }
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () { moveSel(-1) })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () { moveSel(1) })

    let stars: number[] = []
    for (let i = 0; i < 30; i++) {
        stars.push(G.ri(0, 159))
        stars.push(G.ri(0, 119))
    }
    let frame = 0
    game.onShade(function () {
        frame++
        // 夜空：黑底 + 流动星点
        screen.fill(G.BLACK)
        for (let i = 0; i < stars.length; i += 2) {
            const sy = (stars[i + 1] + Math.floor(frame / 7)) % 120
            screen.setPixel(stars[i], sy, (i % 6 === 0) ? G.WHITE : G.GRAY)
        }
        // ---- 标题牌 ----
        G.panel(4, 2, 152, 18, G.CYAN, G.BLUE)
        G.r(14, 12, 5, 1, G.CYAN); G.r(15, 10, 3, 5, G.CYAN); G.r(16, 9, 1, 2, G.WHITE)
        G.r(141, 12, 5, 1, G.CYAN); G.r(142, 10, 3, 5, G.CYAN); G.r(143, 9, 1, 2, G.WHITE)
        G.tc("RETRO 6-IN-1", 7, G.WHITE)
        // ---- 条目：6 行 x 14px，从 26 开始 ----
        for (let i = 0; i < N; i++) {
            const y = 26 + i * 14
            const sel = cursor === i + 1
            if (sel) {
                G.r(6, y - 3, 148, 13, G.BLUE)
                G.box(6, y - 3, 148, 13, G.YELLOW)
                G.r(6, y - 3, 2, 13, G.YELLOW)
            }
            G.pixelIcon(14, y - 1, i)
            G.t((i + 1) + ".", 28, y, sel ? G.WHITE : G.GRAY)
            G.t(names[i], 46, y, sel ? G.YELLOW : G.WHITE)
        }
        // ---- 底部一行操作提示 ----
        G.r(4, 108, 152, 1, G.BLUE)
        G.tc("A=PLAY   HOLD B=MENU", 110, G.CYAN)
    })
} else if (G.cur === 1) {
    Snake.start()
} else if (G.cur === 2) {
    Platformer.start()
} else if (G.cur === 3) {
    Contra.start()
} else if (G.cur === 4) {
    Tanks.start()
} else if (G.cur === 5) {
    Stickman.start()
} else {
    SkyRaider.start()
}
