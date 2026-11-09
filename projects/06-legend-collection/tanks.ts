// ===================================================================
//  4. TANK BATTLE —— 完整俯视坦克攻防（原创地图/美术，玩法致敬经典）
//  13x13 战场 / 砖墙四段破坏 / 钢墙·水·草丛 / 老鹰基地 /
//  4 关 4 种 AI 敌坦克 / 6 种道具 / 火力升级 / 护盾·冻结·钢化基地
// ===================================================================
namespace Tanks {
    const TS = 8
    const N = 13
    const OX = 4
    const OY = 14
    const DX = [0, 1, 0, -1]
    const DY = [-1, 0, 1, 0]

    const MAPS: string[][] = [
        [".............",
        "..BB.....BB..",
        "..BB.....BB..",
        "..BB..S..BB..",
        "..BB.....BB..",
        "....BB.BB....",
        ".S.........S.",
        "....BB.BB....",
        "..BB.....BB..",
        "..BB..B..BB..",
        "..BB.....BB..",
        "...BB...BB...",
        "............."],
        [".............",
        "..SS.GGG.SS..",
        "..SS.GGG.SS..",
        ".....GGG.....",
        ".BB.......BB.",
        ".BB.WWWWW.BB.",
        ".....WWW.....",
        ".BB..WWW..BB.",
        ".BB.......BB.",
        "..GG..B..GG..",
        "..GG.....GG..",
        ".....BBB.....",
        "............."],
        [".............",
        ".B.B.B.B.B.B.",
        ".B.B.B.B.B.B.",
        "....S...S....",
        "BB..S...S..BB",
        "BB.........BB",
        "..WW.....WW..",
        "BB.........BB",
        "BB..S...S..BB",
        "....S...S....",
        ".G.G.G.G.G.G.",
        "..BBB...BBB..",
        "............."],
        [".............",
        "..WW.....WW..",
        "..WW.BBB.WW..",
        ".....BSB.....",
        ".BB..BBB..BB.",
        ".BB.......BB.",
        "SS..GGGGG..SS",
        ".BB.......BB.",
        ".BB..BBB..BB.",
        ".....BSB.....",
        "..GG.....GG..",
        "...BB...BB...",
        "............."]
    ]

    let map: string[] = []
    let brickHp: number[] = []
    let px = 32
    let py = 96
    let pdir = 0
    let pcd = 0
    let grade = 0
    let shield = 0
    let score = 0
    let stage = 1
    let remaining = 0
    let spawnT = 0
    let freezeT = 0
    let steelT = 0
    let clearT = 0
    let frame = 0
    let last = 0
    let baseLost = false
    let spawnCount = 0
    let introT = 0

    let ex: number[] = []
    let ey: number[] = []
    let edir: number[] = []
    let ecd: number[] = []
    let etype: number[] = []
    let ehp: number[] = []
    let eflash: number[] = []
    let bx: number[] = []
    let by: number[] = []
    let bdx: number[] = []
    let bdy: number[] = []
    let bown: number[] = []
    let bpow: number[] = []
    let ux: number[] = []
    let uy: number[] = []
    let ut: number[] = []
    let fx: number[] = []
    let fy: number[] = []
    let ft: number[] = []

