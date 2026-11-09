# 工具箱（Python 版 / 与同目录 main.ts 等价）
# 证明这台「游戏机」也能跑普通应用：一个 UF2 里 5 个小工具。
# 全部只用屏幕 + 6 个按键，不需要联网、文件系统或传感器扩展。
# 注意：绘制必须写在 game.on_shade() 里，否则会被每帧清屏擦掉。

MENU = 0
TOOLS = ["CALCULATOR", "STOPWATCH", "DICE", "TORCH", "REACTION"]
selected = settings.read_number("t")
if selected != 0:
    settings.write_number("t", 0)
cursor = 1


def back_to_menu():
    settings.write_number("t", MENU)
    game.reset()


controller.B.on_event(ControllerButtonEvent.PRESSED, back_to_menu)


# ---------------- 菜单 ----------------
def menu_up():
    global cursor
    if cursor == 1:
        cursor = 5
    else:
        cursor = cursor - 1


def menu_down():
    global cursor
    if cursor == 5:
        cursor = 1
    else:
        cursor = cursor + 1


def menu_play():
    settings.write_number("t", cursor)
    game.reset()


def draw_menu():
    screen.fill(15)
    screen.print_center("TOOL BOX", 4, 5)
    i = 0
    while i < 5:
        color = 5 if cursor == i + 1 else 1
        screen.print_center(str(i + 1) + " " + TOOLS[i], 24 + i * 18, color)
        i = i + 1
    screen.print_center("UP/DOWN A=OPEN B=EXIT", 112, 1)


# ---------------- 1. 计算器 ----------------
def start_calculator():
    a = [1]
    b = [1]
    op = [0]
    syms = ["+", "-", "*", "/"]

    def a_up():
        a[0] = a[0] + 1

    def a_down():
        a[0] = a[0] - 1

    def b_up():
        b[0] = b[0] + 1

    def b_down():
        b[0] = b[0] - 1

    def next_op():
        op[0] = (op[0] + 1) % 4

    def draw():
        r = 0
        if op[0] == 0:
            r = a[0] + b[0]
        elif op[0] == 1:
            r = a[0] - b[0]
        elif op[0] == 2:
            r = a[0] * b[0]
        else:
            r = Math.floor(a[0] / b[0])
        screen.fill(15)
        screen.print_center("CALCULATOR", 8, 5)
        screen.print_center(str(a[0]) + " " + syms[op[0]] + " " + str(b[0]), 44, 7)
        screen.print_center("= " + str(r), 66, 2)
        screen.print_center("U/D:A  L/R:B  A:OP", 104, 1)

    controller.up.on_event(ControllerButtonEvent.PRESSED, a_up)
    controller.down.on_event(ControllerButtonEvent.PRESSED, a_down)
    controller.right.on_event(ControllerButtonEvent.PRESSED, b_up)
    controller.left.on_event(ControllerButtonEvent.PRESSED, b_down)
    controller.A.on_event(ControllerButtonEvent.PRESSED, next_op)
    game.on_shade(draw)


# ---------------- 2. 秒表 ----------------
def start_stopwatch():
    # 用单元素列表保存状态：静态 Python 里给闭包中的变量赋值必须用 global，
    # 用容器则可以直接改元素，代码更短也更好讲。
    running = [False]
    startMs = [0]
    elapsed = [0]

    def toggle():
        if running[0]:
            elapsed[0] = game.runtime() - startMs[0]
            running[0] = False
        else:
            startMs[0] = game.runtime() - elapsed[0]
            running[0] = True

    def do_reset():
        running[0] = False
        elapsed[0] = 0

    def draw():
        if running[0]:
            elapsed[0] = game.runtime() - startMs[0]
        screen.fill(15)
        screen.print_center("STOPWATCH", 8, 5)
        screen.print_center(str(Math.floor(elapsed[0] / 1000)) + " s", 52, 7)
        screen.print_center("A:START/STOP  UP:RESET", 104, 1)

    controller.A.on_event(ControllerButtonEvent.PRESSED, toggle)
    controller.up.on_event(ControllerButtonEvent.PRESSED, do_reset)
    game.on_shade(draw)


# ---------------- 3. 电子骰子 ----------------
def start_dice():
    n = [0]

    def roll():
        n[0] = randint(1, 6)

    def draw():
        screen.fill(11)
        screen.print_center("DICE", 12, 5)
        screen.print_center(str(n[0]), 54, 2)
        screen.print_center("A: ROLL", 104, 1)

    controller.A.on_event(ControllerButtonEvent.PRESSED, roll)
    game.on_shade(draw)


# ---------------- 4. 手电筒 ----------------
def start_torch():
    level = [0]

    def change():
        level[0] = (level[0] + 1) % 3

    def draw():
        if level[0] == 0:
            screen.fill(1)
        elif level[0] == 1:
            screen.fill(2)
        else:
            screen.fill(15)
        screen.print_center("A: CHANGE COLOR", 108, 0)

    controller.A.on_event(ControllerButtonEvent.PRESSED, change)
    game.on_shade(draw)


# ---------------- 5. 反应速度测试 ----------------
def start_reaction():
    state = [0]     # 0 待开始 / 1 随机等待 / 2 变绿计时 / 3 显示结果
    t0 = [0]
    waitUntil = [0]
    result = [0]

    def press():
        if state[0] == 0:
            state[0] = 1
            waitUntil[0] = game.runtime() + randint(1000, 4000)
        elif state[0] == 2:
            result[0] = game.runtime() - t0[0]
            state[0] = 3
        elif state[0] == 3:
            state[0] = 0

    def draw():
        screen.fill(15)
        if state[0] == 0:
            screen.print_center("REACTION TEST", 34, 5)
            screen.print_center("A: START", 64, 1)
        elif state[0] == 1:
            screen.print_center("WAIT...", 52, 3)
            if game.runtime() > waitUntil[0]:
                state[0] = 2
                t0[0] = game.runtime()
        elif state[0] == 2:
            screen.fill(7)
            screen.print_center("PRESS A!", 52, 0)
        else:
            screen.print_center(str(result[0]) + " ms", 52, 5)
            screen.print_center("A: AGAIN", 82, 1)

    controller.A.on_event(ControllerButtonEvent.PRESSED, press)
    game.on_shade(draw)


# ---------------- 启动分支 ----------------
if selected == MENU:
    scene.set_background_color(15)
    controller.up.on_event(ControllerButtonEvent.PRESSED, menu_up)
    controller.down.on_event(ControllerButtonEvent.PRESSED, menu_down)
    controller.A.on_event(ControllerButtonEvent.PRESSED, menu_play)
    game.on_shade(draw_menu)
elif selected == 1:
    start_calculator()
elif selected == 2:
    start_stopwatch()
elif selected == 3:
    start_dice()
elif selected == 4:
    start_torch()
else:
    start_reaction()
