// ===================================================================
//  3. RUN & GUN —— 完整横版枪战（原创关卡/美术，玩法致敬经典）
//  3 关 / 八方向射击 / 4 种武器(普通-速射-散射-激光) / 跳跃 /
//  步兵·炮台·冲锋兵 / 关底 Boss 与血条 / 3 命 / 无敌重生 / 卷轴
// ===================================================================
namespace Contra {
    const TS = 8
    let W = 120

    let ground: number[] = []
    let plats: number[] = []
    let px = 20
    let py = 80
    let vx = 0
    let vy = 0
    let onGround = false
    let facing = 1
    let cam = 0
    let stage = 1
    let lives = 3
    let score = 0
    let kills = 0
    let weapon = 0
    let fireCd = 0
    let invuln = 0
    let last = 0
    let frame = 0
    let clearT = 0
    let bossHp = 0
    let bossHpMax = 0
    let bossY = 60
    let bossDir = 1
    let bossCd = 0
    let bossAlive = false

    let ex: number[] = []
    let ey: number[] = []
    let et: number[] = []
    let ehp: number[] = []
    let ecd: number[] = []
    let evx: number[] = []
    let bx: number[] = []
    let by: number[] = []
    let bvx: number[] = []
    let bvy: number[] = []
    let bo: number[] = []          // 0=玩家 1=敌人
    let bd: number[] = []          // 伤害
    let bl: number[] = []          // 存活帧
    let kx: number[] = []          // 武器胶囊
    let ky: number[] = []
    let kt: number[] = []
    let fx: number[] = []          // 爆炸
    let fy: number[] = []
    let ft: number[] = []

    const WNAMES = ["RIFLE", "RAPID", "SPREAD", "LASER"]

    function gyAt(wx: number): number {
        const col = Math.floor(wx / TS)
        if (col < 0 || col >= W) return 999
        if (ground[col] < 0) return 999
        return ground[col] * TS
    }
    function fire(ax0: number, ay0: number, dx: number, dy: number,
        spd: number, dmg: number, owner: number, life: number): void {
        if (bx.length > 90) return
        bx.push(ax0); by.push(ay0); bvx.push(dx * spd); bvy.push(dy * spd)
        bo.push(owner); bd.push(dmg); bl.push(life)
    }
    // 子弹判定框尺寸：伤害 4 的是激光（更大更粗），其余是普通弹
    function bW(i: number): number { return bd[i] >= 4 ? 6 : 4 }
    function bH(i: number): number { return bd[i] >= 4 ? 4 : 3 }
    function boom(x: number, y: number, big: number): void {
        fx.push(x); fy.push(y); ft.push(big > 0 ? 22 : 12)
        G.beep(big > 0 ? 90 : 180, big > 0 ? 180 : 70)
    }
    function capsule(x: number, y: number, kind: number): void {
        kx.push(x); ky.push(y); kt.push(kind)
    }

