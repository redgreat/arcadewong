// ===================================================================
//  2. PLATFORM HERO —— 完整横版动作闯关（原创关卡/美术，玩法致敬经典）
//  3 个世界 / 卷轴镜头 / 重力与长短跳 / 踩敌人 / 顶问号砖 / 金币 /
//  变大与无敌星 / 尖刺与深坑 / 旗帜过关 / 3 条命 / 分数与最高分
// ===================================================================
namespace Platformer {
    const TS = 8
    const ROWS = 15
    const PW = 6
    let W = 96

    let map: string[] = []
    let px = 16
    let py = 94
    let vx = 0
    let vy = 0
    let ph = 10
    let facing = 1
    let onGround = false
    let big = 0
    let invuln = 0
    let dashT = 0
    let cam = 0
    let flagX = 90
    let level = 1
    let lives = 3
    let score = 0
    let coins = 0
    let last = 0
    let clearT = 0
    let frame = 0
    let jumpHold = 0

    let ex: number[] = []
    let ey: number[] = []
    let evx: number[] = []
    let etype: number[] = []
    let ix: number[] = []
    let iy: number[] = []
    let ivx: number[] = []
    let ivy: number[] = []
    let itype: number[] = []

    function getc(x: number, y: number): string {
        if (x < 0 || x >= W || y < 0 || y >= ROWS) return "."
        return map[y].charAt(x)
    }
    function setc(x: number, y: number, c: string): void {
        if (x < 0 || x >= W || y < 0 || y >= ROWS) return
        const s = map[y]
        map[y] = s.substr(0, x) + c + s.substr(x + 1)
    }
    function solid(x: number, y: number): boolean {
        if (x < 0) return true
        if (x >= W || y < 0) return false
        if (y >= ROWS) return false
        const c = getc(x, y)
        return c === "#" || c === "B" || c === "Q" || c === "U" || c === "S" || c === "="
    }
    function collides(x: number, y: number): boolean {
        const x0 = Math.floor(x / TS)
        const x1 = Math.floor((x + PW - 1) / TS)
        const y0 = Math.floor(y / TS)
        const y1 = Math.floor((y + ph - 1) / TS)
        for (let yy = y0; yy <= y1; yy++) {
            for (let xx = x0; xx <= x1; xx++) {
                if (solid(xx, yy)) return true
            }
        }
        return false
    }

    function spawnItem(x: number, y: number, kind: number): void {
        ix.push(x); iy.push(y); ivx.push(kind === 0 ? 26 : 0)
        ivy.push(-40); itype.push(kind)
    }
    function headBump(): void {
        const tx = Math.floor((px + PW / 2) / TS)
        const ty = Math.floor((py - 1) / TS)
        const c = getc(tx, ty)
        if (c === "Q") {
            setc(tx, ty, "U")
            coins++; score += 50
            if ((coins % 3) === 0) spawnItem(tx * TS, ty * TS - 8, 1)
            else spawnItem(tx * TS, ty * TS - 8, 0)
            G.beep(988, 70)
        } else if (c === "B" && big > 0) {
            setc(tx, ty, ".")
            score += 20
            G.beep(220, 60)
        }
    }