    function getc(x: number, y: number): string {
        if (x < 0 || x >= N || y < 0 || y >= N) return "S"
        return map[y].charAt(x)
    }
    function setc(x: number, y: number, c: string): void {
        if (x < 0 || x >= N || y < 0 || y >= N) return
        const s = map[y]
        map[y] = s.substr(0, x) + c + s.substr(x + 1)
    }
    function bhp(x: number, y: number): number {
        if (x < 0 || x >= N || y < 0 || y >= N) return 0
        return brickHp[x + y * N]
    }
    function setBhp(x: number, y: number, v: number): void {
        brickHp[x + y * N] = v
    }
    function blocked(x: number, y: number, w: number, h: number): boolean {
        const x0 = Math.floor(x / TS)
        const x1 = Math.floor((x + w - 1) / TS)
        const y0 = Math.floor(y / TS)
        const y1 = Math.floor((y + h - 1) / TS)
        for (let yy = y0; yy <= y1; yy++) {
            for (let xx = x0; xx <= x1; xx++) {
                if (xx < 0 || xx >= N || yy < 0 || yy >= N) return true
                const c = getc(xx, yy)
                if (c === "S" || c === "W" || c === "X") return true
                if (c === "B" && bhp(xx, yy) > 0) return true
            }
        }
        return false
    }
    function freeAt(x: number, y: number): boolean {
        for (let i = 0; i < ex.length; i++) {
            if (G.hit(x, y, 8, 8, ex[i], ey[i], 8, 8)) return false
        }
        if (G.hit(x, y, 8, 8, px, py, 8, 8)) return false
        return !blocked(x, y, 8, 8)
    }

    function fire(owner: number, x: number, y: number, dir: number, power: number): void {
        if (bx.length > 40) return
        const cx = x + 4 + DX[dir] * 5
        const cy = y + 4 + DY[dir] * 5
        bx.push(cx); by.push(cy)
        bdx.push(DX[dir] * (owner === 0 ? 105 + grade * 15 : 82))
        bdy.push(DY[dir] * (owner === 0 ? 105 + grade * 15 : 82))
        bown.push(owner); bpow.push(power)
        G.beep(owner === 0 ? 740 : 300, 35)
    }
    function boom(x: number, y: number, big: number): void {
        fx.push(x); fy.push(y); ft.push(big > 0 ? 20 : 10)
        G.beep(big > 0 ? 90 : 160, big > 0 ? 160 : 60)
    }
    function drop(x: number, y: number): void {
        ux.push(G.clamp(x, 4, 92)); uy.push(G.clamp(y, 4, 92))
        ut.push(G.ri(0, 5))
    }
    function respawn(): void {
        px = 32; py = 96; pdir = 0; shield = 2500
    }
    // 无限生命：坦克炸了就地重生，不结束
    function loseTank(): void {
        if (shield > 0 || G.isOver) return
        boom(px, py, 1)
        respawn()
    }
    function applyPower(kind: number): void {
        if (kind === 0) { grade = Math.min(3, grade + 1); score += 100 }
        else if (kind === 1) { shield = 7000; score += 100 }
        else if (kind === 2) { freezeT = 6000; score += 100 }
        else if (kind === 3) {
            score += ex.length * 200
            for (let i = 0; i < ex.length; i++) boom(ex[i], ey[i], 1)
            ex = []; ey = []; edir = []; ecd = []; etype = []; ehp = []; eflash = []
        } else if (kind === 4) { steelT = 10000; score += 100; steelBase(true) }
        else { score += 400 }
        G.beep(1318, 130)
    }
    function steelBase(on: boolean): void {
        const tiles = [5, 6, 7]
        for (let i = 0; i < 3; i++) {
            setc(tiles[i], 11, on ? "S" : "B")
            if (!on) setBhp(tiles[i], 11, 4)
        }
        setc(5, 12, on ? "S" : "B")
        setc(7, 12, on ? "S" : "B")
        if (!on) { setBhp(5, 12, 4); setBhp(7, 12, 4) }
    }

