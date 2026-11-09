# ===================================================================
#  RETRO 4-IN-1  ·  Python 版（教学精简版）
#  与同目录 5 个 .ts 文件对应：菜单 + 贪吃蛇 / 横版闯关 / 横版枪战 / 坦克大战
#
#  TS 版是 1968 行的完整实现（3 世界、3 关 + Boss、4 张地图、6 种道具…）；
#  本文件把「同样的架构 + 同样的四个玩法」压缩到一节课能读完的篇幅，
#  用来对照学习 Python 语法，或让孩子逐段改参数。
#
#  ⚠️ 两个必须记住的规矩：
#   1) 所有直接画屏的代码放 game.on_shade()（渲染之后），
#      放 on_update() 会被引擎每帧的 background.draw() 擦掉 → 全黑。
#   2) MakeCode 的 Python 是「静态 Python」，不是 MicroPython：
#      不能 import、不能 lambda；空数组要写 `a: List[number] = []`；
#      闭包里改外层变量要写 `nonlocal`（本文件大量使用）。
# ===================================================================

SW = 160
SH = 120
BLACK = 15
WHITE = 1
RED = 2
ORANGE = 4
YELLOW = 5
TEAL = 6
GREEN = 7
BLUE = 8
CYAN = 9
PURPLE = 10
GRAY = 11
BROWN = 12
DKBLUE = 14


# ---------------- 通用小工具（把长名字缩短，讲课时更好念） ----------------
def r(x, y, w, h, c):
    screen.fill_rect(x, y, w, h, c)


def box(x, y, w, h, c):
    screen.draw_rect(x, y, w, h, c)


def t(s, x, y, c):
    screen.print(s, x, y, c)


def tc(s, y, c):
    screen.print_center(s, y, c)


def ri(a, b):
    return randint(a, b)


def clamp(v, a, b):
    if v < a:
        return a
    if v > b:
        return b
    return v


def hit(ax, ay, aw, ah, bx, by, bw, bh):
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


lastBeep = 0


def beep(f, ms):
    global lastBeep
    now = control.millis()
    if now - lastBeep < 55:
        return
    lastBeep = now
    # 必须后台播放，否则会 pause() 卡住整个游戏循环
    music.tone_playable(f, ms).play(music.PlaybackMode.IN_BACKGROUND)


def hud(title, score, extra, c):
    r(0, 0, SW, 10, BLACK)
    t(title, 2, 1, c)
    t("SC:" + str(score), 76, 1, WHITE)
    t(extra, 122, 1, c)


def over_panel(title, score, best):
    r(6, 32, 148, 56, CYAN)
    r(8, 34, 144, 52, BLACK)
    tc(title, 38, YELLOW)
    tc("SCORE " + str(score), 50, WHITE)
    tc("BEST  " + str(best), 60, GREEN)
    tc("A=RETRY  B=MENU", 74, CYAN)


# ---------------- 启动逻辑：settings 存「本次复位要启动哪个游戏」 ----------------
launch = settings.read_number("lg")
if launch != 0:
    settings.write_number("lg", 0)   # 读完立刻清零，冷启动永远回菜单
cursor = 1
NAMES = ["SNAKE", "PLATFORM HERO", "RUN & GUN", "TANK BATTLE"]
SUBS = ["GRID CLASSIC", "JUMP & COINS", "SHOOT & SURVIVE", "DEFEND THE BASE"]


def to_menu():
    settings.write_number("lg", 0)
    game.reset()


def start_game(n):
    settings.write_number("lg", n)
    game.reset()


controller.B.on_event(ControllerButtonEvent.PRESSED, to_menu)