    function buildLevel(lv: number): void {
        W = lv === 1 ? 96 : (lv === 2 ? 112 : 128)
        map = []
        for (let y = 0; y < ROWS; y++) {
            let s = ""
            for (let x = 0; x < W; x++) s += "."
            map.push(s)
        }
        let pits: number[] = []
        let plats: number[] = []
        let qs: number[] = []
        let coinsAt: number[] = []
        let foes: number[] = []
        let spikes: number[] = []
        if (lv === 1) {
            pits = [14, 2, 30, 3, 52, 2, 72, 3]
            plats = [20, 9, 4, 40, 8, 3, 60, 10, 5, 80, 9, 4]
            qs = [10, 9, 22, 9, 23, 9, 44, 8, 62, 9, 63, 9, 84, 9]
            coinsAt = [18, 11, 4, 26, 7, 3, 42, 6, 4, 58, 8, 4, 76, 7, 5]
            foes = [16, 12, 0, 34, 12, 0, 48, 12, 1, 66, 12, 0, 86, 12, 1]
            spikes = [38, 39]
            flagX = 92
        } else if (lv === 2) {
            pits = [10, 3, 26, 2, 44, 4, 62, 3, 84, 2, 100, 3]
            plats = [16, 9, 5, 34, 7, 4, 52, 9, 6, 72, 8, 4, 92, 9, 5]
            qs = [8, 9, 20, 8, 21, 8, 38, 6, 56, 8, 57, 8, 76, 9, 96, 8]
            coinsAt = [14, 7, 4, 30, 5, 3, 48, 6, 5, 68, 7, 4, 88, 6, 5, 104, 9, 4]
            foes = [18, 12, 0, 32, 12, 1, 40, 12, 0, 58, 12, 0, 78, 12, 1, 94, 12, 0, 106, 12, 1]
            spikes = [22, 23, 70, 71]
            flagX = 108
        } else {
            pits = [8, 2, 22, 3, 38, 4, 56, 3, 74, 4, 92, 2, 110, 3]
            plats = [14, 8, 4, 30, 9, 5, 48, 7, 4, 64, 9, 5, 84, 8, 4, 100, 9, 5, 116, 8, 4]
            qs = [6, 9, 18, 8, 19, 8, 34, 7, 52, 8, 53, 8, 68, 9, 88, 8, 104, 8, 105, 8]
            coinsAt = [12, 6, 4, 26, 5, 4, 42, 5, 5, 60, 6, 5, 78, 6, 4, 96, 5, 5, 114, 6, 5]
            foes = [16, 12, 0, 28, 12, 1, 34, 12, 0, 50, 12, 0, 62, 12, 1, 80, 12, 0, 90, 12, 1, 108, 12, 0, 120, 12, 1]
            spikes = [44, 45, 86, 87]
            flagX = 124
        }
        // 地面
        for (let x = 0; x < W; x++) {
            let hole = false
            for (let i = 0; i < pits.length; i += 2) {
                if (x >= pits[i] && x < pits[i] + pits[i + 1]) hole = true
            }
            if (!hole) { setc(x, 13, "#"); setc(x, 14, "#") }
        }
        for (let i = 0; i < spikes.length; i++) setc(spikes[i], 13, "^")
        // 砖平台
        for (let i = 0; i < plats.length; i += 3) {
            for (let k = 0; k < plats[i + 2]; k++) {
                setc(plats[i] + k, plats[i + 1], (k % 4 === 1) ? "Q" : "B")
            }
        }
        for (let i = 0; i < qs.length; i += 2) setc(qs[i], qs[i + 1], "Q")
        for (let i = 0; i < coinsAt.length; i += 3) {
            for (let k = 0; k < coinsAt[i + 2]; k++) setc(coinsAt[i] + k, coinsAt[i + 1], "C")
        }
        // 旗杆
        for (let y = 5; y <= 12; y++) setc(flagX, y, "F")
        // 敌人
        ex = []; ey = []; evx = []; etype = []
        for (let i = 0; i < foes.length; i += 3) {
            ex.push(foes[i] * TS); ey.push(foes[i + 1] * TS)
            evx.push(foes[i + 2] === 0 ? -18 : -30)
            etype.push(foes[i + 2])
        }
        ix = []; iy = []; ivx = []; ivy = []; itype = []
        px = 16; py = 94; vx = 0; vy = 0; cam = 0
        ph = big > 0 ? 14 : 10
        clearT = 0
    }

    function hurt(): void {
        if (invuln > 0) return
        if (big > 0) { big = 0; ph = 10; py += 4 }
        else lives--
        invuln = 1600
        vy = -90
        G.beep(140, 180)
        if (lives <= 0) G.setOver("PLATFORM HERO", score, "platbest")
    }

    function update(dt: number): void {
        if (G.isOver || clearT > 0) return
        // 输入
        const dir = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0)
        if (dir !== 0) facing = dir
        let spd = dashT > 0 ? 108 : 68
        if (big > 0) spd += 6
        if (dir !== 0) vx = vx + dir * 700 * dt
        else vx = vx * 0.72
        if (vx > spd) vx = spd
        if (vx < -spd) vx = -spd
        if (dashT > 0) dashT -= dt * 1000
        if (jumpHold > 0) jumpHold -= dt * 1000

