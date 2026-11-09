// ===================================================================
//  5. STICKMAN GUNNER —— 火柴人枪战跑酷
//  世界向左滚，小人拿枪打、能跳；每推进一段距离出 BOSS，打死才过关。
//  木箱里出：霰弹枪 / 机枪 / 核弹（全屏清场）/ 无敌 / 分数。
//  无限生命：中弹只是短暂无敌，永远不会 GAME OVER。
// ===================================================================
namespace Stickman {
    const GY = 102          // 地面线（脚底）
    const PH = 16           // 身高
    const STAGE_LEN = 1200  // 每关要推进的距离

    let px = 34
    let py = GY - PH
    let vy = 0
    let jumps = 0
    let onGround = true

    let stg = 1
    let phase = 0           // 0 推进 / 1 BOSS / 2 过关间隙
    let phaseT = 0
    let stageDist = 0
    let dist = 0
    let distAcc = 0
    let score = 0

    let wk = 0              // 0 手枪 / 1 霰弹 / 2 机枪
    let wt = 0
    let invuln = 900
    let fireCd = 0
    let flashT = 0
    let frame = 0
    let last = 0
    let msg = ""
    let msgT = 0
    let introT = 0

    let gapAcc = 0
    let nextGap = 130
    let crateAcc = 0
    let nextCrate = 160

    // 玩家子弹
    let bx: number[] = []
    let by: number[] = []
    let bvx: number[] = []
    let bvy: number[] = []
    let bd: number[] = []
    // 敌弹
    let qx: number[] = []
    let qy: number[] = []
    let qvx: number[] = []
    let qvy: number[] = []
    // 敌兵：et 0 步兵 / 1 冲锋兵 / 2 飞行兵
    let ex: number[] = []
    let ey: number[] = []
    let et: number[] = []
    let ehp: number[] = []
    let ecd: number[] = []
    let eph: number[] = []
    // 木箱
    let cx: number[] = []
    let cy: number[] = []
    // BOSS
    let bOn = false
    let bX = 190
    let bY = 64
    let bHp = 0
    let bMax = 1
    let bCd = 0
    let bPh = 0
    let bMin = 0
    // 爆炸
    let fx: number[] = []
    let fy: number[] = []
    let ft: number[] = []

    const WN = ["PISTOL", "SHOTGUN", "M.GUN"]

    function spd(): number {
        return 62 + Math.min(44, (stg - 1) * 8)
    }

    function rmB(i: number): void {
        bx.splice(i, 1); by.splice(i, 1); bvx.splice(i, 1)
        bvy.splice(i, 1); bd.splice(i, 1)
    }
    function rmQ(i: number): void {
        qx.splice(i, 1); qy.splice(i, 1); qvx.splice(i, 1); qvy.splice(i, 1)
    }
    function rmE(i: number): void {
        ex.splice(i, 1); ey.splice(i, 1); et.splice(i, 1)
        ehp.splice(i, 1); ecd.splice(i, 1); eph.splice(i, 1)
    }
    function clearFoes(): void {
        ex = []; ey = []; et = []; ehp = []; ecd = []; eph = []
    }
    function clearShots(): void {
        qx = []; qy = []; qvx = []; qvy = []
    }
    function boom(x: number, y: number): void {
        if (fx.length > 44) return
        fx.push(x); fy.push(y); ft.push(12)
    }

