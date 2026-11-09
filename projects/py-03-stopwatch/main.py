# 小应用：秒表 / 反应计时（Python 版，不是游戏）
# 讲什么：变量、时间、布尔开关、把数字画到屏幕上
running = False
start_ms = 0
elapsed_ms = 0

def toggle():
    global running, start_ms, elapsed_ms
    if running:
        elapsed_ms = game.runtime() - start_ms
        running = False
    else:
        start_ms = game.runtime() - elapsed_ms
        running = True

def reset():
    global running, start_ms, elapsed_ms
    running = False
    start_ms = game.runtime()
    elapsed_ms = 0

def draw():
    screen.fill(15)
    screen.print_center("STOPWATCH", 16, 5)
    # 用局部变量，避免在 draw 里给全局变量赋值（静态 Python 会误判为局部）
    cur = elapsed_ms
    if running:
        cur = game.runtime() - start_ms
    secs = Math.floor(cur / 1000)
    screen.print_center(str(secs) + " s", 52, 7)
    screen.print_center("A:START/STOP B:RESET", 92, 1)

controller.A.on_event(ControllerButtonEvent.PRESSED, toggle)
controller.B.on_event(ControllerButtonEvent.PRESSED, reset)
game.on_shade(draw)