# ===================================================================
#  游戏 1：贪吃蛇 —— 数组 + 定时步进 + 自己撞自己
# ===================================================================
def snake_start():
    CELL = 8
    COLS = 20
    ROWS = 13
    TOP = 10
    xs: List[number] = [10, 9, 8]      # 头放在下标 0
    ys: List[number] = [6, 6, 6]
    dx = 1
    dy = 0
    ndx = 1
    ndy = 0
    fx = 15
    fy = 4
    score = 0
    over = False
    last = 0
    speed = 150
    frame = 0
    best = settings.read_number("s_best")

    def key_up():
        nonlocal ndx, ndy
        if dy != 1:
            ndx = 0
            ndy = -1

    def key_down():
        nonlocal ndx, ndy
        if dy != -1:
            ndx = 0
            ndy = 1

    def key_left():
        nonlocal ndx, ndy
        if dx != 1:
            ndx = -1
            ndy = 0

    def key_right():
        nonlocal ndx, ndy
        if dx != -1:
            ndx = 1
            ndy = 0

    def key_a():
        if over:
            start_game(1)

    def new_food():
        nonlocal fx, fy
        fx = ri(0, COLS - 1)
        fy = ri(0, ROWS - 1)

    def tick():
        nonlocal dx, dy, last, score, over, speed, frame
        frame = frame + 1
        if over:
            return
        now = control.millis()
        if now - last < speed:      # 用时间控制速度，而不是每帧走一格
            return
        last = now
        dx = ndx
        dy = ndy
        nx = xs[0] + dx
        ny = ys[0] + dy
        if nx < 0:
            nx = COLS - 1           # 穿墙
        if nx >= COLS:
            nx = 0
        if ny < 0:
            ny = ROWS - 1
        if ny >= ROWS:
            ny = 0
        i = 0
        while i < len(xs):         # 撞到自己
            if xs[i] == nx and ys[i] == ny:
                over = True
            i = i + 1
        if over:
            beep(196, 180)
            if score > best:
                settings.write_number("s_best", score)
            return
        xs.insert_at(0, nx)
        ys.insert_at(0, ny)
        if nx == fx and ny == fy:
            score = score + 1
            beep(880, 40)
            new_food()
            if score % 5 == 0 and speed > 70:
                speed = speed - 10   # 每 5 分加速
        else:
            xs.remove_at(len(xs) - 1)
            ys.remove_at(len(ys) - 1)

    def draw():
        screen.fill(BLACK)
        hud("SNAKE", score, "B:MENU", GREEN)
        box(0, TOP, SW - 1, SH - TOP - 1, DKBLUE)
        r(fx * CELL + 1, TOP + fy * CELL + 1, CELL - 2, CELL - 2, YELLOW)
        i = 0
        while i < len(xs):
            c = GREEN if i == 0 else CYAN
            r(xs[i] * CELL + 1, TOP + ys[i] * CELL + 1, CELL - 2, CELL - 2, c)
            i = i + 1
        if over:
            over_panel("GAME OVER", score, best)

    controller.up.on_event(ControllerButtonEvent.PRESSED, key_up)
    controller.down.on_event(ControllerButtonEvent.PRESSED, key_down)
    controller.left.on_event(ControllerButtonEvent.PRESSED, key_left)
    controller.right.on_event(ControllerButtonEvent.PRESSED, key_right)
    controller.A.on_event(ControllerButtonEvent.PRESSED, key_a)
    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  游戏 2：横版闯关 —— 重力 / 卷轴 / 平台 / 金币 / 掉落扣命