    // ---------------- 跑动 / 跳跃 ----------------
    function movePlayer(dt: number): void {
        const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0)
        if (dx !== 0) px = G.clamp(px + dx * 76 * dt, 8, 84)
        vy += 520 * dt
        py += vy * dt
        onGround = false
        if (py + PH >= GY) {
            py = GY - PH
            if (vy > 0) { vy = 0; jumps = 0 }
            onGround = true
        }
    }

    function jump(): void {
        if (jumps >= 2) return
        vy = -172
        jumps++
        G.beep(520 + jumps * 140, 40)
    }

    // ---------------- 推进段 ----------------
    function spawnFoe(): void {
        const r = G.ri(0, 99)
        let k = 0
        if (r < 56) k = 0
        else if (r < 82) k = 1
        else k = 2
        ex.push(170)
        et.push(k)
        if (k === 2) {
            ey.push(G.ri(46, 62))
            ehp.push(2)
        } else {
            ey.push(GY - PH)
            ehp.push(k === 1 ? 1 : 3)
        }
        ecd.push(G.ri(900, 1900))
        eph.push(G.ri(0, 6))
    }

    function spawnCrate(): void {
        cx.push(170)
        cy.push(G.ri(0, 1) === 0 ? GY - 12 : 62)
    }

    function advance(dt: number): void {
        const s = spd()
        dist += s * dt
        stageDist += s * dt
        distAcc += s * dt
        while (distAcc >= 36) { distAcc -= 36; score++ }

        gapAcc += s * dt
        if (gapAcc > nextGap) {
            gapAcc = 0
            nextGap = G.ri(96, 170)
            spawnFoe()
        }
        crateAcc += s * dt
        if (crateAcc > nextCrate) {
            crateAcc = 0
            nextCrate = G.ri(150, 300)
            spawnCrate()
        }
        if (stageDist >= STAGE_LEN) startBoss()
    }

    // ---------------- 木箱 ----------------
    function nuke(): void {
        flashT = 430
        msg = "N U K E !!"
        msgT = 1500
        let n = 0
        for (let i = ex.length - 1; i >= 0; i--) {
            boom(ex[i], ey[i] + 6)
            boom(ex[i] - 7, ey[i] + 2)
            n++
        }
        clearFoes()
        clearShots()
        score += n * 100 + 200
        if (bOn) {
            bHp -= 14
            if (bHp <= 0) bossDie()
        }
        G.beep(90, 420)
    }

    function openCrate(i: number): void {
        const x = cx[i]
        const y = cy[i]
        cx.splice(i, 1); cy.splice(i, 1)
        boom(x, y)
        score += 20
        const r = G.ri(0, 99)
        if (r < 26) {
            wk = 1; wt = 14000; msg = "SHOTGUN!"
        } else if (r < 50) {
            wk = 2; wt = 14000; msg = "MACHINE GUN!"
        } else if (r < 70) {
            nuke()
            return
        } else if (r < 90) {
            invuln = 8000; msg = "INVINCIBLE!"
        } else {
            score += 300; msg = "+300"
        }
        msgT = 1100
        G.beep(1200, 90)
    }

    // ---------------- BOSS ----------------
    function startBoss(): void {
        phase = 1
        bOn = true
        bX = 186
        bY = 64
        bHp = 26 + stg * 14
        bMax = bHp
        bCd = 1400
        bPh = 0
        bMin = 3000
        clearFoes()
        clearShots()
        msg = "B O S S !"
        msgT = 1400
        G.beep(180, 320)
    }

    function bossDie(): void {
        if (!bOn) return
        bOn = false
        score += 500 + stg * 150
        for (let i = 0; i < 6; i++) boom(bX + G.ri(-12, 12), bY + G.ri(0, 30))
        phase = 2
        phaseT = 1800
        msg = "STAGE " + stg + " CLEAR!"
        msgT = 1800
        G.beep(1046, 320)
    }

    function bossFire(sp: number, n: number): void {
        const sx = bX - 15
        const sy = bY + 14
        const ax = px + 4 - sx
        const ay = py + 6 - sy
        const base = Math.atan2(ay, ax)
        for (let k = -n; k <= n; k++) {
            const a = base + k * 0.21
            qx.push(sx); qy.push(sy)
            qvx.push(Math.cos(a) * sp); qvy.push(Math.sin(a) * sp)
        }
        G.beep(220, 45)
    }

    function bossStep(dt: number): void {
        if (!bOn) return
        if (bX > 122) bX -= 26 * dt
        bPh += dt * 2.2
        bY = 64 + Math.sin(bPh) * 5
        if (bX > 132) return
        bCd -= dt * 1000
        if (bCd <= 0) {
            bCd = Math.max(520, 1250 - stg * 90)
            bossFire(84 + stg * 6, bHp < bMax * 0.45 ? 2 : 1)
        }
        bMin -= dt * 1000
        if (bMin <= 0) {
            bMin = 6000
            let alive = 0
            for (let i = 0; i < ex.length; i++) {
                if (et[i] === 0) alive++
            }
            if (alive < 2) {
                ex.push(bX + 4); ey.push(GY - PH); et.push(0)
                ehp.push(2); ecd.push(1600); eph.push(0)
            }
        }
    }

    function nextStage(): void {
        stg++
        phase = 0
        stageDist = 0
        gapAcc = 0
        crateAcc = 0
        clearFoes()
        clearShots()
        cx = []; cy = []
        invuln = 1200
        msg = "STAGE " + stg
        msgT = 1200
        G.beep(660, 130)
    }

    // ---------------- 射击 ----------------
    function pushB(x: number, y: number, vx: number, vy: number, dmg: number): void {
        if (bx.length > 60) return
        bx.push(x); by.push(y); bvx.push(vx); bvy.push(vy); bd.push(dmg)
    }

    function shoot(): void {
        const sx = px + 10
        const sy = py + 6
        if (wk === 1) {
            pushB(sx, sy, 212, -34, 1)
            pushB(sx, sy, 220, 0, 1)
            pushB(sx, sy, 212, 34, 1)
            fireCd = 430
        } else if (wk === 2) {
            pushB(sx, sy - 1, 268, 0, 1)
            fireCd = 96
        } else {
            pushB(sx, sy, 240, 0, 2)
            fireCd = 205
        }
        G.beep(wk === 1 ? 520 : (wk === 2 ? 900 : 760), 22)
    }

    function hurt(): void {
        if (invuln > 0) return
        invuln = 1700
        vy = -110
        msg = "OUCH"
        msgT = 500
        G.beep(150, 200)
    }

    // ---------------- 逐段更新 ----------------
    function stepBullets(dt: number): void {
        for (let i = bx.length - 1; i >= 0; i--) {
            bx[i] += bvx[i] * dt
            by[i] += bvy[i] * dt
            if (bx[i] > 174 || by[i] < -8 || by[i] > 118) { rmB(i); continue }
            let hit = false
            for (let j = cx.length - 1; j >= 0; j--) {
                if (G.hit(bx[i] - 2, by[i] - 2, 4, 4, cx[j], cy[j], 11, 11)) {
                    openCrate(j)
                    hit = true
                    break
                }
            }
            if (hit) { rmB(i); continue }
            for (let j = ex.length - 1; j >= 0; j--) {
                if (G.hit(bx[i] - 2, by[i] - 2, 4, 4, ex[j], ey[j], 9, PH)) {
                    ehp[j] -= bd[i]
                    hit = true
                    if (ehp[j] <= 0) {
                        score += et[j] === 2 ? 150 : 80
                        boom(ex[j], ey[j] + 6)
                        rmE(j)
                        G.beep(980, 40)
                    }
                    break
                }
            }
            if (hit) { rmB(i); continue }
            if (bOn && G.hit(bx[i] - 2, by[i] - 2, 4, 4, bX - 12, bY, 26, 34)) {
                bHp -= bd[i]
                rmB(i)
                if (bHp <= 0) bossDie()
            }
        }
    }

    function stepFoes(dt: number): void {
        const s = phase === 0 ? spd() : 0
        for (let i = ex.length - 1; i >= 0; i--) {
            if (et[i] === 2) {
                ex[i] -= 46 * dt
                ey[i] += Math.sin(frame / 9 + eph[i]) * 9 * dt
                ey[i] = G.clamp(ey[i], 40, 74)
            } else if (et[i] === 1) {
                ex[i] -= Math.max(62, s + 34) * dt
            } else {
                ex[i] -= Math.max(40, s + 6) * dt
            }
            if (ex[i] < -14) { rmE(i); continue }

            // 步兵开枪
            if (et[i] === 0) {
                ecd[i] -= dt * 1000
                if (ecd[i] <= 0 && ex[i] < 152 && ex[i] > px + 8) {
                    ecd[i] = G.ri(1500, 2400)
                    const sxq = ex[i] - 6
                    const syq = ey[i] + 7
                    const ax = px + 4 - sxq
                    const ay = py + 6 - syq
                    const m = Math.max(1, Math.sqrt(ax * ax + ay * ay))
                    qx.push(sxq); qy.push(syq)
                    qvx.push(ax / m * 90); qvy.push(ay / m * 90)
                }
            }
            // 撞人
            if (G.hit(px - 1, py, 9, PH, ex[i], ey[i], 9, PH)) {
                hurt()
                if (et[i] === 1) rmE(i)
            }
        }
    }

    function stepCrates(dt: number): void {
        const s = phase === 0 ? spd() : 0
        for (let i = cx.length - 1; i >= 0; i--) {
            cx[i] -= s * 0.9 * dt
            if (cx[i] < -12) { cx.splice(i, 1); cy.splice(i, 1); continue }
            if (G.hit(px - 1, py, 10, PH, cx[i], cy[i], 11, 11)) openCrate(i)
        }
    }

    function stepQ(dt: number): void {
        for (let i = qx.length - 1; i >= 0; i--) {
            qx[i] += qvx[i] * dt
            qy[i] += qvy[i] * dt
            if (qx[i] < -8 || qx[i] > 168 || qy[i] < -8 || qy[i] > 118) { rmQ(i); continue }
            if (G.hit(px - 1, py + 2, 9, PH - 2, qx[i] - 2, qy[i] - 2, 4, 4)) {
                rmQ(i)
                hurt()
            }
        }
    }

    function update(dt: number): void {
        if (G.isOver) return
        frame++
        if (introT > 0) introT -= dt * 1000
        if (flashT > 0) flashT -= dt * 1000
        if (msgT > 0) msgT -= dt * 1000
        if (wt > 0) {
            wt -= dt * 1000
            if (wt <= 0) { wt = 0; wk = 0 }
        }
        if (invuln > 0) invuln -= dt * 1000
        if (fireCd > 0) fireCd -= dt * 1000

        movePlayer(dt)
        if (controller.A.isPressed() && fireCd <= 0) shoot()

        if (phase === 0) advance(dt)
        else if (phase === 1) bossStep(dt)
        else {
            phaseT -= dt * 1000
            if (phaseT <= 0) nextStage()
        }

        stepBullets(dt)
        stepFoes(dt)
        stepCrates(dt)
        stepQ(dt)

        for (let i = fx.length - 1; i >= 0; i--) {
            ft[i]--
            if (ft[i] <= 0) {
                fx.splice(i, 1); fy.splice(i, 1); ft.splice(i, 1)
            }
        }
    }

    // ---------------- 绘制 ----------------
    function drawMan(x: number, y: number, swing: number, gun: number, face: number, c: number): void {
        G.r(x + 2, y, 5, 5, c)
        G.r(x + 4, y + 5, 1, 6, c)
        if (gun > 0) {
            if (face > 0) {
                G.r(x + 6, y + 6, 7, 2, G.GRAY)
                G.r(x + 12, y + 6, 2, 2, G.YELLOW)
            } else {
                G.r(x - 5, y + 6, 7, 2, G.GRAY)
                G.r(x - 6, y + 6, 2, 2, G.YELLOW)
            }
        } else {
            G.line(x + 4, y + 6, x + 1, y + 9 - swing, c)
            G.line(x + 4, y + 6, x + 7, y + 9 + swing, c)
        }
        G.line(x + 4, y + 11, x + 1 - swing, y + PH, c)
        G.line(x + 4, y + 11, x + 7 + swing, y + PH, c)
    }

    function drawBoss(): void {
        if (!bOn) return
        const x = Math.floor(bX)
        const y = Math.floor(bY)
        const c = (frame % 10) < 5 ? G.RED : G.PINK
        G.r(x - 5, y, 10, 9, c)                 // 头
        G.r(x - 3, y + 3, 2, 2, G.BLACK)
        G.r(x + 2, y + 3, 2, 2, G.BLACK)
        G.r(x - 1, y + 9, 3, 14, c)             // 躯干
        G.r(x - 9, y + 11, 17, 2, c)            // 双臂
        G.r(x - 6, y + 22, 3, 12, c)            // 腿
        G.r(x + 4, y + 22, 3, 12, c)
        G.r(x - 17, y + 12, 9, 3, G.GRAY)       // 枪
        G.r(x - 19, y + 12, 3, 3, G.YELLOW)
    }

    function draw(): void {
        if (flashT > 0) {
            screen.fill(flashT > 200 ? G.WHITE : G.CYAN)
        } else {
            // ---- 夜空 + 星 + 月 ----
            screen.fill(G.BLACK)
            for (let i = 0; i < 20; i++) {
                const sx = (i * 43 + 11 - Math.floor(dist / 9)) % 180
                screen.setPixel(sx < 0 ? sx + 180 : sx, (i * 13) % 58,
                    (i % 5 === 0) ? G.WHITE : G.CYAN)
            }
            const mo = 118 - Math.floor(dist / 22) % 26
            G.disc(mo, 26, 8, G.GRAY)
            G.disc(mo - 1, 25, 6, G.WHITE)
            G.r(mo - 3, 24, 2, 2, G.GRAY)
            G.r(mo + 1, 29, 2, 2, G.GRAY)
            // ---- 远楼（暗蓝，慢）----
            for (let i = 0; i < 9; i++) {
                let mx = i * 40 - Math.floor(dist / 5) % 360
                if (mx < -44) mx += 360
                const hh = 22 + (i * 7) % 16
                G.r(mx, GY - hh, 20, hh, G.BLUE)
                for (let k = 0; k < 2; k++) {
                    G.r(mx + 4 + k * 8, GY - hh + 5, 2, 2, (i + k) % 3 === 0 ? G.YELLOW : G.CYAN)
                }
            }
            // ---- 近楼（深灰，中速）----
            for (let i = 0; i < 7; i++) {
                let mx = i * 52 - Math.floor(dist / 2.4) % 364
                if (mx < -56) mx += 364
                const hh = 30 + (i * 11) % 22
                G.r(mx, GY - hh, 26, hh, G.DKGRAY)
                G.r(mx + 11, GY - hh - 6, 2, 6, G.DKGRAY)
                for (let k = 0; k < 3; k++) {
                    G.r(mx + 4 + k * 8, GY - hh + 6, 3, 3, (i + k) % 2 === 0 ? G.YELLOW : G.BLUE)
                }
            }
        }
        // ---- 地面：草皮 + 泥土 ----
        G.r(0, GY, 160, 120 - GY, G.WOOD)
        G.r(0, GY, 160, 2, G.GREEN)
        const off = Math.floor(dist) % 13
        for (let i = 0; i < 14; i++) {
            G.r(i * 13 - off, GY + 6 + (i % 3) * 4, 4, 1, G.DKGRAY)
            if (i % 2 === 0) G.r(i * 13 - off + 6, GY + 3, 2, 1, G.LTGLOW)
        }
        // ---- 木箱 ----
        for (let i = 0; i < cx.length; i++) {
            const x = Math.floor(cx[i])
            const y = Math.floor(cy[i])
            G.r(x, y, 11, 11, G.WOOD)
            G.box(x, y, 11, 11, G.YELLOW)
            G.r(x + 1, y + 1, 9, 1, G.ORANGE)
            G.line(x + 1, y + 1, x + 9, y + 9, G.ORANGE)
            G.line(x + 9, y + 1, x + 1, y + 9, G.ORANGE)
            G.r(x + 4, y + 4, 3, 3, G.YELLOW)
        }
        // 敌兵
        for (let i = 0; i < ex.length; i++) {
            const x = Math.floor(ex[i])
            const y = Math.floor(ey[i])
            if (et[i] === 2) {
                G.r(x - 5, y - 4, 10, 4, G.PURPLE)
                G.r(x - 2, y - 8, 4, 5, G.PINK)
                G.r(x - 4, y, 2, 3, G.GRAY)
                G.r(x + 2, y, 2, 3, G.GRAY)
            } else {
                drawMan(x, y, et[i] === 1 ? (((frame >> 2) + i) % 2 === 0 ? 1 : -1) : 0, 1, -1,
                    et[i] === 1 ? G.ORANGE : G.RED)
            }
        }
        drawBoss()
        // 玩家
        if (invuln <= 0 || (frame % 8) < 4) {
            const swing = onGround ? (((frame >> 2) % 2) === 0 ? 1 : -1) : 0
            drawMan(Math.floor(px), Math.floor(py), swing, 1, 1, G.WHITE)
        }
        // 子弹
        for (let i = 0; i < bx.length; i++) {
            G.r(Math.floor(bx[i]) - 1, Math.floor(by[i]) - 1, 3, 3, G.YELLOW)
            G.r(Math.floor(bx[i]), Math.floor(by[i]), 1, 1, G.WHITE)
        }
        for (let i = 0; i < qx.length; i++) {
            G.r(Math.floor(qx[i]) - 2, Math.floor(qy[i]) - 2, 4, 4, G.PINK)
            G.r(Math.floor(qx[i]) - 1, Math.floor(qy[i]) - 1, 2, 2, G.RED)
        }
        // 爆炸
        for (let i = 0; i < fx.length; i++) {
            const rr = Math.floor(ft[i] / 3) + 1
            G.r(fx[i] - rr, fy[i] - rr, rr * 2, rr * 2, (frame % 4) < 2 ? G.YELLOW : G.ORANGE)
        }
        // ---- HUD ----
        G.hudTop(phase === 1 ? G.PINK : G.CYAN)
        G.t("ST" + stg, 2, 1, phase === 1 ? G.PINK : G.CYAN)
        G.tr(WN[wk], 74, 1, wk === 0 ? G.GRAY : G.YELLOW)
        G.tr("SC " + G.sc(score), 122, 1, G.WHITE)
        G.tr("L:INF", 158, 1, G.RED)
        // 特殊武器剩余时间：画在 HUD 里第 9 行，不占游戏画面
        if (wt > 0) G.bar(34, 9, 40, 2, wt / 14000, G.YELLOW, G.DKGRAY, G.DKGRAY)
        // 推进条 / BOSS 血条：整条 2..157，不写字，避免压住 HUD
        if (phase === 1 && bOn) {
            G.bar(2, 13, 156, 5, bHp / bMax, G.RED, G.BLACK, G.PINK)
        } else {
            G.bar(2, 13, 156, 5, stageDist / STAGE_LEN, G.GREEN, G.BLACK, G.GRAY)
        }
        if (msgT > 0) G.tc(msg, 22, G.YELLOW)
        if (introT > 0) G.introCard("STICKMAN", "D-PAD MOVE   B JUMP", "HOLD A = FIRE", G.CYAN)
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        px = 34; py = GY - PH; vy = 0; jumps = 0; onGround = true
        stg = 1; phase = 0; phaseT = 0; stageDist = 0; dist = 0; distAcc = 0; score = 0
        wk = 0; wt = 0; invuln = 900; fireCd = 0; flashT = 0; frame = 0
        msg = ""; msgT = 0; gapAcc = 0; nextGap = 130; crateAcc = 0; nextCrate = 160
        introT = 2600
        bx = []; by = []; bvx = []; bvy = []; bd = []
        qx = []; qy = []; qvx = []; qvy = []
        clearFoes()
        cx = []; cy = []
        bOn = false; bHp = 0; bMax = 1; bCd = 0; bPh = 0; bMin = 0
        fx = []; fy = []; ft = []
        scene.setBackgroundColor(G.BLACK)
        last = control.millis()

        controller.B.onEvent(ControllerButtonEvent.Pressed, function () { jump() })
        controller.up.onEvent(ControllerButtonEvent.Pressed, function () { jump() })

        game.onShade(function () {
            const now = control.millis()
            let dt = (now - last) / 1000
            last = now
            if (dt > 0.04) dt = 0.04
            if (dt < 0) dt = 0
            update(dt)
            draw()
        })
    }
}