    function buildStage(s: number): void {
        W = 110 + s * 12
        ground = []
        for (let x = 0; x < W; x++) {
            let h = 13
            if (s >= 2 && x % 17 >= 12 && x % 17 < 15) h = 12
            if (s === 3 && x % 23 >= 9 && x % 23 < 12) h = 11
            ground.push(h)
        }
        let pits: number[] = []
        let platforms: number[] = []
        let foes: number[] = []
        if (s === 1) {
            pits = [24, 2, 52, 2, 78, 3]
            platforms = [12, 10, 5, 34, 9, 5, 60, 10, 6, 88, 9, 6]
            foes = [14, 0, 0, 22, 0, 0, 32, 1, 0, 44, 0, 0, 56, 2, 0, 66, 1, 0, 74, 0, 0, 92, 2, 0, 100, 0, 0]
        } else if (s === 2) {
            pits = [16, 3, 40, 2, 66, 3, 96, 2]
            platforms = [10, 10, 5, 28, 8, 6, 50, 9, 5, 74, 10, 6, 100, 8, 5]
            foes = [12, 0, 0, 20, 2, 0, 26, 1, 0, 38, 0, 0, 48, 1, 0, 58, 2, 0, 70, 0, 0, 82, 1, 0, 90, 2, 0, 104, 0, 0, 112, 1, 0]
        } else {
            pits = [12, 2, 30, 3, 52, 2, 72, 3, 94, 2, 118, 3]
            platforms = [8, 9, 5, 24, 8, 5, 44, 10, 6, 62, 8, 5, 84, 9, 6, 106, 8, 5, 124, 9, 5]
            foes = [10, 0, 0, 18, 2, 0, 22, 1, 0, 34, 0, 0, 42, 1, 0, 50, 2, 0, 60, 0, 0, 68, 1, 0, 78, 2, 0, 88, 0, 0, 98, 1, 0, 108, 2, 0, 116, 0, 0, 128, 1, 0]
        }
        for (let i = 0; i < pits.length; i += 2) {
            for (let k = 0; k < pits[i + 1]; k++) ground[pits[i] + k] = -1
        }
        plats = platforms
        ex = []; ey = []; et = []; ehp = []; ecd = []; evx = []
        for (let i = 0; i < foes.length; i += 3) {
            const wx = foes[i] * TS
            ex.push(wx)
            if (foes[i + 1] === 1) {
                // 找一块平台放炮台
                let py2 = 96
                for (let p = 0; p < plats.length; p += 3) {
                    if (wx >= plats[p] * TS && wx < (plats[p] + plats[p + 2]) * TS) py2 = plats[p + 1] * TS - 8
                }
                ey.push(py2)
            } else ey.push(gyAt(wx) - 8)
            et.push(foes[i + 1])
            ehp.push(foes[i + 1] === 2 ? 2 : 1)
            ecd.push(G.ri(400, 1400))
            evx.push(foes[i + 1] === 2 ? -34 : -16)
        }
        bx = []; by = []; bvx = []; bvy = []; bo = []; bd = []; bl = []
        kx = []; ky = []; kt = []
        fx = []; fy = []; ft = []
        px = 20; py = 80; vx = 0; vy = 0; cam = 0
        invuln = 1200; kills = 0; clearT = 0
        bossHpMax = 24 + s * 10
        bossHp = bossHpMax
        bossAlive = true
        bossY = 56; bossDir = 1; bossCd = 900
    }

    function landY(x: number, bottom: number): number {
        let best = gyAt(x + 3)
        for (let i = 0; i < plats.length; i += 3) {
            const l = plats[i] * TS
            const rr = (plats[i] + plats[i + 2]) * TS
            const y0 = plats[i + 1] * TS
            if (x + 6 > l && x < rr && bottom <= y0 + 6 && y0 < best) best = y0
        }
        return best
    }

    function firePlayer(): void {
        let dx = facing
        let dy = 0
        const l = controller.left.isPressed()
        const rr = controller.right.isPressed()
        const u = controller.up.isPressed()
        const d = controller.down.isPressed()
        if (l) { dx = -1; facing = -1 }
        if (rr) { dx = 1; facing = 1 }
        if (u) dy = -1
        else if (d && !onGround) dy = 1
        if (dy !== 0 && !l && !rr) dx = 0
        const sx = px + (dx > 0 ? 8 : (dx < 0 ? -2 : 2))
        const sy = py + (dy < 0 ? -2 : (dy > 0 ? 9 : 4))
        // 子弹判定 4x3（激光 6x4），伤害 2（激光 4）
        if (weapon === 0) {
            fire(sx, sy, dx, dy, 190, 2, 0, 80); fireCd = 210
        } else if (weapon === 1) {
            fire(sx, sy, dx, dy, 235, 2, 0, 80); fireCd = 105
        } else if (weapon === 2) {
            fire(sx, sy, dx, dy, 190, 2, 0, 80)
            if (dy === 0) {
                fire(sx, sy - 3, dx, -0.5, 190, 2, 0, 80)
                fire(sx, sy + 3, dx, 0.5, 190, 2, 0, 80)
            } else {
                fire(sx - 3, sy, dx - 0.5, dy, 190, 2, 0, 80)
                fire(sx + 3, sy, dx + 0.5, dy, 190, 2, 0, 80)
            }
            fireCd = 250
        } else {
            fire(sx, sy, dx, dy, 285, 4, 0, 90); fireCd = 300
        }
        G.beep(weapon === 3 ? 1200 : 880, 35)
    }

