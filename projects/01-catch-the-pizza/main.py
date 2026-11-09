# 游戏 1：接披萨（Python 版 / 与同目录 main.ts 完全等价）
# 讲什么：精灵、左右移动、随机出现、碰撞、计分、生命
# 注意：这是 MakeCode 的「静态 Python」，不是 MicroPython；不能 import，不能用 lambda。
# ================== 可以随便改的旋钮 ==================
PLAYER_SPEED = 110   # 左右移动速度，越大越快
FALL_SPEED = 70      # 披萨下落速度，越大越难
SPAWN_MS = 800       # 每隔多少毫秒掉一个披萨，越小越难
START_LIVES = 3      # 一开始有几条命
# ====================================================

hero = sprites.create(img("""
. . . . . . . .
. . 4 4 4 4 . .
. 4 4 4 4 4 4 .
. . f f f f . .
. . f f f f . .
. . . f f . . .
. . f . . f . .
. f . . . . f .
"""), SpriteKind.player)
hero.y = 108
hero.set_stay_in_screen(True)
controller.move_sprite(hero, PLAYER_SPEED, 0)

scene.set_background_color(9)
info.set_score(0)
info.set_life(START_LIVES)
game.splash("MOVE LEFT / RIGHT, CATCH PIZZA!")


def on_spawn():
    """每隔 SPAWN_MS 毫秒被调用一次：从屏幕顶端随机位置掉一个披萨。"""
    pizza = sprites.create_projectile_from_side(img("""
. . . . . . . .
. . 4 4 4 4 . .
. 4 2 2 2 2 4 .
. 4 2 5 5 2 4 .
. 4 2 2 2 2 4 .
. . 4 4 4 4 . .
. . . . . . . .
. . . . . . . .
"""), 0, FALL_SPEED)
    pizza.x = randint(12, 148)
    pizza.set_kind(SpriteKind.food)


def on_catch(sprite, otherSprite):
    """玩家碰到食物：食物消失、加 1 分、响一声。"""
    otherSprite.destroy()
    info.change_score_by(1)
    music.ba_ding.play()


def check_missed():
    """每一帧检查：掉出屏幕的披萨要销毁，并扣 1 条命。"""
    for p in sprites.all_of_kind(SpriteKind.food):
        if p.y > 128:
            p.destroy()
            info.change_life_by(-1)


game.on_update_interval(SPAWN_MS, on_spawn)
sprites.on_overlap(SpriteKind.player, SpriteKind.food, on_catch)
game.on_update(check_missed)
