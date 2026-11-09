# ===================================================================
#  RETRO 6-IN-1  ·  Python 版（教学精简版）
#  与同目录 7 个 .ts 文件对应：菜单 + 贪吃蛇 / 横版闯关 / 横版枪战 /
#  坦克大战 / 火柴人跑酷 / 飞机大战
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
PINK = 3
ORANGE = 4
YELLOW = 5
TEAL = 6
GREEN = 7
BLUE = 8
CYAN = 9
PURPLE = 10
GRAY = 11
BROWN = 12
DKRED = 13
DKBLUE = 14


# ---------------- 通用小工具（把长名字缩短，讲课时更好念） ----------------
def r(x, y, w, h, c):
    screen.fill_rect(x, y, w, h, c)


def box(x, y, w, h, c):
    screen.draw_rect(x, y, w, h, c)


def line(x0, y0, x1, y1, c):
    screen.draw_line(Math.floor(x0), Math.floor(y0), Math.floor(x1), Math.floor(y1), c)


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


def tr(s, xr, y, c):
    """右对齐：xr 是右边界，字段再长也只往左长，不会压到隔壁"""
    screen.print(s, xr - len(s) * 6, y, c)


def hud(title, score, extra, c):
    r(0, 0, SW, 10, BLACK)
    r(0, 10, SW, 1, c)
    t(title, 2, 1, c)
    tr("SC " + str(score), 110, 1, WHITE)
    tr(extra, 158, 1, c)


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
NGAME = 6
VIS = 4                      # 一屏只放得下 4 条，其余靠滚动
scroll = 0                   # 列表第 1 条是第几个（0 基）
NAMES = ["SNAKE", "PLATFORM HERO", "RUN & GUN", "TANK BATTLE", "STICKMAN", "SKY RAIDER"]
ICONS = [GREEN, RED, CYAN, TEAL, WHITE, YELLOW]


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
        nonlocal dx, dy, last, score, over, speed, frame, xs, ys, ndx, ndy, best
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
        hit_self = False
        while i < len(xs):         # 撞到自己
            if xs[i] == nx and ys[i] == ny:
                hit_self = True
            i = i + 1
        if hit_self:
            # 无限生命：撞到自己只是退回三节，不结束
            beep(150, 220)
            if score > best:
                best = score
                settings.write_number("s_best", score)
            xs = [10, 9, 8]
            ys = [6, 6, 6]
            dx = 1
            dy = 0
            ndx = 1
            ndy = 0
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
        if py > 130:         # 掉进深坑：无限生命，直接回起点
            beep(196, 180)
            px = 12.0
            py = 80.0
            vy = 0.0
        if px > WORLD - 16:
            win = True
            beep(880, 200)
        cam = clamp(px - 60, 0, WORLD - SW)

    def draw():
        screen.fill(BLUE)
        hud("PLATFORM", score, "L:INF", ORANGE)
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
                if hp <= 0:          # 无限生命：回起点满血
                    hp = 5
                    px = 20
                    py = 92
                    vy = 0
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
                if hp <= 0:          # 无限生命：回起点满血
                    hp = 5
                    px = 20
                    py = 92
                    vy = 0
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
        t("STAGE " + str(stage), 104, 108, YELLOW)
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
                if v == 5:          # 基地被毁：无限生命，重建老鹰继续
                    cells[10 * COLS + 7] = 5
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
                if v == 5:          # 基地被毁：无限生命，重建老鹰继续
                    cells[10 * COLS + 7] = 5
                ebx.remove_at(i)
                eby.remove_at(i)
                ebdx.remove_at(i)
                ebdy.remove_at(i)
                continue
            if hit(ebx[i], eby[i], 2, 2, px, py, 9, 9):
                ebx.remove_at(i)
                eby.remove_at(i)
                ebdx.remove_at(i)
                ebdy.remove_at(i)
                beep(160, 90)
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
        hud("TANK BATTLE", score, "L:INF", GREEN)
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
#  游戏 5：火柴人跑酷 —— 世界自动后退 / 二段跳 / 直拳 / 一条线画的小人
# ===================================================================
# ===================================================================
#  游戏 5：火柴人枪战 —— 世界自动后退 / 拿枪打 / 木箱道具 / 每关一个 BOSS
#  木箱里出：霰弹枪 / 机枪 / 核弹（全屏清场）/ 无敌 / 分数
#  无限生命：中弹只是短暂无敌，永远不会 GAME OVER
# ===================================================================
# ===================================================================
#  游戏 5：火柴人跑酷 —— 世界自动后退 / 二段跳 / 直拳 / 一条线画的小人
#  ⚠️ 这里是「精简版」：TS 版（stickman.ts）已经升级成「拿枪 + 木箱道具 +
#     每关 BOSS」的完整玩法，Python 版为了守住「一节课能读完」的篇幅，
#     保留最朴素的跳跃 + 直拳。想对照新玩法请看同目录 stickman.ts。
# ===================================================================
def stickman_start():
    GY = 102
    PH = 16
    PX = 40
    py = GY - PH
    vy = 0.0
    jumps = 0
    onGround = True
    spd = 66.0
    dist = 0.0
    distAcc = 0.0
    score = 0
    invuln = 0.0
    punchT = 0.0
    punchCd = 0.0
    combo = 0
    comboT = 0.0
    frame = 0
    gapAcc = 0.0
    nextGap = 110.0
    over = False
    last = control.millis()
    ex: List[number] = []
    ey: List[number] = []
    et: List[number] = []

    def spawn():
        k = ri(0, 9)
        if k < 4:
            ex.append(168)
            ey.append(GY - 8)
            et.append(0)
        elif k < 8:
            ex.append(168)
            ey.append(GY - PH)
            et.append(1)
        else:
            ex.append(168)
            ey.append(70)
            et.append(2)

    def hurt():
        # 无限生命：撞到只是短暂无敌
        nonlocal invuln, vy, over, combo, comboT
        if invuln > 0 or over:
            return
        combo = 0
        comboT = 0
        invuln = 1200
        vy = -110
        beep(150, 220)

    def punch():
        nonlocal punchT, punchCd
        if punchCd > 0 or over:
            return
        punchT = 180
        punchCd = 260
        beep(760, 30)

    def jump():
        nonlocal vy, jumps
        if jumps >= 2 or over:
            return
        vy = -170
        jumps = jumps + 1
        beep(520 + jumps * 140, 40)

    def tick():
        nonlocal py, vy, jumps, onGround, spd, dist, distAcc, score
        nonlocal invuln, punchT, punchCd, combo, comboT, frame
        nonlocal gapAcc, nextGap, last, over
        if over:
            return
        now = control.millis()
        dt = (now - last) / 1000
        last = now
        if dt > 0.04:
            dt = 0.04
        frame = frame + 1

        # 越跑越快，最多 130
        spd = 66 + Math.floor(dist / 300) * 6
        if spd > 130:
            spd = 130
        dist = dist + spd * dt
        distAcc = distAcc + spd * dt
        while distAcc >= 24:          # 每 24px 得 1 分
            distAcc = distAcc - 24
            score = score + 1
        gapAcc = gapAcc + spd * dt
        if gapAcc > nextGap:
            gapAcc = 0
            nextGap = ri(88, 152) * spd / 66
            spawn()

        # 重力和落地
        vy = vy + 520 * dt
        py = py + vy * dt
        onGround = False
        if py + PH >= GY:
            py = GY - PH
            if vy > 0:
                vy = 0
                jumps = 0
            onGround = True

        if punchT > 0:
            punchT = punchT - dt * 1000
        if punchCd > 0:
            punchCd = punchCd - dt * 1000
        if invuln > 0:
            invuln = invuln - dt * 1000
        if comboT > 0:
            comboT = comboT - dt * 1000
            if comboT <= 0:
                combo = 0

        i = len(ex) - 1
        while i >= 0:
            if et[i] == 1:            # 敌兵迎过来，比背景快
                ex[i] = ex[i] - (spd - 18) * dt
            else:
                ex[i] = ex[i] - spd * dt
            dead = False
            if ex[i] < -20:
                dead = True
            # 直拳：只有出手前 120ms 有效
            if et[i] == 1 and punchT > 60 and hit(PX + 4, py + 5, 16, 7, ex[i], ey[i], 10, PH):
                score = score + 100
                combo = combo + 1
                comboT = 1500
                beep(980, 50)
                dead = True
            if not dead:
                w = 10
                h = PH
                if et[i] == 0:
                    h = 8
                elif et[i] == 2:
                    w = 5
                    h = 5
                if hit(PX + 1, py, 8, PH, ex[i], ey[i], w, h):
                    if et[i] == 2:
                        score = score + 50
                        combo = combo + 1
                        comboT = 1500
                        beep(1318, 90)
                        dead = True
                    else:
                        hurt()
                        if et[i] == 0:
                            dead = True
            if dead:
                ex.remove_at(i)
                ey.remove_at(i)
                et.remove_at(i)
            i = i - 1

    def man(x, y, swing, punching, facing, c):
        r(x + 3, y, 5, 5, c)
        line(x + 5, y + 5, x + 5, y + 11, c)
        if punching > 0:
            line(x + 5, y + 6, x + 5 + 9 * facing, y + 6, c)
            line(x + 5, y + 6, x + 2, y + 9, c)
        else:
            line(x + 5, y + 6, x + 2, y + 9 - swing, c)
            line(x + 5, y + 6, x + 8, y + 9 + swing, c)
        line(x + 5, y + 11, x + 2 - swing, y + PH, c)
        line(x + 5, y + 11, x + 8 + swing, y + PH, c)

    def draw():
        screen.fill(BLACK)
        i = 0
        while i < 8:                   # 远处楼影视差
            mx = i * 46 - Math.floor(dist / 4) % 368
            if mx < -50:
                mx = mx + 368
            r(mx, 74, 30, 28, BLUE)
            r(mx + 11, 66, 9, 9, BLUE)
            i = i + 1
        r(0, GY, 160, 120 - GY, DKBLUE)
        r(0, GY, 160, 2, GREEN)
        off = Math.floor(dist) % 13
        i = 0
        while i < 14:
            r(i * 13 - off, GY + 5 + (i % 3) * 4, 4, 1, BLACK)
            i = i + 1
        i = 0
        while i < len(ex):
            if et[i] == 0:
                r(ex[i], ey[i], 10, 8, GRAY)
                r(ex[i], ey[i], 10, 2, WHITE)
            elif et[i] == 1:
                man(ex[i], ey[i], 0, 0, -1, RED)
            else:
                r(ex[i], ey[i], 5, 5, YELLOW if (frame % 20) < 10 else ORANGE)
            i = i + 1
        if invuln <= 0 or (frame % 8) < 4:
            swing = 0
            if onGround:
                swing = 1 if Math.floor(frame / 4) % 2 == 0 else -1
            man(PX, py, swing, 1 if punchT > 0 else 0, 1, WHITE)
        if punchT > 60:
            r(PX + 16, py + 5, 4, 3, YELLOW)
        hud("STICKMAN", score, "L:INF", WHITE)
        if combo > 1:
            t("X" + str(combo) + " COMBO", 54, 11, ORANGE)
        t("A=PUNCH UP=JUMP", 2, 110, GRAY)
        if over:
            over_panel("GAME OVER", score, 0)

    # Python 版的 B 键全局留给「回菜单」，所以跳只能用上键
    controller.A.on_event(ControllerButtonEvent.PRESSED, punch)
    controller.up.on_event(ControllerButtonEvent.PRESSED, jump)
    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  游戏 6：飞机大战 —— 四向移动 / 连发 / 三种强化武器 / 全屏炸弹