    function hitPlayer(): void {
        if (invuln > 0 || G.isOver) return
        lives--
        boom(px, py, 0)
        if (lives <= 0) { G.setOver("RUN & GUN", score, "contrabest"); return }
        invuln = 1800
        weapon = 0
        px = cam + 18
        py = 60
        vy = 0
        G.beep(150, 220)
    }

    function update(dt: number): void {
        if (G.isOver || clearT > 0) return
        // --- 玩家 ---
        const dir = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0)
        if (dir !== 0) facing = dir
        vx = dir * 76
        px = G.clamp(px + vx * dt, cam, cam + 152)
        vy += 480 * dt
        if (vy > 240) vy = 240
        let bottom = py + 10
        let ny = py + vy * dt
        const ly = landY(px, bottom)
        if (vy >= 0 && ny + 10 >= ly && bottom <= ly + 10) {
            py = ly - 10; vy = 0; onGround = true
        } else { py = ny; onGround = false }
        if (py > 128) hitPlayer()

        if (fireCd > 0) fireCd -= dt * 1000
        if (controller.A.isPressed() && fireCd <= 0) firePlayer()
        if (invuln > 0) invuln -= dt * 1000

        // --- 敌人 ---
        for (let i = ex.length - 1; i >= 0; i--) {
            if (ex[i] < cam - 40 || ex[i] > cam + 200) continue
            if (et[i] === 0 || et[i] === 2) {
                const spd = et[i] === 2 ? 34 : 16
                const step = (ex[i] < px ? 1 : -1) * spd * dt
                const tx = ex[i] + step
                if (gyAt(tx + 4) < 999) ex[i] = tx
                ey[i] = gyAt(ex[i] + 4) - 8
            }
            ecd[i] -= dt * 1000
            if (ecd[i] <= 0) {
                ecd[i] = et[i] === 1 ? 1100 : G.ri(900, 1700)
                let dx = px - ex[i]
                let dy = (py + 4) - (ey[i] + 4)
                const m = Math.max(1, Math.abs(dx) + Math.abs(dy))
                fire(ex[i] + 4, ey[i] + 4, dx / m, dy / m, 95, 1, 1, 100)
            }
            if (G.hit(px, py, 6, 10, ex[i], ey[i], 8, 8)) hitPlayer()
        }

