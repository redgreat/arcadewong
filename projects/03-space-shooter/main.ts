// 游戏 3：太空射击（Space Shooter）
// 讲什么：发射子弹、两种碰撞、分数与生命、敌人的生成与回收
// 怎么讲：先改子弹速度和敌人出现间隔，再看"打中"和"被打中"两条规则
// ================== 可以随便改的旋钮 ==================
const SHIP_SPEED = 100      // 飞船左右移动速度
const BULLET_SPEED = -130   // 子弹向上飞的速度（负数=向上）
const ENEMY_SPEED = 45      // 敌人下落速度
const SPAWN_MS = 700        // 每隔多久出现一个敌人
const START_LIVES = 3       // 一开始有几条命
// ====================================================

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
controller.moveSprite(ship, SHIP_SPEED, 0)

scene.setBackgroundColor(15)
info.setScore(0)
info.setLife(START_LIVES)

// 按 A 发射一颗子弹
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    const bullet = sprites.createProjectileFromSprite(img`
        . . 5 .
        . . 5 .
        . . 5 .
        . . 5 .
    `, ship, 0, BULLET_SPEED)
    bullet.setKind(SpriteKind.Projectile)
    music.pewPew.play()
})

// 敌人从屏幕上方随机位置落下
game.onUpdateInterval(SPAWN_MS, function () {
    const enemy = sprites.createProjectileFromSide(img`
        . 7 . . . . 7 .
        . . 7 7 7 7 . .
        7 7 7 7 7 7 7 7
        . 7 7 7 7 7 7 .
        . . 7 . . 7 . .
        . 7 . . . . 7 .
        . . . . . . . .
        . . . . . . . .
    `, 0, ENEMY_SPEED)
    enemy.x = Math.randomRange(12, scene.screenWidth() - 12)
    enemy.setKind(SpriteKind.Enemy)
})

// 子弹打中敌人：加 1 分
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (sprite, otherSprite) {
    sprite.destroy()
    otherSprite.destroy()
    info.changeScoreBy(1)
    music.baDing.play()
})

// 敌人撞到飞船：扣 1 条命
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeLifeBy(-1)
})

// 敌人飞出屏幕就回收，避免越积越多
game.onUpdate(function () {
    for (const e of sprites.allOfKind(SpriteKind.Enemy)) {
        if (e.y > scene.screenHeight() + 8) {
            e.destroy()
        }
    }
})
