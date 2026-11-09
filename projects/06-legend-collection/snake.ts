// ===================================================================
//  1. SNAKE  —— 完整贪吃蛇
//  20x13 网格 / 4 套关卡障碍 / 穿墙开关 / 加速 / 金色奖励食物 /
//  最高分写入 Flash / A 暂停 / 长按 B 回菜单
// ===================================================================
namespace Snake {
    const CELL = 8
    const COLS = 20
    const ROWS = 13
    const TOP = 14

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
    let introT = 0              // 开局操作卡倒计时
    let msg = ""
    let msgT = 0

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
    // 蛇头是数组最后一位。尾巴在前、头在后，朝向右侧才走得出去。
    function resetSnake(): void {
        // 找一处「横着 4 格全空」的地方放蛇，避免复活就贴墙
        for (let y = 6; y < ROWS; y++) {
            for (let x = 1; x < COLS - 3; x++) {
                if (!wallAt(x, y) && !wallAt(x + 1, y) && !wallAt(x + 2, y) && !wallAt(x + 3, y)) {
                    bx = [x, x + 1, x + 2]
                    by = [y, y, y]
                    dx = 1; dy = 0; ndx = 1; ndy = 0
                    turned = false
                    grow = 0
                    return
                }
            }
        }
        bx = [2, 3, 4]
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
        msg = "LEVEL " + level
        msgT = 900
        G.beep(523, 90)
    }

    // 无限生命：撞墙 / 撞自己只是「退回三节」，不结束游戏
    function crash(): void {
        G.beep(110, 240)
        if (score >= 10) score -= 10
        resetSnake()
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
            crash(); return
        }
        if (wallAt(hx, hy)) { crash(); return }
        // 撞到自己（尾巴那一格如果是本帧要移走的，可以进）
        const tailWillMove = grow === 0
        for (let i = 0; i < bx.length; i++) {
            if (tailWillMove && i === 0) continue
            if (bx[i] === hx && by[i] === hy) { crash(); return }
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

    // 木箱式砖墙：深色底 + 木板缝 + 顶部高光
    function drawBrick(x: number, y: number, w: number, h: number): void {
        G.r(x, y, w, h, G.WOOD)
        G.r(x, y, w, 1, G.ORANGE)
        G.r(x, y, 1, h, G.ORANGE)
        G.r(x, y + 4, w, 1, G.DKGRAY)
        G.r(x + 3, y + 1, 1, 3, G.DKGRAY)
        G.r(x + 6, y + 5, 1, 3, G.DKGRAY)
    }

    function draw(): void {
        screen.fill(G.BLACK)
        // ---- 场地：深蓝网格（每格 8px），上下各一条暗青边框 ----
        for (let x = 0; x <= COLS; x++) G.r(x * CELL, TOP, 1, ROWS * CELL, G.BLUE)
        for (let y = 0; y <= ROWS; y++) G.r(0, TOP + y * CELL, COLS * CELL, 1, G.BLUE)
        G.r(0, TOP - 2, 160, 2, G.TEAL)
        G.r(0, TOP + ROWS * CELL, 160, 2, G.TEAL)
        // 墙
        for (let i = 0; i < walls.length; i++) {
            const wx = walls[i] % 32
            const wy = Math.floor(walls[i] / 32)
            drawBrick(wx * CELL, wy * CELL + TOP, CELL, CELL)
        }
        // ---- 食物：苹果（红果 + 高光 + 绿叶 + 呼吸光环）----
        const pulse = (frame % 20) < 10
        const apx = fx * CELL, apy = fy * CELL + TOP
        if (pulse) G.box(apx + 1, apy + 1, 6, 6, G.DKGRAY)
        G.r(apx + 2, apy + 2, 5, 5, pulse ? G.RED : G.PINK)
        G.r(apx + 3, apy + 3, 1, 1, G.WHITE)
        G.r(apx + 4, apy, 1, 2, G.GREEN)
        G.r(apx + 5, apy, 2, 1, G.GREEN)
        // 金苹果：闪烁的十字星
        if (goldx >= 0 && (frame % 12) < 8) {
            const gx2 = goldx * CELL, gy2 = goldy * CELL + TOP
            G.r(gx2 + 1, gy2 + 3, 6, 2, G.YELLOW)
            G.r(gx2 + 3, gy2 + 1, 2, 6, G.YELLOW)
            G.r(gx2 + 2, gy2 + 2, 4, 4, G.ORANGE)
            G.r(gx2 + 3, gy2 + 3, 2, 2, G.WHITE)
        }
        // ---- 蛇：亮绿身体 + 青色鳞点，蛇头带白眼睛 ----
        for (let i = 0; i < bx.length; i++) {
            const px2 = bx[i] * CELL
            const py2 = by[i] * CELL + TOP
            const head = i === bx.length - 1
            if (head) {
                G.r(px2, py2, CELL - 1, CELL - 1, G.GREEN)
                G.r(px2 + 1, py2 + 1, CELL - 3, CELL - 3, G.TEAL)
                if (dx !== 0) {
                    G.r(px2 + (dx > 0 ? 5 : 1), py2 + 1, 1, 2, G.WHITE)
                    G.r(px2 + (dx > 0 ? 5 : 1), py2 + 5, 1, 2, G.WHITE)
                } else {
                    G.r(px2 + 1, py2 + (dy > 0 ? 5 : 1), 2, 1, G.WHITE)
                    G.r(px2 + 5, py2 + (dy > 0 ? 5 : 1), 2, 1, G.WHITE)
                }
            } else {
                G.r(px2, py2, CELL - 1, CELL - 1, i % 2 === 0 ? G.GREEN : G.TEAL)
                G.r(px2 + 3, py2 + 3, 2, 2, G.BLUE)
            }
        }
        // ---- HUD ----
        G.hudTop(G.GREEN)
        G.t("LV " + level, 2, 1, G.CYAN)
        G.tr("SC " + G.sc(score), 96, 1, G.WHITE)
        G.tr("HI " + G.sc(settings.readNumber("snkbest") || 0), 158, 1, G.YELLOW)
        // ---- 浮层：暂停 / 升级 ----
        if (paused) {
            G.panel(44, 50, 72, 28, G.CYAN, G.BLUE)
            G.tc("PAUSED", 56, G.WHITE)
            G.tc("A=RESUME", 68, G.GRAY)
        } else if (msgT > 0) {
            G.panel(52, 52, 56, 18, G.YELLOW, G.DKGRAY)
            G.tc(msg, 58, G.YELLOW)
        }
        if (introT > 0 && !paused && msgT <= 0) G.introCard("SNAKE", "D-PAD = STEER", "A = PAUSE", G.GREEN)
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
        introT = 2600
        msg = ""
        msgT = 0
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
            if (introT > 0) introT -= 20
            if (msgT > 0) msgT -= 20
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