#  捡到炸弹立刻引爆（Python 版的 B 键全局留给「回菜单」）
# ===================================================================
def skyraider_start():
    px = 80.0
    py = 98.0
    score = 0
    lives = 3
    wkind = 0
    wtime = 0.0
    shield = 0.0
    invuln = 0.0
    fireCd = 0.0
    spawnCd = 900.0
    dropCd = 2400.0
    flashT = 0.0
    over = False
    frame = 0
    msg = ""
    msgT = 0.0
    last = control.millis()
    WN = ["GUN", "ROCKET", "SHOTGUN", "RAPID"]
    IK = ["B", "R", "S", "F", "P", "1"]
    bx: List[number] = []
    by: List[number] = []
    bvx: List[number] = []
    bvy: List[number] = []
    bd: List[number] = []
    bs: List[number] = []
    qx: List[number] = []
    qy: List[number] = []
    qvx: List[number] = []
    qvy: List[number] = []
    ex: List[number] = []
    ey: List[number] = []
    et: List[number] = []
    ehp: List[number] = []
    ecd: List[number] = []
    ix: List[number] = []
    iy: List[number] = []
    ik: List[number] = []
    fx: List[number] = []
    fy: List[number] = []
    ft: List[number] = []

    def boom(x, y):
        if len(fx) < 30:
            fx.append(x)
            fy.append(y)
            ft.append(12)

    def add_b(x, y, vx, vy, dmg, big):
        if len(bx) > 70:
            return
        bx.append(x)
        by.append(y)
        bvx.append(vx)
        bvy.append(vy)
        bd.append(dmg)
        bs.append(big)

    def shoot():
        nonlocal fireCd
        sx = px
        sy = py - 7
        if wkind == 1:                    # 火箭弹：双发平行，穿透
            add_b(sx - 5, sy, 0, -215, 3, 1)
            add_b(sx + 5, sy, 0, -215, 3, 1)
            fireCd = 265
        elif wkind == 2:                  # 霰弹枪：5 发扇形
            k = -2
            while k <= 2:
                add_b(sx, sy, k * 46, -196, 1, 0)
                k = k + 1
            fireCd = 330
        elif wkind == 3:                  # 速射
            add_b(sx - 3, sy, 0, -252, 1, 0)
            add_b(sx + 3, sy, 0, -252, 1, 0)
            fireCd = 95
        else:
            add_b(sx, sy, 0, -246, 1, 0)
            fireCd = 165
        beep(880, 25)

    def spawn_enemy():
        rr = ri(0, 99)
        kind = 0
        if rr >= 58 and rr < 82:
            kind = 1
        elif rr >= 82:
            kind = 2
        hp = 1
        if kind > 0:
            hp = 2
        ex.append(ri(14, 146))
        ey.append(-10)
        et.append(kind)
        ehp.append(hp)
        ecd.append(ri(700, 1500))

    def drop_item(x, y):
        rr = ri(0, 99)
        k = 0
        if rr >= 26 and rr < 50:
            k = 1
        elif rr >= 50 and rr < 74:
            k = 2
        elif rr >= 74 and rr < 88:
            k = 3
        elif rr >= 88 and rr < 97:
            k = 4
        elif rr >= 97:
            k = 5
        ix.append(clamp(x, 10, 150))
        iy.append(y)
        ik.append(k)

    def shield_break():
        nonlocal shield, invuln, msg, msgT
        shield = 0
        invuln = 900
        msg = "SHIELD DOWN"
        msgT = 900
        beep(300, 160)

    def hit_player():
        # 无限生命：被打中只是掉武器 + 短暂无敌
        nonlocal wkind, wtime, invuln, px, py, over
        if invuln > 0 or over:
            return
        wkind = 0
        wtime = 0
        boom(px, py)
        beep(140, 220)
        invuln = 1600
        px = 80.0
        py = 98.0

    def use_bomb():
        nonlocal flashT, score, msg, msgT
        flashT = 360
        i = len(ex) - 1
        while i >= 0:
            boom(ex[i], ey[i])
            score = score + 120
            ex.remove_at(i)
            ey.remove_at(i)
            et.remove_at(i)
            ehp.remove_at(i)
            ecd.remove_at(i)
            i = i - 1
        while len(qx) > 0:
            qx.remove_at(len(qx) - 1)
            qy.remove_at(len(qy) - 1)
            qvx.remove_at(len(qvx) - 1)
            qvy.remove_at(len(qvy) - 1)
        msg = "BOMB!"
        msgT = 900
        beep(90, 320)

    def pickup(k):
        nonlocal wkind, wtime, shield, lives, msg, msgT, score
        if k == 0:
            use_bomb()
            return
        if k == 1:
            wkind = 1
            wtime = 12000
            msg = "ROCKET!"
        elif k == 2:
            wkind = 2
            wtime = 12000
            msg = "SHOTGUN!"
        elif k == 3:
            wkind = 3
            wtime = 12000
            msg = "RAPID!"
        elif k == 4:
            shield = 9000
            msg = "SHIELD!"
        else:
            lives = lives + 1
            msg = "1UP!"
        msgT = 1200
        score = score + 50
        beep(1318, 120)

    # ---- 每帧四小步：拆开写，单个函数别太长（静态 Python 转译有长度限制）----
    def step_player(dt):
        nonlocal px, py, fireCd, invuln, wtime, wkind, shield, flashT, msgT
        if controller.left.is_pressed():
            px = px - 96 * dt
        if controller.right.is_pressed():
            px = px + 96 * dt
        if controller.up.is_pressed():
            py = py - 88 * dt
        if controller.down.is_pressed():
            py = py + 88 * dt
        px = clamp(px, 8, 152)
        py = clamp(py, 24, 108)
        if fireCd > 0:
            fireCd = fireCd - dt * 1000
        if controller.A.is_pressed() and fireCd <= 0:
            shoot()
        if invuln > 0:
            invuln = invuln - dt * 1000
        if wtime > 0:
            wtime = wtime - dt * 1000
            if wtime <= 0:
                wtime = 0
                wkind = 0
        if shield > 0:
            shield = shield - dt * 1000
            if shield < 0:
                shield = 0
        if flashT > 0:
            flashT = flashT - dt * 1000
        if msgT > 0:
            msgT = msgT - dt * 1000

    def step_shots(dt):
        nonlocal score
        i = len(bx) - 1
        while i >= 0:
            bx[i] = bx[i] + bvx[i] * dt
            by[i] = by[i] + bvy[i] * dt
            gone = False
            if by[i] < -10 or by[i] > 132 or bx[i] < -10 or bx[i] > 170:
                gone = True
            if not gone:
                w = 3
                h = 4
                if bs[i] == 1:
                    w = 6
                    h = 9
                j = len(ex) - 1
                while j >= 0:
                    if hit(bx[i] - w / 2, by[i] - h / 2, w, h, ex[j] - 6, ey[j] - 6, 12, 12):
                        ehp[j] = ehp[j] - bd[i]
                        if bs[i] == 0:
                            gone = True
                        if ehp[j] <= 0:
                            score = score + 120
                            boom(ex[j], ey[j])
                            drop_item(ex[j], ey[j])
                            ex.remove_at(j)
                            ey.remove_at(j)
                            et.remove_at(j)
                            ehp.remove_at(j)
                            ecd.remove_at(j)
                        break
                    j = j - 1
            if gone:
                bx.remove_at(i)
                by.remove_at(i)
                bvx.remove_at(i)
                bvy.remove_at(i)
                bd.remove_at(i)
                bs.remove_at(i)
            i = i - 1
        i = len(fx) - 1
        while i >= 0:
            ft[i] = ft[i] - 1
            if ft[i] <= 0:
                fx.remove_at(i)
                fy.remove_at(i)
                ft.remove_at(i)
            i = i - 1

    def step_foes(dt):
        nonlocal score
        i = len(ex) - 1
        while i >= 0:
            sp = 58
            if et[i] == 1:
                sp = 46
            elif et[i] == 2:
                sp = 32
            ey[i] = ey[i] + sp * dt
            if et[i] == 1:                # 蛇形左右飘
                ex[i] = ex[i] + Math.cos((frame + i * 7) / 6.0) * 58 * dt
            ex[i] = clamp(ex[i], 8, 152)
            if et[i] == 2:                # 射手朝玩家开火
                ecd[i] = ecd[i] - dt * 1000
                if ecd[i] <= 0 and ey[i] > 8:
                    ecd[i] = 1250
                    ax = px - ex[i]
                    ay = py - ey[i]
                    am = Math.sqrt(ax * ax + ay * ay)
                    if am < 1:
                        am = 1
                    qx.append(ex[i])
                    qy.append(ey[i] + 5)
                    qvx.append(ax / am * 106)
                    qvy.append(ay / am * 106)
                    beep(240, 40)
            dead = False
            if ey[i] > 132:
                dead = True
            elif hit(px - 7, py - 7, 14, 14, ex[i] - 6, ey[i] - 6, 12, 12):
                boom(ex[i], ey[i])
                score = score + 80
                dead = True
                if shield > 0:
                    shield_break()
                else:
                    hit_player()
            if dead:
                ex.remove_at(i)
                ey.remove_at(i)
                et.remove_at(i)
                ehp.remove_at(i)
                ecd.remove_at(i)
            i = i - 1
        i = len(qx) - 1
        while i >= 0:
            qx[i] = qx[i] + qvx[i] * dt
            qy[i] = qy[i] + qvy[i] * dt
            gone = False
            if qy[i] > 130 or qy[i] < -6 or qx[i] < -6 or qx[i] > 166:
                gone = True
            elif hit(px - 5, py - 5, 10, 10, qx[i] - 2, qy[i] - 2, 4, 4):
                gone = True
                if shield > 0:
                    shield_break()
                else:
                    hit_player()
            if gone:
                qx.remove_at(i)
                qy.remove_at(i)
                qvx.remove_at(i)
                qvy.remove_at(i)
            i = i - 1

    def step_items(dt):
        i = len(ix) - 1
        while i >= 0:
            iy[i] = iy[i] + 34 * dt
            if iy[i] > 128:
                ix.remove_at(i)
                iy.remove_at(i)
                ik.remove_at(i)
            elif hit(px - 8, py - 8, 16, 16, ix[i] - 5, iy[i] - 5, 10, 10):
                k = ik[i]
                ix.remove_at(i)
                iy.remove_at(i)
                ik.remove_at(i)
                pickup(k)
            i = i - 1

    def tick():
        nonlocal frame, last, over, spawnCd, dropCd
        if over:
            return
        now = control.millis()
        dt = (now - last) / 1000
        last = now
        if dt > 0.04:
            dt = 0.04
        frame = frame + 1

        step_player(dt)
        spawnCd = spawnCd - dt * 1000
        if spawnCd <= 0:                  # 分数越高，来机越快
            spawnCd = 1250 - Math.floor(score / 14)
            if spawnCd < 640:
                spawnCd = 640
            spawn_enemy()
        dropCd = dropCd - dt * 1000
        if dropCd <= 0:                   # 独立的道具雨，保证出现得勤
            dropCd = ri(2900, 4900)
            drop_item(ri(18, 142), -8)
        step_shots(dt)
        if over:
            return
        step_foes(dt)
        if over:
            return
        step_items(dt)

    def draw_foes():
        i = 0
        while i < len(ex):
            x = ex[i]
            y = ey[i]
            if et[i] == 0:
                r(x - 4, y - 5, 8, 3, RED)
                r(x - 6, y - 2, 12, 3, DKRED)
                r(x - 3, y + 1, 6, 3, ORANGE)
            elif et[i] == 1:
                r(x - 2, y - 5, 4, 10, GREEN)
                r(x - 6, y - 1, 12, 3, TEAL)
            else:
                r(x - 5, y - 5, 10, 8, PURPLE)
                r(x - 3, y + 3, 6, 3, GRAY)
                r(x - 4, y - 3, 3, 3, RED)
                r(x + 1, y - 3, 3, 3, RED)
            i = i + 1
        i = 0
        while i < len(qx):
            r(qx[i] - 2, qy[i] - 2, 4, 4, RED)
            r(qx[i] - 1, qy[i] - 1, 2, 2, YELLOW)
            i = i + 1
        i = 0
        while i < len(bx):
            if bs[i] == 1:
                r(bx[i] - 3, by[i] - 4, 6, 9, ORANGE)
                r(bx[i] - 1, by[i] - 3, 2, 7, YELLOW)
            else:
                r(bx[i] - 1, by[i] - 2, 3, 4, YELLOW)
            i = i + 1

    def draw_drops():
        i = 0
        while i < len(ix):                # 道具：闪烁方块 + 一个字母
            x = ix[i]
            y = iy[i]
            blink = Math.floor(frame / 4) % 2
            c = RED
            if ik[i] == 1:
                c = ORANGE
            elif ik[i] == 2:
                c = YELLOW
            elif ik[i] == 3:
                c = CYAN
            elif ik[i] == 4:
                c = BLUE
            elif ik[i] == 5:
                c = GREEN
            r(x - 5, y - 5, 10, 10, c if blink == 0 else WHITE)
            r(x - 4, y - 4, 8, 8, BLACK)
            t(IK[ik[i]], x - 2, y - 3, c if blink == 0 else WHITE)
            i = i + 1
        i = 0
        while i < len(fx):
            rr = Math.floor(ft[i] / 3) + 2
            r(fx[i] - rr, fy[i] - rr, rr * 2, rr * 2, YELLOW if (frame % 4) < 2 else ORANGE)
            i = i + 1

    def draw():
        if flashT > 0:
            screen.fill(WHITE if flashT > 200 else CYAN)
        else:
            screen.fill(BLACK)
            i = 0
            while i < 30:                 # 星空
                sx = (i * 53 + 7) % 160
                sy = (i * 29 + Math.floor(frame * (1 + i % 3))) % 120
                screen.set_pixel(sx, sy, CYAN if i % 5 == 0 else DKBLUE)
                i = i + 1
        draw_foes()
        draw_drops()
        if not over and (invuln <= 0 or (frame % 8) < 4):
            r(px - 1, py - 7, 2, 4, WHITE)
            r(px - 2, py - 3, 4, 6, WHITE)
            r(px - 6, py - 1, 12, 3, CYAN)
            r(px - 3, py + 3, 6, 3, WHITE)
            r(px - 1, py + 6, 2, 3, YELLOW if (frame % 4) < 2 else ORANGE)
        if shield > 0:
            box(px - 9, py - 9, 18, 18, CYAN)
        hud("SKY RAIDER", score, "L:INF", WHITE)
        t(WN[wkind], 122, 1, YELLOW)
        if wtime > 0:
            r(122, 10, Math.floor(wtime / 12000 * 36), 1, YELLOW)
        if msgT > 0:
            tc(msg, 20, YELLOW)
        t("A=FIRE  B=MENU", 2, 110, GRAY)
        if over:
            over_panel("GAME OVER", score, 0)

    game.on_update(tick)
    game.on_shade(draw)