# ===================================================================
def platformer_start():
    WORLD = 480
    GROUNDS = [[0, 120], [150, 110], [290, 190]]   # [起点x, 宽度]，中间是深坑
    PLATS = [[66, 74, 34], [186, 62, 34], [318, 80, 40]]  # [x, 台面y, 宽]
    COINS = [[40, 84, 0], [78, 62, 0], [130, 84, 0], [200, 50, 0],
             [250, 84, 0], [330, 68, 0], [400, 84, 0], [450, 84, 0]]
    px = 12.0
    py = 92.0
    vy = 0.0
    cam = 0.0
    onGround = True
    lives = 3
    score = 0
    over = False
    win = False

    def ground_y(x):
        i = 0
        while i < len(GROUNDS):
            g = GROUNDS[i]
            if x >= g[0] and x <= g[0] + g[1]:
                return 100
            i = i + 1
        return 999          # 没有地面 = 深坑

    def jump():
        nonlocal vy, onGround
        if onGround:
            vy = -4.6
            onGround = False
            beep(660, 40)

    def tick():
        nonlocal px, py, vy, cam, onGround, lives, score, over, win
        if over or win:
            return
        if controller.left.is_pressed():
            px = px - 1.5
        if controller.right.is_pressed():
            px = px + 1.5
        px = clamp(px, 0, WORLD - 8)
        vy = vy + 0.32      # 重力
        py = py + vy
        surface = ground_y(px + 3)
        i = 0
        while i < len(PLATS):   # 落在浮空平台上
            p = PLATS[i]
            if px + 6 > p[0] and px < p[0] + p[2]:
                if py + 8 <= p[1] + 6 and p[1] < surface:
                    surface = p[1]
            i = i + 1
        if vy > 0 and py + 8 >= surface and py + 8 - vy <= surface + 8:
            py = surface - 8
            vy = 0
            onGround = True
        else:
            onGround = False
        i = 0
        while i < len(COINS):
            c = COINS[i]
            if c[2] == 0 and hit(px, py, 8, 8, c[0], c[1], 5, 5):
                c[2] = 1
                score = score + 1
                beep(880, 40)
            i = i + 1
        if py > 130:         # 掉进深坑
            lives = lives - 1
            if lives <= 0:
                over = True
                beep(196, 180)
            else:
                px = 12.0
                py = 80.0
                vy = 0.0
        if px > WORLD - 16:
            win = True
            beep(880, 200)
        cam = clamp(px - 60, 0, WORLD - SW)

    def draw():
        screen.fill(BLUE)
        hud("PLATFORM HERO", score, "L:" + str(lives), ORANGE)
        i = 0
        while i < len(GROUNDS):
            g = GROUNDS[i]
            r(g[0] - cam, 100, g[1], 20, BROWN)
            r(g[0] - cam, 100, g[1], 2, GREEN)
            i = i + 1
        i = 0
        while i < len(PLATS):
            p = PLATS[i]
            r(p[0] - cam, p[1], p[2], 4, ORANGE)
            i = i + 1
        i = 0
        while i < len(COINS):
            c = COINS[i]
            if c[2] == 0:
                r(c[0] - cam, c[1], 5, 5, YELLOW)
            i = i + 1
        r(WORLD - 14 - cam, 76, 2, 24, WHITE)
        r(WORLD - 12 - cam, 76, 10, 6, RED)
        r(px - cam, py, 8, 8, RED)                  # 小人
        r(px - cam + 1, py + 2, 2, 2, WHITE)
        if over:
            over_panel("GAME OVER", score, 0)
        if win:
            over_panel("YOU WIN!", score, 0)
        t("A=JUMP B=MENU", 2, 110, GRAY)

    # A 键一个事件两种用途：平时跳跃，结束时重开
    def key_a_both():
        if over or win:
            start_game(2)
        else:
            jump()

    controller.A.on_event(ControllerButtonEvent.PRESSED, key_a_both)
    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  游戏 3：横版枪战 —— 子弹数组 / 敌人生成 / 两类碰撞 / 关卡推进
