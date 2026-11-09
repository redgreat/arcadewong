// 游戏合集：一个 UF2 里装 3 个游戏，开机用菜单选，B 键随时回菜单
// 原理：把选择写进设备 Flash(settings)，再 game.reset() 软重启；重启后只启动选中的那个游戏
// 说明：设备一次只能"运行"一个程序，但一个程序里可以有任意多个游戏
const MENU = 0
let selected = settings.readNumber("g") || 0
// 读完立刻清零：冷启动永远回菜单，只有本次软重启才直达选中游戏
if (selected !== 0) settings.writeNumber("g", 0)
let cursor = 1

// 任何时候按 B 回菜单
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    settings.writeNumber("g", MENU)
    game.reset()
})

if (selected === MENU) {
    scene.setBackgroundColor(15)
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 1 ? 3 : cursor - 1
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 3 ? 1 : cursor + 1
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        settings.writeNumber("g", cursor)
        game.reset()
    })
    game.onShade(function () {
        screen.fill(15)
        screen.printCenter("GAME BOX", 10, 5)
        screen.printCenter("1 CATCH PIZZA", 40, cursor === 1 ? 5 : 1)
        screen.printCenter("2 FLAPPY BIRD", 58, cursor === 2 ? 5 : 1)
        screen.printCenter("3 SPACE SHOOTER", 76, cursor === 3 ? 5 : 1)
        screen.printCenter("UP/DOWN  A=PLAY  B=EXIT", 104, 1)
    })
} else if (selected === 1) {
    startCatch()
} else if (selected === 2) {
    startFlappy()
} else {
    startShooter()
}

// ---------------- 游戏 1：接披萨 ----------------
function startCatch() {
    const player = sprites.create(img`
        . . . . . . . .
        . . 4 4 4 4 . .
        . 4 4 4 4 4 4 .
        . . f f f f . .
        . . f f f f . .
        . . . f f . . .
        . . f . . f . .
        . f . . . . f .
    `, SpriteKind.Player)
    player.y = 108
    player.setStayInScreen(true)
    controller.moveSprite(player, 110, 0)
    scene.setBackgroundColor(9)
    info.setScore(0)
    info.setLife(3)

    game.onUpdateInterval(800, function () {
        const pizza = sprites.createProjectileFromSide(img`
            . . . . . . . .
            . . 4 4 4 4 . .
            . 4 2 2 2 2 4 .
            . 4 2 5 5 2 4 .
            . 4 2 2 2 2 4 .
            . . 4 4 4 4 . .
            . . . . . . . .
            . . . . . . . .
        `, 0, 70)
        pizza.x = Math.randomRange(12, 148)
        pizza.setKind(SpriteKind.Food)
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
        otherSprite.destroy()
        info.changeScoreBy(1)
        music.baDing.play()
    })
    game.onUpdate(function () {
        for (const p of sprites.allOfKind(SpriteKind.Food)) {
            if (p.y > scene.screenHeight() + 8) {
                p.destroy()
                info.changeLifeBy(-1)
            }
        }
    })
}

// ---------------- 游戏 2：飞扬的小鸟 ----------------
function startFlappy() {
    const GRAVITY = 230
    const JUMP_VY = -85
    const PIPE_SPEED = -50
    const GAP = 46
    const bird = sprites.create(img`
        . . . . . . . .
        . . 5 5 5 . . .
        . 5 5 f 5 5 . .
        . 5 5 5 5 1 1 .
        . 5 5 5 5 5 . .
        . . 5 5 5 . . .
        . . . 5 . . . .
        . . . . . . . .
    `, SpriteKind.Player)
    bird.x = 32
    bird.y = 60
    info.setScore(0)
    scene.setBackgroundColor(11)

    game.onUpdate(function () {
        bird.ay = GRAVITY
        if (bird.y < 4 || bird.y > scene.screenHeight() - 4) game.over(false)
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () { bird.vy = JUMP_VY })
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () { bird.vy = JUMP_VY })

    game.onUpdateInterval(1500, function () {
        const gapY = Math.randomRange(35, 85)
        const h1 = gapY - GAP / 2
        const h2 = scene.screenHeight() - (gapY + GAP / 2)
        const upperImg = image.create(18, h1)
        upperImg.fill(7)
        const upper = sprites.createProjectileFromSide(upperImg, PIPE_SPEED, 0)
        upper.setKind(SpriteKind.Enemy)
        upper.y = h1 / 2
        const lowerImg = image.create(18, h2)
        lowerImg.fill(7)
        const lower = sprites.createProjectileFromSide(lowerImg, PIPE_SPEED, 0)
        lower.setKind(SpriteKind.Enemy)
        lower.y = gapY + GAP / 2 + h2 / 2
        const gateImg = image.create(4, GAP)
        gateImg.fill(0)
        const gate = sprites.createProjectileFromSide(gateImg, PIPE_SPEED, 0)
        gate.setKind(SpriteKind.Food)
        gate.setFlag(SpriteFlag.Invisible, true)
        gate.y = gapY
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
        otherSprite.destroy()
        info.changeScoreBy(1)
        music.baDing.play()
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function () { game.over(false) })
}

// ---------------- 游戏 3：太空射击 ----------------
function startShooter() {
    const ship = sprites.create(img`
        . . . . 2 . . .
        . . . 2 2 2 . .
        . . 2 2 2 2 2 .
        . 2 2 2 2 2 2 2
        2 2 2 2 2 2 2 2
        . . . 4 4 . . .
        . . 4 4 4 4 . .
        . . . 5 . . . .
    `, SpriteKind.Player)
    ship.y = 104
    ship.setStayInScreen(true)
    controller.moveSprite(ship, 100, 0)
    scene.setBackgroundColor(15)
    info.setScore(0)
    info.setLife(3)

    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        const bullet = sprites.createProjectileFromSprite(img`
            . . 5 .
            . . 5 .
            . . 5 .
            . . 5 .
        `, ship, 0, -130)
        bullet.setKind(SpriteKind.Projectile)
        music.pewPew.play()
    })
    game.onUpdateInterval(700, function () {
        const enemy = sprites.createProjectileFromSide(img`
            . 7 . . . . 7 .
            . . 7 7 7 7 . .
            7 7 7 7 7 7 7 7
            . 7 7 7 7 7 7 .
            . . 7 . . 7 . .
            . 7 . . . . 7 .
            . . . . . . . .
            . . . . . . . .
        `, 0, 45)
        enemy.x = Math.randomRange(12, 148)
        enemy.setKind(SpriteKind.Enemy)
    })
    sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
        sprite.destroy()
        otherSprite.destroy()
        info.changeScoreBy(1)
        music.baDing.play()
    })
    sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
        otherSprite.destroy()
        info.changeLifeBy(-1)
    })
    game.onUpdate(function () {
        for (const e of sprites.allOfKind(SpriteKind.Enemy)) {
            if (e.y > scene.screenHeight() + 8) e.destroy()
        }
    })
}
