// ===================================================================
//  1. SNAKE  —— 完整贪吃蛇
//  20x13 网格 / 4 套关卡障碍 / 穿墙开关 / 加速 / 金色奖励食物 /
//  最高分写入 Flash / A 暂停 / 长按 B 回菜单
// ===================================================================
namespace Snake {
    const CELL = 8
    const COLS = 20
    const ROWS = 13
    const TOP = 16

    // 4 套障碍布局，'.' 空 '#' 砖墙（每串 20 字符 x 13 行）
    const MAPS: string[][] = [
        ["....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "...................."],
        ["....................",
        "....#..........#....",
        "....#..........#....",
        "....#..........#....",
        "....................",
        "....................",
        "....................",
        "....................",
        "....#..........#....",
        "....#..........#....",
        "....#..........#....",
        "....................",
        "...................."],
        ["....................",
        "......########......",
        "......#......#......",
        "......#......#......",
        "....................",
        "..##..............##",
        "..##..............##",
        "....................",
        "......#......#......",
        "......#......#......",
        "......########......",
        "....................",
        "...................."],
        ["....................",
        "..####........####..",
        "....................",
        ".......######.......",
        ".......#....#.......",
        ".......#....#.......",
        "....................",
        ".......#....#.......",
        ".......#....#.......",
        ".......######.......",
        "....................",
        "..####........####..",
        "...................."]
    ]

    let bx: number[] = []
    let by: number[] = []
    let dx = 1
    let dy = 0
    let ndx = 1
    let ndy = 0
    let turned = false
    let fx = 8
    let fy = 6
    let goldx = -1
    let goldy = -1
    let goldT = 0
    let score = 0
    let level = 1
    let grow = 0
    let walls: number[] = []
    let last = 0
    let step = 175
    let paused = false
    let frame = 0
    let wrap = true

    function wallAt(x: number, y: number): boolean {
        return walls.indexOf(x + y * 32) >= 0
    }
    function bodyAt(x: number, y: number): boolean {
        for (let i = 0; i < bx.length; i++) {
            if (bx[i] === x && by[i] === y) return true
        }
        return false
    }
    function buildWalls(lv: number): void {
        walls = []
        const m = MAPS[(lv - 1) % MAPS.length]
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (m[y].charAt(x) === "#") walls.push(x + y * 32)
            }
        }
    }
    function placeFood(): void {
        let tries = 0
        while (tries < 300) {
            const x = G.ri(0, COLS - 1)
            const y = G.ri(0, ROWS - 1)
            if (!wallAt(x, y) && !bodyAt(x, y) && !(x === fx && y === fy)) {
                fx = x; fy = y; return
            }
            tries++
        }
    }
    function placeGold(): void {
        let tries = 0
        while (tries < 300) {
            const x = G.ri(0, COLS - 1)
            const y = G.ri(0, ROWS - 1)
            if (!wallAt(x, y) && !bodyAt(x, y) && !(x === fx && y === fy)) {
                goldx = x; goldy = y; goldT = 7000; return
            }
            tries++
        }
    }
    function resetSnake(): void {
        bx = [4, 3, 2]
        by = [6, 6, 6]
        dx = 1; dy = 0; ndx = 1; ndy = 0
        turned = false
        grow = 0
    }
    function nextLevel(): void {
        level++
        buildWalls(level)
        resetSnake()
        placeFood()
        goldx = -1
        G.beep(523, 90)
    }

    function die(): void {
        G.setOver("SNAKE", score, "snkbest")
        G.beep(110, 260)
    }

    function move(): void {
        dx = ndx; dy = ndy
        turned = false
        let hx = bx[bx.length - 1] + dx
        let hy = by[by.length - 1] + dy
        if (wrap) {
            if (hx < 0) hx = COLS - 1
            if (hx >= COLS) hx = 0
            if (hy < 0) hy = ROWS - 1
            if (hy >= ROWS) hy = 0
        } else if (hx < 0 || hx >= COLS || hy < 0 || hy >= ROWS) {
            die(); return
        }
        if (wallAt(hx, hy)) { die(); return }
        // 撞到自己（尾巴那一格如果是本帧要移走的，可以进）
        const tailWillMove = grow === 0
        for (let i = 0; i < bx.length; i++) {
            if (tailWillMove && i === 0) continue
            if (bx[i] === hx && by[i] === hy) { die(); return }
        }
        bx.push(hx); by.push(hy)
        if (grow > 0) grow--
        else { bx.shift(); by.shift() }

        if (hx === fx && hy === fy) {
            score += 10
            grow += 1
            G.beep(880, 60)
            placeFood()
            if (score % 60 === 0) { nextLevel(); return }
            if (score % 50 === 10 && goldx < 0) placeGold()
        }
        if (goldx >= 0 && hx === goldx && hy === goldy) {
            score += 50
            grow += 2
            goldx = -1
            G.beep(1175, 120)
        }
    }

    function drawBrick(x: number, y: number, w: number, h: number, c1: number, c2: number): void {
        G.r(x, y, w, h, c1)
        G.line(x, y + 3, x + w - 1, y + 3, c2)
        G.line(x + w / 2, y, x + w / 2, y + 3, c2)
    }

    function draw(): void {
        screen.fill(G.BLACK)
        // HUD
        G.r(0, 0, 160, 10, G.BLACK)
        G.t("SNAKE", 2, 1, G.GREEN)
        G.t("SC:" + score, 56, 1, G.WHITE)
        G.t("LV:" + level, 100, 1, G.CYAN)
        G.t("B:" + (settings.readNumber("snkbest") || 0), 130, 1, G.YELLOW)
        G.line(0, 11, 159, 11, G.BLUE)
        // 边框
        G.box(0, TOP - 1, COLS * CELL, ROWS * CELL + 2, G.DKBLUE)
        // 网格点
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                screen.setPixel(x * CELL, y * CELL + TOP, G.DKBLUE)
            }
        }
        // 墙
        for (let i = 0; i < walls.length; i++) {
            const wx = walls[i] % 32
            const wy = Math.floor(walls[i] / 32)
            drawBrick(wx * CELL, wy * CELL + TOP, CELL, CELL, G.BROWN, G.DKRED)
        }
        // 食物
        const pulse = (frame % 20) < 10
        G.r(fx * CELL + 2, fy * CELL + TOP + 2, 5, 5, pulse ? G.RED : G.PINK)
        G.r(fx * CELL + 4, fy * CELL + TOP, 2, 2, G.GREEN)
        if (goldx >= 0 && (frame % 12) < 8) {
            G.r(goldx * CELL + 1, goldy * CELL + TOP + 1, 6, 6, G.YELLOW)
            G.r(goldx * CELL + 3, goldy * CELL + TOP + 3, 2, 2, G.WHITE)
        }
        // 蛇身
        for (let i = 0; i < bx.length; i++) {
            const px = bx[i] * CELL
            const py = by[i] * CELL + TOP
            const head = i === bx.length - 1
            const c = head ? G.GREEN : (i % 2 === 0 ? G.TEAL : G.GREEN)
            G.r(px, py, CELL - 1, CELL - 1, c)
            if (!head) G.r(px + 2, py + 2, 2, 2, G.CYAN)
            else {
                // 眼睛朝当前方向
                if (dx !== 0) {
                    G.r(px + (dx > 0 ? 5 : 1), py + 1, 1, 1, G.WHITE)
                    G.r(px + (dx > 0 ? 5 : 1), py + 5, 1, 1, G.WHITE)
                } else {
                    G.r(px + 1, py + (dy > 0 ? 5 : 1), 1, 1, G.WHITE)
                    G.r(px + 5, py + (dy > 0 ? 5 : 1), 1, 1, G.WHITE)
                }
            }
        }
        if (paused) {
            G.r(40, 52, 80, 20, G.BLUE)
            G.tc("PAUSED", 57, G.WHITE)
        }
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        score = 0
        level = 1
        wrap = true
        goldx = -1
        paused = false
        frame = 0
        buildWalls(level)
        resetSnake()
        placeFood()
        last = control.millis()
        scene.setBackgroundColor(G.BLACK)

        controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
            if (!G.isOver) { paused = !paused; G.beep(440, 50) }
        })

        game.onShade(function () {
            frame++
            const now = control.millis()
            if (goldT > 0) {
                goldT -= 20
                if (goldT <= 0) goldx = -1
            }
            if (!G.isOver && !paused) {
                // 方向输入：不能 180 度掉头，每个移动周期只接受一次转向
                if (!turned) {
                    if (controller.left.isPressed() && dx !== 1) { ndx = -1; ndy = 0; turned = true }
                    else if (controller.right.isPressed() && dx !== -1) { ndx = 1; ndy = 0; turned = true }
                    else if (controller.up.isPressed() && dy !== 1) { ndx = 0; ndy = -1; turned = true }
                    else if (controller.down.isPressed() && dy !== -1) { ndx = 0; ndy = 1; turned = true }
                }
                step = Math.max(65, 175 - (level - 1) * 14 - Math.floor(score / 25))
                if (now - last >= step) { last = now; move() }
            }
            draw()
        })
    }
}
