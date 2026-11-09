// ===================================================================
//  RETRO 4-IN-1  ——  一个 UF2 里装 4 个完整玩法的经典游戏
//  贪吃蛇 / 横版跳跃 / 横版枪战 / 坦克大战
//  全部使用「立即模式」直接画屏，不用精灵系统，最大限度省 RAM。
// ===================================================================

namespace G {
    export const SW = 160
    export const SH = 120

    // 16 色调色板索引
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
    export const BROWN = 12
    export const DKRED = 13
    export const DKBLUE = 14

    export function r(x: number, y: number, w: number, h: number, c: number): void {
        screen.fillRect(x, y, w, h, c)
    }
    export function box(x: number, y: number, w: number, h: number, c: number): void {
        screen.drawRect(x, y, w, h, c)
    }
    export function line(x0: number, y0: number, x1: number, y1: number, c: number): void {
        screen.drawLine(x0, y0, x1, y1, c)
    }
    export function t(s: string, x: number, y: number, c: number): void {
        screen.print(s, x, y, c)
    }
    export function tc(s: string, y: number, c: number): void {
        screen.printCenter(s, y, c)
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

    // 非阻塞音效：playTone 会 pause()，会卡住游戏循环，必须用后台 Playable
    let lastBeep = 0
    export function beep(f: number, ms: number): void {
        const now = control.millis()
        if (now - lastBeep < 55) return
        lastBeep = now
        music.tonePlayable(f, ms).play(music.PlaybackMode.InBackground)
    }

    // ---- 通用状态 ----
    export let cur = 0            // 0=菜单 1..4=游戏
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
    export function drawQuitBar(): void {
        if (quitProgress > 0) {
            const w = Math.min(SW, Math.floor(quitProgress * SW / 1200))
            r(0, SH - 2, w, 2, YELLOW)
            if (quitProgress > 300) tc("HOLD B = MENU", 2, YELLOW)
        }
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
        r(6, 32, 148, 56, CYAN)
        r(8, 34, 144, 52, BLACK)
        tc(overTitle, 38, YELLOW)
        tc("SCORE " + overScore, 50, WHITE)
        tc("BEST  " + overBest, 60, GREEN)
        tc("A=RETRY  HOLD B=MENU", 74, CYAN)
    }

    // 统一 HUD（画在顶部 0..9）
    export function hud(title: string, score: number, extra: string, c: number): void {
        r(0, 0, SW, 10, BLACK)
        t(title, 2, 1, c)
        t("SC:" + score, 76, 1, WHITE)
        t(extra, 122, 1, c)
    }

    // 画一个 5x7 的像素小人/图标辅助
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
        } else {                    // 坦克
            r(x + 1, y + 2, 8, 5, GREEN); r(x + 4, y, 2, 3, GREEN)
            r(x + 3, y + 3, 4, 2, BLACK)
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
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 1 ? 4 : cursor - 1
        G.beep(660, 40)
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 4 ? 1 : cursor + 1
        G.beep(660, 40)
    })

    const names = ["SNAKE", "PLATFORM HERO", "RUN & GUN", "TANK BATTLE"]
    const subs = ["GRID CLASSIC", "3 WORLDS / JUMP", "3 STAGES / BOSS", "BASE DEFENSE"]
    let stars: number[] = []
    for (let i = 0; i < 26; i++) {
        stars.push(G.ri(0, 159))
        stars.push(G.ri(0, 119))
    }
    let frame = 0
    game.onShade(function () {
        screen.fill(G.BLACK)
        frame++
        // 星空
        for (let i = 0; i < stars.length; i += 2) {
            const sy = (stars[i + 1] + Math.floor(frame / 6)) % 120
            screen.setPixel(stars[i], sy, (i % 6 === 0) ? G.CYAN : G.DKBLUE)
        }
        G.r(4, 4, 152, 20, G.BLUE)
        G.box(4, 4, 152, 20, G.CYAN)
        G.tc("RETRO 4-IN-1", 9, G.WHITE)
        for (let i = 0; i < 4; i++) {
            const y = 30 + i * 20
            if (cursor === i + 1) {
                G.r(8, y - 2, 144, 17, G.DKBLUE)
                G.box(8, y - 2, 144, 17, G.YELLOW)
            }
            G.pixelIcon(14, y + 1, i)
            G.t("" + (i + 1) + ". " + names[i], 30, y, cursor === i + 1 ? G.YELLOW : G.WHITE)
            G.t(subs[i], 30, y + 8, cursor === i + 1 ? G.ORANGE : G.GRAY)
        }
        G.tc("UP/DOWN  A=PLAY", 110, G.CYAN)
        G.tc("IN GAME: HOLD B 1s = MENU", 102, G.GRAY)
    })
} else if (G.cur === 1) {
    Snake.start()
} else if (G.cur === 2) {
    Platformer.start()
} else if (G.cur === 3) {
    Contra.start()
} else {
    Tanks.start()
}
