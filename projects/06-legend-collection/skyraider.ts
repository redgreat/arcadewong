// ===================================================================
//  6. SKY RAIDER —— 竖版飞机大战 + 强化道具
//  方向键四向移动，按住 A 连续开火，短按 B 引爆全屏炸弹。
//  道具必须「机身碰到」才算捡到（不做吸附，飞过去就没了）：
//    B 全屏炸弹（存起来，按 B 放）      R 火箭弹（双发穿透，伤害 3）
//    S 霰弹枪（5 发扇形）               F 速射（双管高频）
//    P 护盾（挡一次伤害）               1 加一条命
//  掉落来自两处：击毁敌机 24% 概率 + 独立的「道具雨」计时器，所以出现很勤。
// ===================================================================
namespace SkyRaider {
    const TOPY = 24
    const BOTY = 108       // 机身半高约 9px，留够 120 的下边距

    let px = 80
    let py = 98
    let score = 0
    let bombs = 1
    let wkind = 0            // 0 GUN / 1 ROCKET / 2 SHOTGUN / 3 RAPID
    let wtime = 0
    let shield = 0
    let invuln = 0
    let fireCd = 0
    let spawnCd = 800
    let dropCd = 1800
    let flashT = 0
    let frame = 0
    let last = 0
    let msg = ""
    let msgT = 0
    let introT = 0

    const WN = ["GUN", "ROCKET", "SHOTGUN", "RAPID"]
    const IK = ["B", "R", "S", "F", "P", "1"]

    // 玩家子弹
    let bx: number[] = []
    let by: number[] = []
    let bvx: number[] = []
    let bvy: number[] = []
    let bd: number[] = []
    let bs: number[] = []      // 0 普通弹 1 火箭（大、穿透）
    // 敌方子弹
    let qx: number[] = []
    let qy: number[] = []
    let qvx: number[] = []
    let qvy: number[] = []
    // 敌机
    let ex: number[] = []
    let ey: number[] = []
    let et: number[] = []
    let ehp: number[] = []
    let edrift: number[] = []
    let ecd: number[] = []
    let eph: number[] = []
    // 道具
    let ix: number[] = []
    let iy: number[] = []
    let ik: number[] = []
    // 爆炸
    let fx: number[] = []
    let fy: number[] = []
    let ft: number[] = []

    function rmB(i: number): void {
        bx.splice(i, 1); by.splice(i, 1); bvx.splice(i, 1)
        bvy.splice(i, 1); bd.splice(i, 1); bs.splice(i, 1)
    }
    function rmQ(i: number): void {
        qx.splice(i, 1); qy.splice(i, 1); qvx.splice(i, 1); qvy.splice(i, 1)
    }
    function rmE(i: number): void {
        ex.splice(i, 1); ey.splice(i, 1); et.splice(i, 1); ehp.splice(i, 1)
        edrift.splice(i, 1); ecd.splice(i, 1); eph.splice(i, 1)
    }
    function rmI(i: number): void {
        ix.splice(i, 1); iy.splice(i, 1); ik.splice(i, 1)
    }

    function boom(x: number, y: number): void {
        if (fx.length > 40) return
        fx.push(x); fy.push(y); ft.push(14)
    }

    function pushB(x: number, y: number, vx: number, vy: number, dmg: number, big: number): void {
        if (bx.length > 80) return
        bx.push(x); by.push(y); bvx.push(vx); bvy.push(vy); bd.push(dmg); bs.push(big)
    }

    function shoot(): void {
        const sx = px
        const sy = py - 7
        if (wkind === 1) {                      // 火箭弹：双发平行，穿透
            pushB(sx - 5, sy, 0, -215, 3, 1)
            pushB(sx + 5, sy, 0, -215, 3, 1)
            fireCd = 265
        } else if (wkind === 2) {               // 霰弹枪：5 发扇形
            for (let k = -2; k <= 2; k++) {
                pushB(sx, sy, k * 46, -196, 1, 0)
            }
            fireCd = 330
        } else if (wkind === 3) {               // 速射：双管高频
            pushB(sx - 3, sy, 0, -252, 1, 0)
            pushB(sx + 3, sy, 0, -252, 1, 0)
            fireCd = 95
        } else {                                // 普通枪
            pushB(sx, sy, 0, -246, 1, 0)
            fireCd = 165
        }
        G.beep(wkind === 1 ? 320 : (wkind === 2 ? 520 : 880), 25)
    }