# ===================================================================
def contra_start():
    px = 24.0
    py = 92.0
    vy = 0.0
    hp = 5
    score = 0
    stage = 1
    over = False
    lastSpawn = 0
    bx: List[number] = []
    by: List[number] = []
    bvx: List[number] = []
    ex: List[number] = []
    ey: List[number] = []
    ehp: List[number] = []
    ebx: List[number] = []
    eby: List[number] = []

    def shoot():
        bx.append(px + 8)
        by.append(py + 3)
        bvx.append(3.4)
        beep(720, 30)

    def jump():
        nonlocal vy
        if py >= 91:
            vy = -4.4

    def key_a():
        if over:
            start_game(3)
        else:
            shoot()

    def tick():
        nonlocal px, py, vy, hp, score, stage, over, lastSpawn
        if over:
            return
        if controller.left.is_pressed():
            px = px - 1.4
        if controller.right.is_pressed():
            px = px + 1.4
        px = clamp(px, 2, 140)
        vy = vy + 0.34
        py = py + vy
        if py > 92:
            py = 92
            vy = 0
        now = control.millis()
        # 关卡越高，敌人来得越快
        if now - lastSpawn > 1500 - stage * 250:
            lastSpawn = now
            ex.append(158)
            ey.append(92)
            ehp.append(2 + stage * 2)     # 子弹伤害 2，血量按两倍记，保持击杀节奏
        # 子弹飞
        i = 0
        while i < len(bx):
            bx[i] = bx[i] + bvx[i]
            if bx[i] > 170:
                bx.remove_at(i)
                by.remove_at(i)
                bvx.remove_at(i)
            else:
                i = i + 1
        # 敌人左移、偶尔开枪、碰玩家扣血
        i = 0
        while i < len(ex):
            ex[i] = ex[i] - 0.45 - stage * 0.1
            if ri(0, 100) < 1:
                ebx.append(ex[i])
                eby.append(96)
            if hit(px, py, 8, 8, ex[i], ey[i], 8, 8):
                hp = hp - 1
                ex.remove_at(i)
                ey.remove_at(i)
                ehp.remove_at(i)
                beep(160, 90)
                if hp <= 0:
                    over = True
                continue
            if ex[i] < -10:
                ex.remove_at(i)
                ey.remove_at(i)
                ehp.remove_at(i)
                continue
            # 子弹打敌人
            j = 0
            dead = False
            while j < len(bx):
                if hit(bx[j], by[j], 4, 3, ex[i], ey[i], 8, 8):
                    bx.remove_at(j)
                    by.remove_at(j)
                    bvx.remove_at(j)
                    ehp[i] = ehp[i] - 2          # 单发伤害 2
                    if ehp[i] <= 0:
                        dead = True
                    break
                j = j + 1
            if dead:
                score = score + 1
                beep(880, 40)
                ex.remove_at(i)
                ey.remove_at(i)
                ehp.remove_at(i)
                if score % 5 == 0 and stage < 3:
                    stage = stage + 1
                continue
            i = i + 1
        # 敌方子弹
        i = 0
        while i < len(ebx):
            ebx[i] = ebx[i] - 1.5
            if hit(px, py, 8, 8, ebx[i], eby[i], 4, 3):
                hp = hp - 1
                ebx.remove_at(i)
                eby.remove_at(i)
                beep(160, 90)
                if hp <= 0:
                    over = True
                continue
            if ebx[i] < -5:
                ebx.remove_at(i)
                eby.remove_at(i)
                continue
            i = i + 1

    def draw():
        screen.fill(DKBLUE)
        hud("RUN & GUN", score, "HP:" + str(hp), CYAN)
        r(0, 100, SW, 20, BROWN)
        t("STAGE " + str(stage), 130, 108, YELLOW)
        r(px, py, 8, 8, CYAN)
        r(px + 5, py - 2, 4, 3, WHITE)
        i = 0
        while i < len(bx):
            r(bx[i], by[i], 4, 3, YELLOW)       # 子弹加大
            r(bx[i] + 1, by[i] + 1, 2, 1, WHITE)
            i = i + 1
        i = 0
        while i < len(ex):
            r(ex[i], ey[i] + 1, 8, 7, RED)
            r(ex[i] + 1, ey[i], 3, 2, ORANGE)
            i = i + 1
        i = 0
        while i < len(ebx):
            r(ebx[i], eby[i], 4, 3, RED)
            r(ebx[i] + 1, eby[i] + 1, 2, 1, YELLOW)
            i = i + 1
        if over:
            over_panel("GAME OVER", score, 0)
        t("A=FIRE UP=JUMP B=MENU", 2, 110, GRAY)

    controller.A.on_event(ControllerButtonEvent.PRESSED, key_a)
    controller.up.on_event(ControllerButtonEvent.PRESSED, jump)
    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  游戏 4：坦克大战 —— 字符地图 / 砖墙破坏 / 护基地 / 敌方 AI