    function buildStage(s: number): void {
        const m = MAPS[(s - 1) % 4]
        map = []
        brickHp = []
        for (let y = 0; y < N; y++) map.push(m[y])
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) brickHp.push(getc(x, y) === "B" ? 4 : 0)
        }
        // 老鹰基地 + 周围砖墙
        setc(6, 12, "X")
        setc(5, 12, "B"); setc(7, 12, "B")
        setc(5, 11, "B"); setc(6, 11, "B"); setc(7, 11, "B")
        setBhp(5, 12, 4); setBhp(7, 12, 4)
        setBhp(5, 11, 4); setBhp(6, 11, 4); setBhp(7, 11, 4)
        ex = []; ey = []; edir = []; ecd = []; etype = []; ehp = []; eflash = []
        bx = []; by = []; bdx = []; bdy = []; bown = []; bpow = []
        ux = []; uy = []; ut = []
        fx = []; fy = []; ft = []
        remaining = 10 + s * 4
        spawnCount = 0
        spawnT = 300
        shield = 2200
        freezeT = 0; steelT = 0; clearT = 0
        baseLost = false
        px = 32; py = 96; pdir = 0
    }

    function spawnEnemy(): void {
        const spots = [0, 48, 96]
        const idx = spawnCount % 3
        const sx = spots[idx]
        if (!freeAt(sx, 0)) { spawnT = 350; return }
        ex.push(sx); ey.push(0); edir.push(2)
        ecd.push(G.ri(500, 1400))
        // 类型：0 普通 1 快速 2 装甲 3 闪红奖励车
        let tp = 0
        if (stage >= 2 && spawnCount % 3 === 1) tp = 1
        if (stage >= 2 && spawnCount % 5 === 3) tp = 2
        if (spawnCount % 4 === 2) tp = 3
        etype.push(tp)
        ehp.push(tp === 2 ? 4 : (tp === 1 ? 1 : 2))
        eflash.push(tp === 3 ? 1 : 0)
        spawnCount++
        remaining--
        spawnT = 900
    }

    function bulletTile(x: number, y: number, power: number): boolean {
        if (x < 0 || x >= 104 || y < 0 || y >= 104) return true
        const tx = Math.floor(x / TS)
        const ty = Math.floor(y / TS)
        const c = getc(tx, ty)
        if (c === "X") { baseLost = true; boom(x, y, 1); return true }
        if (c === "S") {
            if (power >= 2 && steelT <= 0) setc(tx, ty, ".")
            return true
        }
        if (c === "B" && bhp(tx, ty) > 0) {
            const hp = bhp(tx, ty) - power * 2
            setBhp(tx, ty, hp)
            if (hp <= 0) setc(tx, ty, ".")
            G.beep(220, 30)
            return true
        }
        return false
    }

    function update(dt: number): void {
        if (G.isOver || clearT > 0) return
        // ---- 玩家 ----
        let nd = -1
        if (controller.up.isPressed()) nd = 0
        else if (controller.right.isPressed()) nd = 1
        else if (controller.down.isPressed()) nd = 2
        else if (controller.left.isPressed()) nd = 3
        if (nd >= 0) {
            pdir = nd
            const spd = 34 + grade * 2
            const nx = px + DX[nd] * spd * dt
            const ny = py + DY[nd] * spd * dt
            if (!blocked(nx, ny, 8, 8)) { px = nx; py = ny }
        }
        if (pcd > 0) pcd -= dt * 1000
        if (controller.A.isPressed() && pcd <= 0) {
            fire(0, px, py, pdir, 1 + Math.floor(grade / 2))
            pcd = grade >= 2 ? 170 : 260
        }
        if (shield > 0) shield -= dt * 1000
        if (freezeT > 0) freezeT -= dt * 1000
        if (steelT > 0) {
            steelT -= dt * 1000
            if (steelT <= 0) steelBase(false)
        }

        // ---- 生成敌人 ----
        if (remaining > 0 && ex.length < 4) {
            spawnT -= dt * 1000
            if (spawnT <= 0) spawnEnemy()
        }

        // ---- 敌人 AI ----
        for (let i = 0; i < ex.length; i++) {
            if (freezeT <= 0) {
                const spd = etype[i] === 1 ? 30 : 18
                const nx = ex[i] + DX[edir[i]] * spd * dt
                const ny = ey[i] + DY[edir[i]] * spd * dt
                if (!blocked(nx, ny, 8, 8)) { ex[i] = nx; ey[i] = ny }
                else {
                    let best = -1
                    let bv = 9999
                    for (let d = 0; d < 4; d++) {
                        const cx = ex[i] + DX[d] * 8
                        const cy = ey[i] + DY[d] * 8
                        if (blocked(cx, cy, 8, 8)) continue
                        const dist = G.abs(cx - px) + G.abs(cy - py)
                        if (dist < bv) { bv = dist; best = d }
                    }
                    edir[i] = (best >= 0 && G.ri(0, 100) < 60) ? best : G.ri(0, 3)
                }
                if (G.ri(0, 100) < 2) edir[i] = G.ri(0, 3)
                ecd[i] -= dt * 1000
                if (ecd[i] <= 0) {
                    ecd[i] = G.ri(600, 1600)
                    let d = 2
                    if (G.abs(px - ex[i]) > G.abs(py - ey[i])) d = px > ex[i] ? 1 : 3
                    else d = py > ey[i] ? 2 : 0
                    fire(1, ex[i], ey[i], d, 1)
                }
            }
            if (G.hit(px, py, 8, 8, ex[i], ey[i], 8, 8)) loseTank()
        }

        // ---- 子弹 ----
        for (let i = bx.length - 1; i >= 0; i--) {
            bx[i] += bdx[i] * dt
            by[i] += bdy[i] * dt
            let gone = bulletTile(bx[i], by[i], bpow[i])
            if (baseLost) { baseLost = false; buildStage(stage); return }
            if (!gone && bown[i] === 0) {
                for (let j = ex.length - 1; j >= 0; j--) {
                    if (G.hit(bx[i] - 1, by[i] - 1, 3, 3, ex[j], ey[j], 8, 8)) {
                        ehp[j] -= bpow[i]
                        gone = true
                        if (ehp[j] <= 0) {
                            boom(ex[j], ey[j], 1)
                            score += etype[j] === 2 ? 400 : 100
                            if (eflash[j] > 0 || G.ri(0, 100) < 18) drop(ex[j], ey[j])
                            ex.splice(j, 1); ey.splice(j, 1); edir.splice(j, 1)
                            ecd.splice(j, 1); etype.splice(j, 1); ehp.splice(j, 1); eflash.splice(j, 1)
                        }
                        break
                    }
                }
            } else if (!gone) {
                if (shield <= 0 && G.hit(bx[i] - 1, by[i] - 1, 3, 3, px, py, 8, 8)) {
                    gone = true
                    loseTank()
                }
            }
            if (gone) {
                bx.splice(i, 1); by.splice(i, 1); bdx.splice(i, 1); bdy.splice(i, 1)
                bown.splice(i, 1); bpow.splice(i, 1)
            }
        }
        // 子弹对撞
        for (let i = bx.length - 1; i >= 0; i--) {
            for (let j = i - 1; j >= 0; j--) {
                if (bown[i] !== bown[j] && G.abs(bx[i] - bx[j]) < 3 && G.abs(by[i] - by[j]) < 3) {
                    bx.splice(i, 1); by.splice(i, 1); bdx.splice(i, 1); bdy.splice(i, 1)
                    bown.splice(i, 1); bpow.splice(i, 1)
                    bx.splice(j, 1); by.splice(j, 1); bdx.splice(j, 1); bdy.splice(j, 1)
                    bown.splice(j, 1); bpow.splice(j, 1)
                    break
                }
            }
        }
        // ---- 道具 ----
        for (let i = ux.length - 1; i >= 0; i--) {
            if (G.hit(px, py, 8, 8, ux[i], uy[i], 8, 8)) {
                applyPower(ut[i])
                ux.splice(i, 1); uy.splice(i, 1); ut.splice(i, 1)
            }
        }
        // ---- 爆炸 ----
        for (let i = fx.length - 1; i >= 0; i--) {
            ft[i] -= 1
            if (ft[i] <= 0) { fx.splice(i, 1); fy.splice(i, 1); ft.splice(i, 1) }
        }
        // ---- 过关 ----
        if (remaining <= 0 && ex.length === 0) {
            score += 500
            clearT = 1900
            G.beep(880, 180)
        }
    }

    function drawTank(x: number, y: number, dir: number, body: number, trim: number): void {
        G.r(x, y, 8, 8, body)
        if (dir === 0 || dir === 2) {
            G.r(x, y, 2, 8, G.BLACK)
            G.r(x + 6, y, 2, 8, G.BLACK)
            G.r(x + 1, y + 1, 1, 6, trim)
            G.r(x + 6, y + 1, 1, 6, trim)
        } else {
            G.r(x, y, 8, 2, G.BLACK)
            G.r(x, y + 6, 8, 2, G.BLACK)
            G.r(x + 1, y + 1, 6, 1, trim)
            G.r(x + 1, y + 6, 6, 1, trim)
        }
        G.r(x + 2, y + 2, 4, 4, trim)
        G.r(x + 3 + DX[dir] * 2, y + 3 + DY[dir] * 2, 2, 2, G.WHITE)
    }

    function draw(): void {
        screen.fill(G.BLACK)
        G.hudTop(G.GREEN)
        G.t("TANK BATTLE", 2, 1, G.YELLOW)
        G.tr("STAGE " + stage, 158, 1, G.CYAN)
        // 战场外框：双层 + 四角标记
        G.r(2, 12, 108, 108, G.DKGRAY)
        G.r(3, 13, 106, 106, G.BLACK)
        G.box(2, 12, 108, 108, G.GRAY)
        G.corners(2, 12, 108, 108, 8, G.GREEN)

        // 地形（草丛留到最后画）
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const c = getc(x, y)
                if (c === "." || c === "G" || c === "X") continue
                const sx = OX + x * TS
                const sy = OY + y * TS
                if (c === "B" && bhp(x, y) > 0) {
                    const hp = bhp(x, y)
                    G.r(sx, sy, 8, hp >= 3 ? 8 : 4, G.WOOD)
                    G.r(sx, sy, 8, 1, G.ORANGE)
                    G.r(sx, sy + 3, 8, 1, G.DKGRAY)
                    G.r(sx + 4, sy, 1, 3, G.DKGRAY)
                    if (hp >= 3) G.r(sx + 2, sy + 5, 1, 2, G.DKGRAY)
                } else if (c === "S") {
                    G.r(sx, sy, 8, 8, G.GRAY)
                    G.r(sx, sy, 8, 1, G.WHITE)
                    G.r(sx + 1, sy + 1, 2, 2, G.WHITE)
                    G.r(sx + 5, sy + 5, 2, 2, G.WHITE)
                    G.box(sx, sy, 8, 8, G.DKGRAY)
                } else if (c === "W") {
                    G.r(sx, sy, 8, 8, G.BLUE)
                    G.r(sx, sy + 2 + (frame % 10 < 5 ? 0 : 1), 8, 1, G.CYAN)
                    G.r(sx, sy + 6, 8, 1, G.CYAN)
                }
            }
        }
        // 老鹰基地
        const bx0 = OX + 6 * TS, by0 = OY + 12 * TS
        G.r(bx0, by0, 8, 8, G.YELLOW)
        G.r(bx0 + 1, by0 + 1, 6, 6, G.ORANGE)
        G.r(bx0, by0 + 5, 3, 3, G.RED)
        G.r(bx0 + 5, by0 + 5, 3, 3, G.RED)
        G.r(bx0 + 3, by0 + 3, 2, 2, G.BLACK)
        G.r(bx0 + 3, by0, 2, 2, G.WHITE)

        // 道具
        for (let i = 0; i < ux.length; i++) {
            if ((frame % 20) < 10) continue
            const sx = OX + ux[i], sy = OY + uy[i]
            G.r(sx, sy, 8, 8, G.YELLOW)
            G.r(sx + 1, sy + 1, 6, 6, G.BLACK)
            G.t("" + ut[i], sx + 2, sy, G.WHITE)
        }
        // 坦克
        if (shield > 0 && (frame % 8) < 4) {
            G.box(OX + px - 2, OY + py - 2, 12, 12, G.CYAN)
        }
        drawTank(OX + px, OY + py, pdir, G.YELLOW, G.GREEN)
        for (let i = 0; i < ex.length; i++) {
            let body = G.GRAY
            let trim = G.WHITE
            if (etype[i] === 1) { body = G.TEAL; trim = G.CYAN }
            if (etype[i] === 2) { body = ehp[i] > 2 ? G.RED : G.ORANGE; trim = G.YELLOW }
            if (eflash[i] > 0 && (frame % 12) < 6) { body = G.RED; trim = G.YELLOW }
            drawTank(OX + ex[i], OY + ey[i], edir[i], body, trim)
        }
        // 子弹
        for (let i = 0; i < bx.length; i++) {
            G.r(OX + bx[i] - 1, OY + by[i] - 1, 3, 3,
                bown[i] === 0 ? G.WHITE : G.PINK)
        }
        // 爆炸
        for (let i = 0; i < fx.length; i++) {
            const rr = Math.floor(ft[i] / 3) + 2
            G.r(OX + fx[i] - rr, OY + fy[i] - rr, rr * 2, rr * 2,
                (frame % 6) < 3 ? G.YELLOW : G.ORANGE)
        }
        // 草丛盖在坦克上
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                if (getc(x, y) !== "G") continue
                const sx = OX + x * TS, sy = OY + y * TS
                G.r(sx, sy, 8, 8, G.GREEN)
                G.r(sx + 1, sy + 1, 2, 2, G.TEAL)
                G.r(sx + 5, sy + 4, 2, 2, G.TEAL)
            }
        }
        // ---- 右侧信息栏（112..158，每行都按 6px/字 精算过）----
        const PX = 112
        G.t("SCORE", PX, 13, G.GRAY)
        G.tr("" + score, 158, 22, G.YELLOW)
        G.r(PX, 32, 46, 1, G.BLUE)
        G.t("ENEMY", PX, 35, G.GRAY)
        const left = remaining + ex.length
        for (let i = 0; i < Math.min(20, left); i++) {
            G.r(PX + (i % 5) * 9, 44 + Math.floor(i / 5) * 6, 5, 4, G.RED)
            G.r(PX + (i % 5) * 9, 44 + Math.floor(i / 5) * 6, 5, 1, G.ORANGE)
        }
        G.r(PX, 70, 46, 1, G.BLUE)
        G.t("LEFT", PX, 73, G.GRAY)
        G.tr("" + left, 158, 73, G.WHITE)
        G.t("GRADE " + grade, PX, 84, G.CYAN)
        if (shield > 0) G.t("SHIELD", PX, 96, G.CYAN);
        else if (freezeT > 0) G.t("FREEZE", PX, 96, G.CYAN);
        else if (steelT > 0) G.t("STEEL", PX, 96, G.GRAY);
        G.t("L:INF", PX, 108, G.RED)
        if (clearT > 0) {
            G.panel(24, 44, 112, 30, G.CYAN, G.BLUE)
            G.tc("STAGE CLEAR!", 49, G.WHITE)
            G.tc("+" + 500, 60, G.YELLOW)
        }
        if (introT > 0) G.introCard("STAGE " + stage, "D-PAD MOVE   A FIRE", "", G.GREEN)
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        stage = 1; score = 0; grade = 0; frame = 0
        introT = 2600
        buildStage(1)
        last = control.millis()
        scene.setBackgroundColor(G.BLACK)

        game.onShade(function () {
            frame++
            const now = control.millis()
            let dt = (now - last) / 1000
            last = now
            if (dt > 0.04) dt = 0.04
            if (dt < 0) dt = 0
            if (introT > 0) introT -= dt * 1000
            if (clearT > 0) {
                clearT -= dt * 1000
                if (clearT <= 0) {
                    stage = stage >= 4 ? 1 : stage + 1
                    buildStage(stage)
                    introT = 2000
                }
            } else update(dt)
            draw()
        })
    }
}