    function dropItem(x: number, y: number): void {
        // 权重：炸弹/火箭/霰弹最常见，护盾其次，加命稀有
        const r = G.ri(0, 99)
        let k = 0
        if (r < 26) k = 0
        else if (r < 50) k = 1
        else if (r < 74) k = 2
        else if (r < 88) k = 3
        else if (r < 97) k = 4
        else k = 5
        ix.push(G.clamp(x, 10, 150)); iy.push(y); ik.push(k)
    }

    function pickup(k: number): void {
        if (k === 0) {
            bombs = Math.min(5, bombs + 1)
            msg = "BOMB +1"
        } else if (k === 1) {
            wkind = 1; wtime = 12000; msg = "ROCKET!"
        } else if (k === 2) {
            wkind = 2; wtime = 12000; msg = "SHOTGUN!"
        } else if (k === 3) {
            wkind = 3; wtime = 12000; msg = "RAPID!"
        } else if (k === 4) {
            shield = 9000; msg = "SHIELD!"
        } else {
            score += 400
            msg = "1UP! +400"
        }
        msgT = 1200
        score += 50
        G.beep(1318, 120)
    }

    function spawnEnemy(): void {
        const r = G.ri(0, 99)
        let kind = 0
        if (r < 58) kind = 0
        else if (r < 82) kind = 1
        else if (r < 96) kind = 2
        else kind = 3
        let hp = 1
        if (kind === 1 || kind === 2) hp = 2
        if (kind === 3) hp = 6
        ex.push(G.ri(14, 146))
        ey.push(-10)
        et.push(kind)
        ehp.push(hp)
        edrift.push(kind === 3 ? (G.ri(0, 1) === 0 ? -24 : 24) : 0)
        ecd.push(G.ri(700, 1500))
        eph.push(G.ri(0, 6))
    }

    // 无限生命：被打中只是掉武器 + 短暂无敌，不会 GAME OVER
    function hitPlayer(): void {
        if (invuln > 0 || G.isOver) return
        wkind = 0
        wtime = 0
        boom(px, py)
        G.beep(140, 220)
        invuln = 1600
        px = 80
        py = 98
    }

    function useBomb(): void {
        if (bombs <= 0 || flashT > 0 || G.isOver) return
        bombs--
        flashT = 360
        for (let i = ex.length - 1; i >= 0; i--) {
            boom(ex[i], ey[i])
            score += 120
            rmE(i)
        }
        qx = []; qy = []; qvx = []; qvy = []
        msg = "BOMB!"
        msgT = 900
        G.beep(90, 320)
    }