# ===================================================================
#  菜单 / 启动分支
# ===================================================================
if launch == 0:
    scene.set_background_color(BLACK)
    frame = 0

    def menu_up():
        global cursor, scroll
        if cursor == 1:
            cursor = NGAME
        else:
            cursor = cursor - 1
        if cursor - 1 < scroll:
            scroll = cursor - 1
        if cursor - 1 > scroll + VIS - 1:
            scroll = cursor - 1 - VIS + 1
        beep(660, 40)

    def menu_down():
        global cursor, scroll
        if cursor == NGAME:
            cursor = 1
        else:
            cursor = cursor + 1
        if cursor - 1 < scroll:
            scroll = cursor - 1
        if cursor - 1 > scroll + VIS - 1:
            scroll = cursor - 1 - VIS + 1
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
        # 160x120 布局：标题 2..20，6 条目一行一个（26 + i*14），底部一行提示
        r(4, 2, 152, 18, BLUE)
        box(4, 2, 152, 18, CYAN)
        tc("RETRO 6-IN-1", 8, WHITE)
        i = 0
        while i < NGAME:
            yy = 26 + i * 14
            if cursor == i + 1:
                r(8, yy - 3, 144, 13, BLUE)
                box(8, yy - 3, 144, 13, YELLOW)
                r(8, yy - 3, 2, 13, YELLOW)
            r(14, yy - 1, 8, 7, ICONS[i])
            t(str(i + 1) + ".", 28, yy, YELLOW if cursor == i + 1 else GRAY)
            t(NAMES[i], 46, yy, YELLOW if cursor == i + 1 else WHITE)
            i = i + 1
        r(4, 108, 152, 1, BLUE)
        tc("A=PLAY   B=MENU", 110, CYAN)

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
elif launch == 4:
    tanks_start()
elif launch == 5:
    stickman_start()
else:
    skyraider_start()