# ===================================================================
def tanks_start():
    CELL = 10
    COLS = 16
    ROWS = 11
    TOP = 10
    MAP = [
        "................",
        "..BB..SS..BB....",
        "..BB..SS..BB....",
        "....GG....GG....",
        ".BB....WW....BB.",
        ".BB....WW....BB.",
        "....BB....BB....",
        "....BB....BB....",
        "..S...GGGG...S..",
        ".....B....B.....",
        ".......X........",
    ]
    cells: List[number] = []
    y = 0
    while y < ROWS:
        x = 0
        while x < COLS:
            ch = MAP[y][x]
            v = 0
            if ch == "B":
                v = 1        # 砖，可打碎
            elif ch == "S":
                v = 2        # 钢，打不碎
            elif ch == "W":
                v = 3        # 水，挡坦克不挡子弹
            elif ch == "G":
                v = 4        # 草，可穿过
            elif ch == "X":
                v = 5        # 老鹰基地
            cells.append(v)
            x = x + 1
        y = y + 1

    def cell(cx, cy):
        if cx < 0 or cx >= COLS or cy < 0 or cy >= ROWS:
            return 2
        return cells[cy * COLS + cx]

    def solid(cx, cy):
        v = cell(cx, cy)
        return v == 1 or v == 2 or v == 3 or v == 5

    px = 20.0
    py = 100.0
    pdir = 0                # 0上 1右 2下 3左
    bx: List[number] = []
    by: List[number] = []
    bdx: List[number] = []
    bdy: List[number] = []
    ex: List[number] = [150.0, 150.0, 150.0]
    ey: List[number] = [10.0, 40.0, 70.0]
    edir: List[number] = [3, 3, 3]
    ecool: List[number] = [0, 0, 0]
    ebx: List[number] = []
    eby: List[number] = []
    ebdx: List[number] = []
    ebdy: List[number] = []
    score = 0
    lives = 3
    over = False
    win = False
    left = 6                # 剩余敌坦克（含待补充）
    lastMove = 0

    def shoot():
        sx = px + 3
        sy = py + 3
        dx = 0
        dy = 0
        if pdir == 0:
            dy = -3
        elif pdir == 1:
            dx = 3
            sy = py + 3
            sx = px + 8
        elif pdir == 2:
            dy = 3
            sy = py + 8
        else:
            dx = -3
        bx.append(sx)
        by.append(sy)
        bdx.append(dx)
        bdy.append(dy)
        beep(720, 30)

    def key_a():
        if over or win:
            start_game(4)
        else:
            shoot()

    def tick():
        nonlocal px, py, pdir, score, lives, over, win, left, lastMove
        if over or win:
            return
        now = control.millis()
        if now - lastMove < 55:
            return
        lastMove = now
        ox = px
        oy = py
        if controller.up.is_pressed():
            py = py - 2
            pdir = 0
        elif controller.down.is_pressed():
            py = py + 2
            pdir = 2
        elif controller.left.is_pressed():
            px = px - 2
            pdir = 3
        elif controller.right.is_pressed():
            px = px + 2
            pdir = 1
        px = clamp(px, 0, SW - 9)
        py = clamp(py, TOP, SH - 9)
        if (solid(Math.floor(px / CELL), Math.floor((py - TOP) / CELL))
                or solid(Math.floor((px + 8) / CELL), Math.floor((py - TOP) / CELL))
                or solid(Math.floor(px / CELL), Math.floor((py + 8 - TOP) / CELL))
                or solid(Math.floor((px + 8) / CELL), Math.floor((py + 8 - TOP) / CELL))):
            px = ox
            py = oy
        # 玩家子弹
        i = 0
        while i < len(bx):
            bx[i] = bx[i] + bdx[i]
            by[i] = by[i] + bdy[i]
            cx = Math.floor(bx[i] / CELL)
            cy = Math.floor((by[i] - TOP) / CELL)
            if bx[i] < 0 or bx[i] > SW or by[i] < TOP or by[i] > SH:
                bx.remove_at(i)
                by.remove_at(i)
                bdx.remove_at(i)
                bdy.remove_at(i)
                continue
            v = cell(cx, cy)
            if v == 1:      # 打碎砖
                cells[cy * COLS + cx] = 0
                bx.remove_at(i)
                by.remove_at(i)
                bdx.remove_at(i)
                bdy.remove_at(i)
                beep(300, 30)
                continue
            if v == 2 or v == 5:
                if v == 5:
                    over = True
                bx.remove_at(i)
                by.remove_at(i)
                bdx.remove_at(i)
                bdy.remove_at(i)
                continue
            # 打中敌坦克
            j = 0
            killed = False
            while j < len(ex):
                if hit(bx[i], by[i], 2, 2, ex[j], ey[j], 9, 9):
                    killed = True
                    ex.remove_at(j)
                    ey.remove_at(j)
                    edir.remove_at(j)
                    ecool.remove_at(j)
                    score = score + 1
                    left = left - 1
                    beep(880, 40)
                    break
                j = j + 1
            if killed:
                bx.remove_at(i)
                by.remove_at(i)
                bdx.remove_at(i)
                bdy.remove_at(i)
                continue
            i = i + 1
        # 补充敌坦克
        if left > 0 and len(ex) < 3 and ri(0, 100) < 3:
            ex.append(ri(0, 2) * 60 + 10)
            ey.append(TOP)
            edir.append(2)
            ecool.append(0)
        # 敌坦克 AI：随机转向 + 定期开火
        i = 0
        while i < len(ex):
            if ri(0, 100) < 8:
                edir[i] = ri(0, 3)
            sx = ex[i]
            sy = ey[i]
            if edir[i] == 0:
                ey[i] = ey[i] - 0.7
            elif edir[i] == 1:
                ex[i] = ex[i] + 0.7
            elif edir[i] == 2:
                ey[i] = ey[i] + 0.7
            else:
                ex[i] = ex[i] - 0.7
            ex[i] = clamp(ex[i], 0, SW - 9)
            ey[i] = clamp(ey[i], TOP, SH - 9)
            if solid(Math.floor(ex[i] / CELL), Math.floor((ey[i] - TOP) / CELL)):
                ex[i] = sx
                ey[i] = sy
                edir[i] = ri(0, 3)
            ecool[i] = ecool[i] + 1
            if ecool[i] > 60 and ri(0, 100) < 20:
                ecool[i] = 0
                dx = 0
                dy = 0
                if edir[i] == 0:
                    dy = -2
                elif edir[i] == 1:
                    dx = 2
                elif edir[i] == 2:
                    dy = 2
                else:
                    dx = -2
                ebx.append(ex[i] + 4)
                eby.append(ey[i] + 4)
                ebdx.append(dx)
                ebdy.append(dy)
            i = i + 1
        # 敌方子弹
        i = 0
        while i < len(ebx):
            ebx[i] = ebx[i] + ebdx[i]
            eby[i] = eby[i] + ebdy[i]
            cx = Math.floor(ebx[i] / CELL)
            cy = Math.floor((eby[i] - TOP) / CELL)
            v = cell(cx, cy)
            if v == 1:
                cells[cy * COLS + cx] = 0
            if v == 1 or v == 2 or v == 5:
                if v == 5:
                    over = True
                ebx.remove_at(i)
                eby.remove_at(i)
                ebdx.remove_at(i)
                ebdy.remove_at(i)
                continue
            if hit(ebx[i], eby[i], 2, 2, px, py, 9, 9):
                lives = lives - 1
                ebx.remove_at(i)
                eby.remove_at(i)
                ebdx.remove_at(i)
                ebdy.remove_at(i)
                beep(160, 90)
                if lives <= 0:
                    over = True
                continue
            if ebx[i] < 0 or ebx[i] > SW or eby[i] < TOP or eby[i] > SH:
                ebx.remove_at(i)
                eby.remove_at(i)
                ebdx.remove_at(i)
                ebdy.remove_at(i)
                continue
            i = i + 1
        if left <= 0 and len(ex) == 0:
            win = True
            beep(880, 200)

    def draw():
        screen.fill(BLACK)
        hud("TANK BATTLE", score, "L:" + str(lives), GREEN)
        y = 0
        while y < ROWS:
            x = 0
            while x < COLS:
                v = cells[y * COLS + x]
                xx = x * CELL
                yy = TOP + y * CELL
                if v == 1:
                    r(xx, yy, CELL - 1, CELL - 1, BROWN)
                    r(xx, yy, CELL - 1, 2, ORANGE)
                elif v == 2:
                    r(xx, yy, CELL - 1, CELL - 1, GRAY)
                elif v == 3:
                    r(xx, yy, CELL - 1, CELL - 1, BLUE)
                elif v == 4:
                    r(xx + 1, yy + 3, 3, 5, GREEN)
                    r(xx + 5, yy + 1, 3, 7, GREEN)
                elif v == 5:
                    r(xx, yy, CELL - 1, CELL - 1, YELLOW)
                    r(xx + 3, yy + 3, 4, 4, BLACK)
                x = x + 1
            y = y + 1
        i = 0
        while i < len(ex):
            r(ex[i] + 1, ey[i] + 1, 7, 7, RED)
            r(ex[i] + 4, ey[i] + 4, 2, 5, ORANGE)
            i = i + 1
        r(px + 1, py + 1, 7, 7, TEAL)
        if pdir == 0:
            r(px + 4, py - 3, 2, 5, WHITE)
        elif pdir == 1:
            r(px + 7, py + 4, 5, 2, WHITE)
        elif pdir == 2:
            r(px + 4, py + 7, 2, 5, WHITE)
        else:
            r(px - 3, py + 4, 5, 2, WHITE)
        i = 0
        while i < len(bx):
            r(bx[i], by[i], 2, 2, YELLOW)
            i = i + 1
        i = 0
        while i < len(ebx):
            r(ebx[i], eby[i], 2, 2, ORANGE)
            i = i + 1
        if over:
            over_panel("BASE LOST", score, 0)
        if win:
            over_panel("YOU WIN!", score, 0)
        t("A=FIRE B=MENU", 2, 110, GRAY)

    controller.A.on_event(ControllerButtonEvent.PRESSED, key_a)
    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  菜单 / 启动分支