    function update(dt: number): void {
        if (G.isOver) return
        frame++
        if (introT > 0) introT -= dt * 1000

        // ---- 玩家移动 ----
        const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0)
        const dy = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0)
        px = G.clamp(px + dx * 96 * dt, 8, 152)
        py = G.clamp(py + dy * 88 * dt, TOPY, BOTY)

        if (fireCd > 0) fireCd -= dt * 1000
        if (controller.A.isPressed() && fireCd <= 0) shoot()

        if (invuln > 0) invuln -= dt * 1000
        if (wtime > 0) {
            wtime -= dt * 1000
            if (wtime <= 0) { wtime = 0; wkind = 0 }
        }
        if (shield > 0) {
            shield -= dt * 1000
            if (shield <= 0) shield = 0
        }
        if (flashT > 0) flashT -= dt * 1000
        if (msgT > 0) msgT -= dt * 1000

        // ---- 刷敌机：分数越高越快 ----
        spawnCd -= dt * 1000
        if (spawnCd <= 0) {
            spawnEnemy()
            spawnCd = Math.max(640, 1250 - Math.min(420, Math.floor(score / 14)))
        }
        // ---- 道具雨：独立节奏，保证「出现频率多」 ----
        dropCd -= dt * 1000
        if (dropCd <= 0) {
            dropCd = G.ri(2900, 4900)
            dropItem(G.ri(18, 142), -8)
        }

        // ---- 玩家子弹 ----
        for (let i = bx.length - 1; i >= 0; i--) {
            bx[i] += bvx[i] * dt
            by[i] += bvy[i] * dt
            let gone = false
            if (by[i] < -10 || by[i] > 132 || bx[i] < -10 || bx[i] > 170) gone = true
            if (!gone) {
                const w = bs[i] === 1 ? 6 : 3
                const h = bs[i] === 1 ? 9 : 4
                for (let j = ex.length - 1; j >= 0; j--) {
                    if (G.hit(bx[i] - w / 2, by[i] - h / 2, w, h, ex[j] - 6, ey[j] - 6, 12, 12)) {
                        ehp[j] -= bd[i]
                        if (bs[i] === 0) gone = true      // 普通弹打一下就消失，火箭继续穿
                        if (ehp[j] <= 0) {
                            score += et[j] === 3 ? 400 : (et[j] === 0 ? 100 : 150)
                            boom(ex[j], ey[j])
                            if ((et[j] === 3 && G.ri(0, 99) < 60) || G.ri(0, 99) < 14) dropItem(ex[j], ey[j])
                            rmE(j)
                        }
                        break
                    }
                }
            }
            if (gone) rmB(i)
        }

        // ---- 敌机 ----
        for (let i = ex.length - 1; i >= 0; i--) {
            const vy0 = et[i] === 3 ? 22 : (et[i] === 2 ? 32 : (et[i] === 1 ? 46 : 58))
            ey[i] += vy0 * dt
            if (et[i] === 1) {                        // 蛇形左右飘
                eph[i] += dt * 3.2
                ex[i] += Math.cos(eph[i]) * 58 * dt
            } else if (et[i] === 3) {                 // 重机来回横移
                ex[i] += edrift[i] * dt
                if (ex[i] < 16 || ex[i] > 144) edrift[i] = -edrift[i]
            }
            ex[i] = G.clamp(ex[i], 8, 152)

            // 射手 / 重机向玩家开火
            if (et[i] === 2 || et[i] === 3) {
                ecd[i] -= dt * 1000
                if (ecd[i] <= 0 && ey[i] > 8) {
                    ecd[i] = et[i] === 3 ? 850 : 1250
                    let ax = px - ex[i]
                    let ay = py - ey[i]
                    const m = Math.max(1, Math.sqrt(ax * ax + ay * ay))
                    qx.push(ex[i]); qy.push(ey[i] + 5)
                    qvx.push(ax / m * 106); qvy.push(ay / m * 106)
                    G.beep(240, 40)
                }
            }

            if (ey[i] > 132) { rmE(i); continue }

            // 撞机
            if (G.hit(px - 7, py - 7, 14, 14, ex[i] - 6, ey[i] - 6, 12, 12)) {
                boom(ex[i], ey[i])
                rmE(i)
                score += 80
                if (shield > 0) {
                    shield = 0
                    invuln = 900
                    msg = "SHIELD DOWN"
                    msgT = 900
                    G.beep(300, 160)
                } else {
                    hitPlayer()
                }
                if (G.isOver) return
            }
        }

        // ---- 敌方子弹 ----
        for (let i = qx.length - 1; i >= 0; i--) {
            qx[i] += qvx[i] * dt
            qy[i] += qvy[i] * dt
            if (qy[i] > 130 || qx[i] < -6 || qx[i] > 166 || qy[i] < -6) { rmQ(i); continue }
            if (G.hit(px - 5, py - 5, 10, 10, qx[i] - 2, qy[i] - 2, 4, 4)) {
                rmQ(i)
                if (shield > 0) {
                    shield = 0
                    invuln = 900
                    msg = "SHIELD DOWN"
                    msgT = 900
                    G.beep(300, 160)
                } else {
                    hitPlayer()
                }
                if (G.isOver) return
            }
        }

        // ---- 道具：必须机身碰到 ----
        for (let i = ix.length - 1; i >= 0; i--) {
            iy[i] += 34 * dt
            ix[i] += Math.sin(frame / 14) * 12 * dt
            if (iy[i] > 128) { rmI(i); continue }
            if (G.hit(px - 8, py - 8, 16, 16, ix[i] - 5, iy[i] - 5, 10, 10)) {
                pickup(ik[i])
                rmI(i)
            }
        }

        // ---- 爆炸 ----
        for (let i = fx.length - 1; i >= 0; i--) {
            ft[i]--
            if (ft[i] <= 0) {
                fx.splice(i, 1); fy.splice(i, 1); ft.splice(i, 1)
            }
        }
    }

    function drawShip(x: number, y: number, c: number): void {
        G.r(x - 1, y - 7, 2, 4, c)          // 机头
        G.r(x - 2, y - 3, 4, 6, c)
        G.r(x - 6, y - 1, 12, 3, G.CYAN)    // 机翼
        G.r(x - 3, y + 3, 6, 3, c)
        G.r(x - 1, y + 6, 2, 3, (frame % 4) < 2 ? G.YELLOW : G.ORANGE)
    }

    function draw(): void {
        if (flashT > 0) {
            screen.fill(flashT > 200 ? G.WHITE : G.CYAN)
        } else {
            // 深空：上方深蓝渐变到黑
            screen.fill(G.BLACK)
            // 星云：稀疏的紫色点带
            for (let i = 0; i < 3; i++) {
                const ny = 26 + i * 32
                for (let x = 0; x < 160; x += 6) {
                    if ((x + i * 11) % 18 < 5) screen.setPixel(x, ny + (x % 9), G.PURPLE)
                }
            }
            // 三层星空（越远越慢）
            for (let i = 0; i < 34; i++) {
                const sx = (i * 53 + 7) % 160
                const layer = 1 + (i % 3)
                const sy = (i * 29 + Math.floor(frame * layer * 0.6)) % 120
                screen.setPixel(sx, sy, (i % 5 === 0) ? G.WHITE : (layer === 3 ? G.CYAN : G.GRAY))
            }
        }
        // 敌机
        for (let i = 0; i < ex.length; i++) {
            const x = Math.floor(ex[i])
            const y = Math.floor(ey[i])
            if (et[i] === 0) {
                G.r(x - 4, y - 5, 8, 3, G.RED)
                G.r(x - 6, y - 2, 12, 3, G.DKRED)
                G.r(x - 3, y + 1, 6, 3, G.ORANGE)
                G.r(x - 1, y - 4, 2, 2, G.YELLOW)
            } else if (et[i] === 1) {
                G.r(x - 2, y - 5, 4, 10, G.GREEN)
                G.r(x - 6, y - 1, 12, 3, G.TEAL)
                G.r(x - 1, y - 1, 2, 3, G.WHITE)
            } else if (et[i] === 2) {
                G.r(x - 5, y - 5, 10, 8, G.PURPLE)
                G.r(x - 3, y + 3, 6, 3, G.GRAY)
                G.r(x - 4, y - 3, 3, 3, G.RED)
                G.r(x + 1, y - 3, 3, 3, G.RED)
            } else {
                G.r(x - 8, y - 6, 16, 8, G.GRAY)
                G.r(x - 6, y - 4, 12, 8, G.DKRED)
                G.r(x - 3, y + 2, 6, 4, G.RED)
                G.r(x - 7, y - 2, 3, 3, G.YELLOW)
                G.r(x + 4, y - 2, 3, 3, G.YELLOW)
            }
        }
        // 敌方子弹
        for (let i = 0; i < qx.length; i++) {
            G.r(Math.floor(qx[i]) - 2, Math.floor(qy[i]) - 2, 4, 4, G.RED)
            G.r(Math.floor(qx[i]) - 1, Math.floor(qy[i]) - 1, 2, 2, G.YELLOW)
        }
        // 道具（闪烁方块 + 一个字母）
        for (let i = 0; i < ix.length; i++) {
            const x = Math.floor(ix[i])
            const y = Math.floor(iy[i])
            const on = ((frame >> 2) + i) % 2 === 0
            const c = ik[i] === 0 ? G.RED : (ik[i] === 1 ? G.ORANGE :
                (ik[i] === 2 ? G.YELLOW : (ik[i] === 3 ? G.CYAN :
                    (ik[i] === 4 ? G.BLUE : G.GREEN))))
            G.r(x - 5, y - 5, 10, 10, on ? c : G.WHITE)
            G.r(x - 4, y - 4, 8, 8, G.BLACK)
            G.t(IK[ik[i]], x - 2, y - 3, on ? c : G.WHITE)
        }
        // 玩家
        if (!G.isOver && (invuln <= 0 || (frame % 8) < 4)) {
            drawShip(Math.floor(px), Math.floor(py), G.WHITE)
        }
        if (shield > 0) {
            G.box(Math.floor(px) - 9, Math.floor(py) - 9, 18, 18, (frame % 8) < 4 ? G.BLUE : G.CYAN)
        }
        // 玩家子弹
        for (let i = 0; i < bx.length; i++) {
            const x = Math.floor(bx[i])
            const y = Math.floor(by[i])
            if (bs[i] === 1) {
                G.r(x - 3, y - 4, 6, 9, G.ORANGE)
                G.r(x - 1, y - 3, 2, 7, G.YELLOW)
                G.r(x - 1, y + 5, 2, 3, G.RED)
            } else {
                G.r(x - 1, y - 2, 3, 4, G.YELLOW)
                G.r(x, y - 1, 1, 2, G.WHITE)
            }
        }
        // 爆炸
        for (let i = 0; i < fx.length; i++) {
            const rr = Math.floor(ft[i] / 3) + 2
            G.r(fx[i] - rr, fy[i] - rr, rr * 2, rr * 2, (frame % 4) < 2 ? G.YELLOW : G.ORANGE)
        }
        // ---- HUD ----
        G.hudTop(G.PURPLE)
        G.t("SC " + G.sc(score), 2, 1, G.WHITE)
        G.tr(WN[wkind], 108, 1, wkind === 0 ? G.GRAY : G.YELLOW)
        G.tr("B" + bombs, 126, 1, bombs > 0 ? G.CYAN : G.DKGRAY)
        G.tr("L:INF", 158, 1, G.RED)
        if (wtime > 0) G.bar(66, 9, 42, 2, wtime / 12000, G.YELLOW, G.DKGRAY, G.DKGRAY)
        if (msgT > 0) G.tc(msg, 22, G.YELLOW)
        if (introT > 0) G.introCard("SKY RAIDER", "D-PAD MOVE   A FIRE", "B = BOMB", G.CYAN)
        if (G.isOver) G.drawOver()
        G.drawQuitBar()
    }

    export function start(): void {
        px = 80; py = 98; score = 0; bombs = 1
        wkind = 0; wtime = 0; shield = 0; invuln = 0; fireCd = 0
        spawnCd = 900; dropCd = 2400; flashT = 0; frame = 0
        msg = ""; msgT = 0
        introT = 2600
        bx = []; by = []; bvx = []; bvy = []; bd = []; bs = []
        qx = []; qy = []; qvx = []; qvy = []
        ex = []; ey = []; et = []; ehp = []; edrift = []; ecd = []; eph = []
        ix = []; iy = []; ik = []
        fx = []; fy = []; ft = []
        scene.setBackgroundColor(G.BLACK)
        last = control.millis()

        controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
            useBomb()
        })

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
