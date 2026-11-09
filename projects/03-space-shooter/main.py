# 游戏 3：太空射击（Python 版 / 与同目录 main.ts 完全等价）
# 讲什么：发射子弹、两种碰撞、分数与生命、敌人的生成与回收
# ================== 可以随便改的旋钮 ==================
SHIP_SPEED = 100     # 飞船左右移动速度
BULLET_SPEED = -130  # 子弹向上飞的速度（负数 = 向上）
ENEMY_SPEED = 45     # 敌人下落速度
SPAWN_MS = 700       # 每隔多久出现一个敌人
START_LIVES = 3      # 一开始有几条命
# ====================================================

ship = sprites.create(img("""
. . . . 2 . . .
. . . 2 2 2 . .
. . 2 2 2 2 2 .
. 2 2 2 2 2 2 2
2 2 2 2 2 2 2 2
. . . 4 4 . . .
. . 4 4 4 4 . .
. . . 5 . . . .
"""), SpriteKind.player)
ship.y = 104
ship.set_stay_in_screen(True)
controller.move_sprite(ship, SHIP_SPEED, 0)

scene.set_background_color(15)
info.set_score(0)
info.set_life(START_LIVES)


def fire():
    """按 A：从飞船位置生成一颗向上飞的子弹。"""
    bullet = sprites.create_projectile_from_sprite(img("""
. . 5 .
. . 5 .
. . 5 .
. . 5 .
"""), ship, 0, BULLET_SPEED)
    bullet.set_kind(SpriteKind.projectile)
    music.pew_pew.play()


def spawn_enemy():
    enemy = sprites.create_projectile_from_side(img("""
. 7 . . . . 7 .
. . 7 7 7 7 . .
7 7 7 7 7 7 7 7
. 7 7 7 7 7 7 .
. . 7 . . 7 . .
. 7 . . . . 7 .
. . . . . . . .
. . . . . . . .
"""), 0, ENEMY_SPEED)
    enemy.x = randint(12, 148)
    enemy.set_kind(SpriteKind.enemy)


def hit_enemy(bullet, enemy):
    """子弹打中敌人：两个精灵都消失，加 1 分。"""
    bullet.destroy()
    enemy.destroy()
    info.change_score_by(1)
    music.ba_ding.play()


def hit_ship(shipSprite, enemy):
    """敌人撞到飞船：敌人消失，扣 1 条命。"""
    enemy.destroy()
    info.change_life_by(-1)


def recycle():
    """飞出屏幕的敌人必须回收，否则会越积越多、拖慢机器。"""
    for e in sprites.all_of_kind(SpriteKind.enemy):
        if e.y > 128:
            e.destroy()


controller.A.on_event(ControllerButtonEvent.PRESSED, fire)
game.on_update_interval(SPAWN_MS, spawn_enemy)
sprites.on_overlap(SpriteKind.projectile, SpriteKind.enemy, hit_enemy)
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, hit_ship)
game.on_update(recycle)
