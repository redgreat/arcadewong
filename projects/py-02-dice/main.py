# 小应用：电子骰子（Python 版，不是游戏）
# 讲什么：随机数、事件、把数字显示出来；桌游/课堂抽签都能用
SIDES = 6

def roll():
    n = randint(1, SIDES)
    game.splash("YOU ROLLED", str(n))

def roll_again():
    # 连续掷两次，用来讲"重复调用同一个函数"
    game.splash("FIRST", str(randint(1, SIDES)))
    game.splash("SECOND", str(randint(1, SIDES)))

controller.A.on_event(ControllerButtonEvent.PRESSED, roll)
controller.B.on_event(ControllerButtonEvent.PRESSED, roll_again)
scene.set_background_color(11)
game.splash("A: ROLL  B: TWO DICE")
