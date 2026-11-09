# 游戏：接星星（Python 版，对应 01-catch-the-pizza）
# 网页版把右上角切到 Python 就能看到这种写法；不是 MicroPython，是 MakeCode 的静态 Python
# ================== 可以随便改的旋钮 ==================
PLAYER_SPEED = 110
FALL_SPEED = 70
SPAWN_MS = 800
START_LIVES = 3
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
game.splash("CATCH THE STARS!")

def on_spawn():
    star = sprites.create_projectile_from_side(img("""
. . . . . . . .
. . . 5 5 . . .
. . 5 5 5 5 . .
5 5 5 5 5 5 5 5
. . 5 5 5 5 . .
. . 5 . . 5 . .
. 5 . . . . 5 .
. . . . . . . .
"""), 0, FALL_SPEED)
    star.x = randint(12, 148)
    star.set_kind(SpriteKind.food)

def on_catch(sprite, otherSprite):
    otherSprite.destroy()
    info.change_score_by(1)

def on_update():
    for p in sprites.all_of_kind(SpriteKind.food):
        if p.y > 128:
            p.destroy()
            info.change_life_by(-1)

game.on_update_interval(SPAWN_MS, on_spawn)
sprites.on_overlap(SpriteKind.player, SpriteKind.food, on_catch)
game.on_update(on_update)
