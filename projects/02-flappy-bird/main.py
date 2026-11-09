# 游戏 2：飞扬的小鸟（Python 版 / 与同目录 main.ts 完全等价）
# 讲什么：重力、速度、按键事件、随机障碍、穿过缝隙得分、碰撞结束
# ================== 可以随便改的旋钮 ==================
GRAVITY = 230        # 重力，越大掉得越快
JUMP_VY = -85        # 按 A 时的上升速度（负数是向上）
PIPE_SPEED = -50     # 柱子向左移动的速度
PIPE_INTERVAL = 1500 # 每隔多久出现一组柱子
GAP = 46             # 上下柱子之间的缝隙，越小越难
# ====================================================

bird = sprites.create(img("""
. . . . . . . .
. . 5 5 5 . . .
. 5 5 f 5 5 . .
. 5 5 5 5 1 1 .
. 5 5 5 5 5 . .
. . 5 5 5 . . .
. . . 5 . . . .
. . . . . . . .
"""), SpriteKind.player)
bird.x = 32
bird.y = 60
info.set_score(0)
scene.set_background_color(11)


def apply_gravity():
    """每一帧都要重新设一次 ay，小鸟才会持续下落；飞出上下边界就结束。"""
    bird.ay = GRAVITY
    if bird.y < 4 or bird.y > 116:
        game.over(False)


def flap():
    """按 A 或 ↑：把竖直速度改成向上，重力下一帧会再把它拉回来。"""
    bird.vy = JUMP_VY


def spawn_pipes():
    """一次生成三样东西：上柱、下柱，以及中间一条看不见的『得分线』。"""
    gapY = randint(35, 85)
    h1 = gapY - GAP / 2
    h2 = 120 - (gapY + GAP / 2)

    upperImg = image.create(18, h1)
    upperImg.fill(7)
    upper = sprites.create_projectile_from_side(upperImg, PIPE_SPEED, 0)
    upper.set_kind(SpriteKind.enemy)
    upper.y = h1 / 2

    lowerImg = image.create(18, h2)
    lowerImg.fill(7)
    lower = sprites.create_projectile_from_side(lowerImg, PIPE_SPEED, 0)
    lower.set_kind(SpriteKind.enemy)
    lower.y = gapY + GAP / 2 + h2 / 2

    # 透明的 Food 精灵：碰到它就说明穿过了缝隙，用来计分
    gateImg = image.create(4, GAP)
    gateImg.fill(0)
    gate = sprites.create_projectile_from_side(gateImg, PIPE_SPEED, 0)
    gate.set_kind(SpriteKind.food)
    gate.set_flag(SpriteFlag.INVISIBLE, True)
    gate.y = gapY


def on_gate(sprite, otherSprite):
    otherSprite.destroy()
    info.change_score_by(1)
    music.ba_ding.play()


def on_crash(sprite, otherSprite):
    game.over(False)


game.on_update(apply_gravity)
controller.A.on_event(ControllerButtonEvent.PRESSED, flap)
controller.up.on_event(ControllerButtonEvent.PRESSED, flap)
game.on_update_interval(PIPE_INTERVAL, spawn_pipes)
sprites.on_overlap(SpriteKind.player, SpriteKind.food, on_gate)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, on_crash)