# ===================================================================
if launch == 0:
    scene.set_background_color(BLACK)
    frame = 0

    def menu_up():
        global cursor
        if cursor == 1:
            cursor = 4
        else:
            cursor = cursor - 1
        beep(660, 40)

    def menu_down():
        global cursor
        if cursor == 4:
            cursor = 1
        else:
            cursor = cursor + 1
        beep(660, 40)

    def menu_play():
        start_game(cursor)

    def draw_menu():
        global frame
        screen.fill(BLACK)
        frame = frame + 1
        i = 0
        while i < 14:       # 简单的动态星点
            xx = (i * 37 + Math.floor(frame / 4)) % SW
            screen.set_pixel(xx, 26 + i * 7, CYAN if i % 3 == 0 else DKBLUE)
            i = i + 1
        # 160x120 布局：标题 2..20，4 条目 26/44/62/80，底部提示 101/110
        r(4, 2, 152, 18, BLUE)
        box(4, 2, 152, 18, CYAN)
        tc("RETRO 4-IN-1", 8, WHITE)
        i = 0
        while i < 4:
            yy = 26 + i * 18
            if cursor == i + 1:
                r(8, yy - 2, 144, 17, DKBLUE)
                box(8, yy - 2, 144, 17, YELLOW)
            r(14, yy + 1, 8, 7, GREEN if i == 0 else (RED if i == 1 else (CYAN if i == 2 else TEAL)))
            t(str(i + 1) + ". " + NAMES[i], 30, yy, YELLOW if cursor == i + 1 else WHITE)
            t(SUBS[i], 30, yy + 8, ORANGE if cursor == i + 1 else GRAY)
            i = i + 1
        tc("UP/DOWN  A=PLAY", 101, CYAN)
        tc("B = MENU", 110, GRAY)

    controller.up.on_event(ControllerButtonEvent.PRESSED, menu_up)
    controller.down.on_event(ControllerButtonEvent.PRESSED, menu_down)
    controller.A.on_event(ControllerButtonEvent.PRESSED, menu_play)
    game.on_shade(draw_menu)
elif launch == 1:
    snake_start()
elif launch == 2:
    platformer_start()
elif launch == 3:
    contra_start()
else:
    tanks_start()