        // 重力（按住 A 跳得更高）
        let g = 460
        if (vy < 0 && controller.A.isPressed() && jumpHold > 0) g = 210
        vy += g * dt
        if (vy > 230) vy = 230

        // X 轴
        const nx = px + vx * dt
        if (nx < 0) { px = 0; vx = 0 }
        else if (!collides(nx, py)) px = nx
        else vx = 0
        // Y 轴
        const ny = py + vy * dt
        if (!collides(px, ny)) { py = ny; onGround = false }
        else {
            if (vy > 0) onGround = true
            else headBump()
            vy = 0
        }
        if (py > 128) {
            lives--
            G.beep(140, 200)
            if (lives <= 0) { G.setOver("PLATFORM HERO", score, "platbest"); return }
            px = 16; py = 94; vx = 0; vy = 0; cam = 0; invuln = 1200
        }

        // 金币 / 尖刺 / 旗帜（扫描玩家所在 2x3 格）
        const cx0 = Math.floor(px / TS), cx1 = Math.floor((px + PW) / TS)
        const cy0 = Math.floor(py / TS), cy1 = Math.floor((py + ph) / TS)
        for (let yy = cy0; yy <= cy1; yy++) {
            for (let xx = cx0; xx <= cx1; xx++) {
                const c = getc(xx, yy)
                if (c === "C") {
                    setc(xx, yy, ".")
                    coins++; score += 10
                    G.beep(1046, 45)
                } else if (c === "^") {
                    if (G.hit(px, py, PW, ph, xx * TS, yy * TS + 3, TS, 5)) hurt()
                } else if (c === "F" && px > flagX * TS - 10) {
                    score += 200
                    clearT = 1900
                    G.beep(660, 200)
                }
            }
        }

        // 敌人
        for (let i = ex.length - 1; i >= 0; i--) {
            const nx2 = ex[i] + evx[i] * dt
            const footX = Math.floor((nx2 + (evx[i] > 0 ? 8 : 0)) / TS)
            const footY = Math.floor((ey[i] + 9) / TS)
            if (solid(Math.floor((nx2 + (evx[i] > 0 ? 8 : 0)) / TS), Math.floor((ey[i] + 4) / TS))
                || !solid(footX, footY)) evx[i] = -evx[i]
            else ex[i] = nx2
            if (ex[i] < 0) { ex.splice(i, 1); ey.splice(i, 1); evx.splice(i, 1); etype.splice(i, 1); continue }
            if (G.hit(px, py, PW, ph, ex[i], ey[i], 8, 8)) {
                if (vy > 20 && py + ph - ey[i] < 7) {
                    score += 100; vy = -105; onGround = false
                    ex.splice(i, 1); ey.splice(i, 1); evx.splice(i, 1); etype.splice(i, 1)
                    G.beep(330, 70)
                } else hurt()
            }
        }
        // 道具
        for (let i = ix.length - 1; i >= 0; i--) {
            ivy[i] += 320 * dt
            const nx3 = ix[i] + ivx[i] * dt
            if (!solid(Math.floor((nx3 + 4) / TS), Math.floor((iy[i] + 4) / TS))) ix[i] = nx3
            else ivx[i] = -ivx[i]
            const ny2 = iy[i] + ivy[i] * dt
            if (!solid(Math.floor((ix[i] + 4) / TS), Math.floor((ny2 + 8) / TS))) iy[i] = ny2
            else { iy[i] = Math.floor(ny2 / TS) * TS - 8; ivy[i] = itype[i] === 1 ? -110 : 0 }
            if (G.hit(px, py, PW, ph, ix[i], iy[i], 8, 8)) {
                if (itype[i] === 0) { big = 1; ph = 14; py -= 4; score += 100 }
                else { invuln = 6000; score += 200 }
                ix.splice(i, 1); iy.splice(i, 1); ivx.splice(i, 1); ivy.splice(i, 1); itype.splice(i, 1)
                G.beep(1318, 130)
            } else if (iy[i] > 130) {
                ix.splice(i, 1); iy.splice(i, 1); ivx.splice(i, 1); ivy.splice(i, 1); itype.splice(i, 1)
            }
        }

