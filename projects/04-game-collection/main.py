# 游戏合集（Python 版 / 与同目录 main.ts 等价）
# 一个 UF2 里装 3 个游戏，开机用菜单选，B 键随时回菜单。
# 原理：把选择写进设备 Flash（settings），再 game.reset() 软重启；
#       重启后程序从头执行，只启动选中的那个游戏。
# 注意：所有「直接画屏」的代码必须放在 game.on_shade() 里，
#       放在 on_update() 会被引擎每帧的 background.draw() 擦掉（黑屏）。

MENU = 0
selected = settings.read_number("g")
if selected != 0:
    settings.write_number("g", 0)   # 读完立刻清零：冷启动永远回菜单
cursor = 1


def back_to_menu():
    settings.write_number("g", MENU)
    game.reset()


controller.B.on_event(ControllerButtonEvent.PRESSED, back_to_menu)


# ---------------- 菜单 ----------------
def menu_up():
    global cursor
    if cursor == 1:
        cursor = 3
    else:
        cursor = cursor - 1


def menu_down():
    global cursor
    if cursor == 3:
        cursor = 1
    else:
        cursor = cursor + 1


def menu_play():
    settings.write_number("g", cursor)   # 只读 cursor，不用 global
    game.reset()


def draw_menu():
    screen.fill(15)
    screen.print_center("GAME BOX", 10, 5)
    screen.print_center("1 CATCH PIZZA", 40, 5 if cursor == 1 else 1)
    screen.print_center("2 FLAPPY BIRD", 58, 5 if cursor == 2 else 1)
    screen.print_center("3 SPACE SHOOTER", 76, 5 if cursor == 3 else 1)
    screen.print_center("UP/DOWN  A=PLAY  B=EXIT", 104, 1)


# ---------------- 游戏 1：接披萨 ----------------
def start_catch():
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
    controller.move_sprite(hero, 110, 0)
    scene.set_background_color(9)
    info.set_score(0)
    info.set_life(3)

    def spawn():
        pizza = sprites.create_projectile_from_side(img("""
. . . . . . . .
. . 4 4 4 4 . .
. 4 2 2 2 2 4 .
. 4 2 5 5 2 4 .
. 4 2 2 2 2 4 .
. . 4 4 4 4 . .
. . . . . . . .
. . . . . . . .
"""), 0, 70)
        pizza.x = randint(12, 148)
        pizza.set_kind(SpriteKind.food)

    def catched(sprite, otherSprite):
        otherSprite.destroy()
        info.change_score_by(1)
        music.ba_ding.play()

    def missed():
        for p in sprites.all_of_kind(SpriteKind.food):
            if p.y > 128:
                p.destroy()
                info.change_life_by(-1)

    game.on_update_interval(800, spawn)
    sprites.on_overlap(SpriteKind.player, SpriteKind.food, catched)
    game.on_update(missed)


# ---------------- 游戏 2：飞扬的小鸟 ----------------
def start_flappy():
    GRAVITY = 230
    JUMP_VY = -85
    PIPE_SPEED = -50
    GAP = 46
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

    def gravity():
        bird.ay = GRAVITY
        if bird.y < 4 or bird.y > 116:
            game.over(False)

    def flap():
        bird.vy = JUMP_VY

    def pipes():
        gapY = randint(35, 85)
        h1 = gapY - GAP / 2
        h2 = 120 - (gapY + GAP / 2)
        upImg = image.create(18, h1)
        upImg.fill(7)
        up = sprites.create_projectile_from_side(upImg, PIPE_SPEED, 0)
        up.set_kind(SpriteKind.enemy)
        up.y = h1 / 2
        dnImg = image.create(18, h2)
        dnImg.fill(7)
        dn = sprites.create_projectile_from_side(dnImg, PIPE_SPEED, 0)
        dn.set_kind(SpriteKind.enemy)
        dn.y = gapY + GAP / 2 + h2 / 2
        gateImg = image.create(4, GAP)
        gateImg.fill(0)
        gate = sprites.create_projectile_from_side(gateImg, PIPE_SPEED, 0)
        gate.set_kind(SpriteKind.food)
        gate.set_flag(SpriteFlag.INVISIBLE, True)
        gate.y = gapY

    def gate(sprite, otherSprite):
        otherSprite.destroy()
        info.change_score_by(1)
        music.ba_ding.play()

    def crash(sprite, otherSprite):
        game.over(False)

    game.on_update(gravity)
    controller.A.on_event(ControllerButtonEvent.PRESSED, flap)
    controller.up.on_event(ControllerButtonEvent.PRESSED, flap)
    game.on_update_interval(1500, pipes)
    sprites.on_overlap(SpriteKind.player, SpriteKind.food, gate)
    sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, crash)


# ---------------- 游戏 3：太空射击 ----------------
def start_shooter():
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
    controller.move_sprite(ship, 100, 0)
    scene.set_background_color(15)
    info.set_score(0)
    info.set_life(3)

    def fire():
        bullet = sprites.create_projectile_from_sprite(img("""
. . 5 .
. . 5 .
. . 5 .
. . 5 .
"""), ship, 0, -130)
        bullet.set_kind(SpriteKind.projectile)
        music.pew_pew.play()

    def spawn():
        enemy = sprites.create_projectile_from_side(img("""
. 7 . . . . 7 .
. . 7 7 7 7 . .
7 7 7 7 7 7 7 7
. 7 7 7 7 7 7 .
. . 7 . . 7 . .
. 7 . . . . 7 .
. . . . . . . .
. . . . . . . .
"""), 0, 45)
        enemy.x = randint(12, 148)
        enemy.set_kind(SpriteKind.enemy)

    def hit(bullet, enemy):
        bullet.destroy()
        enemy.destroy()
        info.change_score_by(1)
        music.ba_ding.play()

    def hurt(shipSprite, enemy):
        enemy.destroy()
        info.change_life_by(-1)

    def recycle():
        for e in sprites.all_of_kind(SpriteKind.enemy):
            if e.y > 128:
                e.destroy()

    controller.A.on_event(ControllerButtonEvent.PRESSED, fire)
    game.on_update_interval(700, spawn)
    sprites.on_overlap(SpriteKind.projectile, SpriteKind.enemy, hit)
    sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, hurt)
    game.on_update(recycle)


# ---------------- 启动分支 ----------------
if selected == MENU:
    scene.set_background_color(15)
    controller.up.on_event(ControllerButtonEvent.PRESSED, menu_up)
    controller.down.on_event(ControllerButtonEvent.PRESSED, menu_down)
    controller.A.on_event(ControllerButtonEvent.PRESSED, menu_play)
    game.on_shade(draw_menu)
elif selected == 1:
    start_catch()
elif selected == 2:
    start_flappy()
else:
    start_shooter()