        // --- Boss：上下巡游 + 扇形多方向齐射（进入画面后才开火）---
        const bwx = (W - 16) * TS
        if (bossAlive && cam > bwx - 156) {
            bossY += bossDir * (18 + stage * 5) * dt
            if (bossY < 34) { bossY = 34; bossDir = 1 }
            if (bossY > 86) { bossY = 86; bossDir = -1 }
            bossCd -= dt * 1000
            if (bossCd <= 0) {
                bossCd = stage === 3 ? 620 : (stage === 2 ? 700 : 800)
                const cx = bwx + 4
                const cy = bossY + 8
                // 以「Boss→玩家」这条线为轴扇形展开：站着不动必被覆盖，只能走位躲
                const ax0 = px - cx
                const ay0 = (py + 4) - cy
                const baseDeg = Math.atan2(ay0, ax0) * 180 / Math.PI
                const n = stage === 1 ? 5 : (stage === 2 ? 6 : 7)
                const spread = stage === 2 ? 130 : (stage === 3 ? 160 : 100)
                const spd = 96 + stage * 8
                for (let k = 0; k < n; k++) {
                    const deg = baseDeg + (k / (n - 1) - 0.5) * spread
                    const rad = deg * Math.PI / 180
                    fire(cx, cy, Math.cos(rad), Math.sin(rad), spd, 1, 1, 110)
                }
                // 第 2 关起补一发高速直瞄弹；第 3 关再加一发偏角慢弹，形成交叉火力
                if (stage >= 2) {
                    const am = Math.max(1, Math.sqrt(ax0 * ax0 + ay0 * ay0))
                    fire(cx, cy, ax0 / am, ay0 / am, spd + 30, 1, 1, 110)
                    if (stage === 3) {
                        const r2 = (baseDeg + 16) * Math.PI / 180
                        fire(cx, cy, Math.cos(r2), Math.sin(r2), spd - 30, 1, 1, 130)
                    }
                }
                G.beep(200, 60)
            }
            if (G.hit(px, py, 6, 10, bwx, bossY, 20, 16)) hitPlayer()
        }

        // --- 子弹 ---
        for (let i = bx.length - 1; i >= 0; i--) {
            bx[i] += bvx[i] * dt
            by[i] += bvy[i] * dt
            bl[i] -= 1
            let gone = false
            if (bl[i] <= 0 || bx[i] < cam - 20 || bx[i] > cam + 180 || by[i] < 0 || by[i] > 126) gone = true
            if (!gone && by[i] > gyAt(bx[i]) - 1) {
                boom(bx[i], by[i], 0); gone = true
            }
            if (!gone && bo[i] === 1) {
                if (invuln <= 0 && G.hit(bx[i] - 1, by[i] - 1, 3, 3, px, py, 6, 10)) {
                    hitPlayer(); gone = true
                }
            } else if (!gone) {
                const cw = bW(i)
                const ch = bH(i)
                const cx0 = bx[i] - Math.floor(cw / 2)
                const cy0 = by[i] - Math.floor(ch / 2)
                for (let j = ex.length - 1; j >= 0; j--) {
                    if (G.hit(cx0, cy0, cw, ch, ex[j], ey[j], 8, 8)) {
                        ehp[j] -= bd[i]
                        if (bd[i] < 4) gone = true
                        if (ehp[j] <= 0) {
                            boom(ex[j], ey[j], 0)
                            score += 50; kills++
                            ex.splice(j, 1); ey.splice(j, 1); et.splice(j, 1)
                            ehp.splice(j, 1); ecd.splice(j, 1); evx.splice(j, 1)
                            if (kills % 7 === 0) capsule(cam + 120, 16, 1 + (kills / 7) % 3)
                        }
                        break
                    }
                }
                if (!gone && bossAlive && G.hit(cx0, cy0, cw, ch, bwx, bossY, 20, 16)) {
                    bossHp -= bd[i]
                    if (bd[i] < 4) gone = true
                    G.beep(300, 30)
                    if (bossHp <= 0) {
                        bossAlive = false
                        boom(bwx + 8, bossY + 8, 1)
                        score += 1000
                        clearT = 2200
                    }
                }
            }
            if (gone) {
                bx.splice(i, 1); by.splice(i, 1); bvx.splice(i, 1); bvy.splice(i, 1)
                bo.splice(i, 1); bd.splice(i, 1); bl.splice(i, 1)
            }
        }