        if (invuln > 0) invuln -= dt * 1000
        cam = G.clamp(px - 58, 0, W * TS - 160)
    }

    function drawTile(x: number, y: number, c: string, sx: number): void {
        if (c === "#") {
            G.r(sx, y, TS, TS, G.BROWN)
            G.r(sx, y, TS, 2, G.GREEN)
            G.line(sx + 3, y + 4, sx + 6, y + 4, G.DKRED)
        } else if (c === "B") {
            G.r(sx, y, TS, TS, G.ORANGE)
            G.line(sx, y + 3, sx + 7, y + 3, G.DKRED)
            G.line(sx + 4, y, sx + 4, y + 3, G.DKRED)
            G.line(sx + 2, y + 4, sx + 2, y + 7, G.DKRED)
            G.line(sx + 6, y + 4, sx + 6, y + 7, G.DKRED)
        } else if (c === "Q") {
            G.r(sx, y, TS, TS, G.YELLOW)
            G.box(sx, y, TS, TS, G.ORANGE)
            G.t("?", sx + 2, y, G.RED)
        } else if (c === "U") {
            G.r(sx, y, TS, TS, G.BROWN)
            G.box(sx, y, TS, TS, G.DKRED)
        } else if (c === "S") {
            G.r(sx, y, TS, TS, G.GRAY)
            G.box(sx, y, TS, TS, G.WHITE)
        } else if (c === "=") {
            G.r(sx, y, TS, 3, G.ORANGE)
        } else if (c === "C") {
            const bob = (frame % 24) < 12 ? 0 : 1
            G.r(sx + 2, y + bob, 4, 7, G.YELLOW)
            G.r(sx + 3, y + 1 + bob, 2, 5, G.WHITE)
        } else if (c === "^") {
            G.r(sx, y + 4, TS, 4, G.GRAY)
            for (let k = 0; k < 2; k++) {
                G.line(sx + k * 4 + 2, y, sx + k * 4, y + 5, G.WHITE)
                G.line(sx + k * 4 + 2, y, sx + k * 4 + 4, y + 5, G.WHITE)
            }
        } else if (c === "F") {
            G.r(sx + 3, y, 2, TS, G.WHITE)
        }
    }

    function draw(): void {
        screen.fill(G.CYAN)
        // 远山视差
        for (let i = 0; i < 8; i++) {
            const hx = i * 46 - Math.floor(cam / 4) % 368
            const xx = hx < -40 ? hx + 368 : hx
            G.r(xx, 88, 30, 16, G.TEAL)
            G.r(xx + 10, 80, 10, 8, G.TEAL)
        }
        // 云
        for (let i = 0; i < 5; i++) {
            const cxp = (i * 44 - Math.floor(cam / 3)) % 220
            const xx = cxp < -20 ? cxp + 220 : cxp
            G.r(xx, 20 + (i % 3) * 12, 16, 4, G.WHITE)
            G.r(xx + 4, 17 + (i % 3) * 12, 8, 4, G.WHITE)
        }
        // 地面基线
        G.r(0, 112, 160, 8, G.GREEN)
        // 地图
        const c0 = Math.floor(cam / TS) - 1
        const c1 = c0 + 22
        for (let y = 1; y < ROWS; y++) {
            for (let x = c0; x <= c1; x++) {
                const c = getc(x, y)
                if (c !== "." && c !== "P") drawTile(x, y * TS, c, x * TS - cam)
            }
        }
        // 旗子
        const fx = flagX * TS - cam
        if (fx > -10 && fx < 170) {
            G.r(fx, 40, 8, 8, G.RED)
            G.r(fx + 2, 42, 4, 4, G.WHITE)
            G.r(fx - 1, 38, 10, 2, G.YELLOW)
        }
        // 道具
        for (let i = 0; i < ix.length; i++) {
            const sx = ix[i] - cam
            if (itype[i] === 0) {
                G.r(sx, iy[i] + 3, 8, 5, G.RED)
                G.r(sx + 1, iy[i] + 1, 6, 3, G.WHITE)
                G.r(sx + 2, iy[i] + 4, 1, 1, G.BLACK)
                G.r(sx + 5, iy[i] + 4, 1, 1, G.BLACK)
            } else {
                const c = (frame % 12) < 6 ? G.YELLOW : G.WHITE
                G.r(sx + 2, iy[i], 4, 8, c)
                G.r(sx, iy[i] + 2, 8, 4, c)
            }
        }
        // 敌人
        for (let i = 0; i < ex.length; i++) {
            const sx = ex[i] - cam
            if (sx < -10 || sx > 165) continue
            const sy = ey[i]
            if (etype[i] === 0) {
                G.r(sx, sy + 2, 8, 6, G.BROWN)
                G.r(sx + 1, sy, 6, 3, G.BROWN)
                G.r(sx + 1, sy + 4, 2, 2, G.WHITE)
                G.r(sx + 5, sy + 4, 2, 2, G.WHITE)
                G.r(sx, sy + 7, 3, 1, G.BLACK)
                G.r(sx + 5, sy + 7, 3, 1, G.BLACK)
            } else {
                G.r(sx, sy + 1, 8, 7, G.GREEN)
                G.r(sx + 2, sy, 5, 3, G.GREEN)
                G.r(sx + 5, sy + 3, 2, 2, G.WHITE)
            }
        }
        // 玩家
        if (invuln <= 0 || (frame % 8) < 4) {
            const sx = px - cam
            const sy = py
            const h = ph
            if (big > 0) G.r(sx, sy + 5, PW, h - 7, G.BLUE)
            G.r(sx, sy + 1, PW, 3, G.RED)                 // 帽子
            G.r(sx + (facing > 0 ? 3 : -2), sy + 2, 5, 1, G.RED)
            G.r(sx + 1, sy + 4, 4, 3, G.ORANGE)           // 脸
            G.r(sx + (facing > 0 ? 4 : 1), sy + 5, 1, 1, G.BLACK)
            if (big > 0) G.r(sx, sy + 8, PW, h - 9, G.BLUE)
            G.r(sx - 1, sy + h - 2, 3, 2, G.BLACK)
            G.r(sx + 4, sy + h - 2, 3, 2, G.BLACK)
        }
        // HUD
        G.r(0, 0, 160, 10, G.BLACK)
        G.t("W" + level + "-1", 2, 1, G.YELLOW)
        G.t("SC:" + score, 36, 1, G.WHITE)
        G.t("C:" + coins, 88, 1, G.YELLOW)
        G.t("L:" + lives, 118, 1, G.RED)
        G.t(big > 0 ? "BIG" : "SML", 140, 1, invuln > 0 ? G.CYAN : G.GRAY)
        if (clearT > 0) {
            G.r(24, 46, 112, 26, G.BLUE)
            G.tc("WORLD CLEAR!", 50, G.WHITE)
            G.tc("+" + 200, 60, G.YELLOW)
        }
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        level = 1; lives = 3; score = 0; coins = 0; big = 0
        ph = 10; invuln = 0; frame = 0; clearT = 0
        buildLevel(1)
        last = control.millis()
        scene.setBackgroundColor(G.CYAN)

        controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
            if (!G.isOver && clearT <= 0 && onGround) {
                vy = -158; onGround = false; jumpHold = 260
                G.beep(520, 70)
            }
        })
        controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
            if (!G.isOver) { dashT = 260; G.beep(300, 40) }
        })

        game.onShade(function () {
            frame++
            const now = control.millis()
            let dt = (now - last) / 1000
            last = now
            if (dt > 0.04) dt = 0.04
            if (dt < 0) dt = 0
            if (clearT > 0) {
                clearT -= dt * 1000
                if (clearT <= 0) {
                    if (level >= 3) G.setOver("PLATFORM HERO", score, "platbest")
                    else { level++; buildLevel(level) }
                }
            } else update(dt)
            draw()
        })
    }
}