        // --- 武器胶囊 ---
        for (let i = kx.length - 1; i >= 0; i--) {
            kx[i] -= 12 * dt
            ky[i] += 34 * dt
            if (ky[i] > gyAt(kx[i]) - 8) ky[i] = gyAt(kx[i]) - 8
            if (G.hit(px, py, 6, 10, kx[i], ky[i], 8, 8)) {
                weapon = weapon >= 3 ? 3 : weapon + 1
                score += 100
                G.beep(1318, 140)
                kx.splice(i, 1); ky.splice(i, 1); kt.splice(i, 1)
            } else if (kx[i] < cam - 20) {
                kx.splice(i, 1); ky.splice(i, 1); kt.splice(i, 1)
            }
        }
        // --- 爆炸 ---
        for (let i = fx.length - 1; i >= 0; i--) {
            ft[i] -= 1
            if (ft[i] <= 0) { fx.splice(i, 1); fy.splice(i, 1); ft.splice(i, 1) }
        }
        // —— 镜头 ——
        // 平时：玩家固定在屏幕左侧 1/3 处滚动；Boss 战：镜头停在 Boss 面前，
        // 把玩家限制在左半屏，才有横向空间躲多方向弹幕（否则只能贴脸硬吃）
        const camEnd = bossAlive ? G.clamp(bwx - 118, 0, W * TS - 160) : W * TS - 160
        cam = G.clamp(px - 55, 0, camEnd)
        if (bossAlive) px = G.clamp(px, cam + 14, bwx - 34)
    }

    function draw(): void {
        screen.fill(G.DKBLUE)
        // 星空 / 远山
        for (let i = 0; i < 22; i++) {
            const sx = (i * 37 + 13 - Math.floor(cam / 6)) % 200
            screen.setPixel(sx < 0 ? sx + 200 : sx, (i * 17) % 90, G.CYAN)
        }
        for (let i = 0; i < 7; i++) {
            const mx = i * 44 - (Math.floor(cam / 3) % 308)
            const xx = mx < -40 ? mx + 308 : mx
            G.r(xx, 72, 26, 20, G.BLUE)
            G.r(xx + 10, 64, 8, 8, G.BLUE)
        }
        // 地形
        const c0 = Math.max(0, Math.floor(cam / TS) - 1)
        const c1 = Math.min(W - 1, c0 + 22)
        for (let x = c0; x <= c1; x++) {
            if (ground[x] < 0) continue
            const sx = x * TS - cam
            const yy = ground[x] * TS
            G.r(sx, yy, TS, 120 - yy, G.BROWN)
            G.r(sx, yy, TS, 2, G.GREEN)
            if (x % 3 === 0) G.line(sx + 2, yy + 4, sx + 5, yy + 4, G.DKRED)
        }
        for (let i = 0; i < plats.length; i += 3) {
            const sx = plats[i] * TS - cam
            const sy = plats[i + 1] * TS
            G.r(sx, sy, plats[i + 2] * TS, 4, G.GRAY)
            G.r(sx, sy, plats[i + 2] * TS, 1, G.WHITE)
        }
        // 武器胶囊
        for (let i = 0; i < kx.length; i++) {
            const sx = kx[i] - cam
            G.r(sx, ky[i], 8, 8, (frame % 12) < 6 ? G.YELLOW : G.RED)
            G.r(sx + 2, ky[i] + 2, 4, 4, G.WHITE)
        }
        // 敌人
        for (let i = 0; i < ex.length; i++) {
            const sx = ex[i] - cam
            if (sx < -10 || sx > 168) continue
            const sy = ey[i]
            if (et[i] === 1) {
                G.r(sx, sy + 3, 8, 5, G.GRAY)
                G.r(sx + 2, sy, 4, 4, G.RED)
            } else if (et[i] === 2) {
                G.r(sx + 1, sy + 1, 6, 7, G.PURPLE)
                G.r(sx, sy + 5, 8, 2, G.WHITE)
            } else {
                G.r(sx + 1, sy, 6, 3, G.RED)
                G.r(sx + 1, sy + 3, 6, 5, G.ORANGE)
                G.r(sx, sy + 7, 3, 1, G.BLACK)
                G.r(sx + 5, sy + 7, 3, 1, G.BLACK)
            }
        }
        // Boss
        if (bossAlive) {
            const sx = (W - 16) * TS - cam
            if (sx > -30 && sx < 170) {
                G.r(sx, bossY, 20, 16, G.DKRED)
                G.r(sx + 2, bossY + 2, 16, 10, G.RED)
                G.r(sx + 5, bossY + 5, 4, 4, G.YELLOW)
                G.r(sx + 12, bossY + 5, 4, 4, G.YELLOW)
                G.r(sx - 3, bossY + 5, 4, 5, G.GRAY)
                G.r(sx, bossY + 14, 4, 3, G.GRAY)
                G.r(sx + 15, bossY + 14, 4, 3, G.GRAY)
            }
        }
        // 玩家
        if (invuln <= 0 || (frame % 8) < 4) {
            const sx = px - cam
            const sy = py
            G.r(sx, sy, 6, 3, G.CYAN)
            G.r(sx, sy + 3, 6, 5, G.BLUE)
            G.r(sx - 1, sy + 8, 3, 2, G.WHITE)
            G.r(sx + 5, sy + 8, 3, 2, G.WHITE)
            if (facing > 0) {
                G.r(sx + 5, sy + 4, 7, 2, G.GRAY)
                G.r(sx + 11, sy + 4, 2, 2, G.YELLOW)
            } else {
                G.r(sx - 6, sy + 4, 7, 2, G.GRAY)
                G.r(sx - 7, sy + 4, 2, 2, G.YELLOW)
            }
        }
        // 子弹（玩家弹 4x3、激光 6x4、敌弹 4x4）
        for (let i = 0; i < bx.length; i++) {
            const sx = bx[i] - cam
            if (bo[i] === 0) {
                const cw = bW(i)
                const ch = bH(i)
                const x0 = Math.floor(sx - cw / 2)
                const y0 = Math.floor(by[i] - ch / 2)
                G.r(x0, y0, cw, ch, cw >= 6 ? G.CYAN : G.YELLOW)
                G.r(x0 + 1, y0 + 1, cw - 2, ch - 2, G.WHITE)
            } else {
                G.r(Math.floor(sx) - 1, Math.floor(by[i]) - 1, 4, 4, G.RED)
                G.r(Math.floor(sx), Math.floor(by[i]), 2, 2, G.YELLOW)
            }
        }
        // 爆炸
        for (let i = 0; i < fx.length; i++) {
            const sx = fx[i] - cam
            const rr = Math.floor(ft[i] / 3) + 2
            G.r(sx - rr, fy[i] - rr, rr * 2, rr * 2, (frame % 6) < 3 ? G.YELLOW : G.ORANGE)
        }
        // HUD
        G.r(0, 0, 160, 10, G.BLACK)
        G.t("ST" + stage, 2, 1, G.CYAN)
        G.t(WNAMES[weapon], 24, 1, G.YELLOW)
        G.t("SC:" + score, 74, 1, G.WHITE)
        G.t("L:" + lives, 138, 1, G.RED)
        if (bossAlive && cam > (W - 16) * TS - 160) {
            G.r(30, 12, 100, 5, G.BLACK)
            G.r(31, 13, Math.max(0, Math.floor(bossHp * 98 / bossHpMax)), 3, G.RED)
            G.t("BOSS", 2, 12, G.RED)
        }
        if (clearT > 0) {
            G.r(24, 44, 112, 28, G.BLUE)
            G.tc("STAGE CLEAR!", 48, G.WHITE)
            G.tc("+1000", 60, G.YELLOW)
        }
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        stage = 1; lives = 3; score = 0; weapon = 0; frame = 0
        buildStage(1)
        last = control.millis()
        scene.setBackgroundColor(G.DKBLUE)

        controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
            if (!G.isOver && clearT <= 0 && onGround) {
                vy = -170; onGround = false
                G.beep(440, 60)
            }
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
                    if (stage >= 3) G.setOver("RUN & GUN", score, "contrabest")
                    else { stage++; buildStage(stage) }
                }
            } else update(dt)
            draw()
        })
    }
}
