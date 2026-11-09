// 游戏 1：接披萨（Catch the Pizza）
// 讲什么：角色(精灵)、左右移动、随机出现、碰撞、计分、生命
// 怎么讲：先只改下面 4 个数字，让难度立刻变化，再让孩子自己改数字
// ================== 可以随便改的旋钮 ==================
const PLAYER_SPEED = 110    // 左右移动速度，越大越快
const FALL_SPEED = 70       // 披萨下落速度，越大越难
const SPAWN_MS = 800        // 每隔多少毫秒掉一个披萨，越小越难
const START_LIVES = 3       // 一开始有几条命
// ====================================================

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
controller.moveSprite(player, PLAYER_SPEED, 0)

scene.setBackgroundColor(9)
info.setScore(0)
info.setLife(START_LIVES)
game.splash("左右移动，接住披萨！")

// 每隔一段时间，从屏幕顶端随机位置掉一个披萨
game.onUpdateInterval(SPAWN_MS, function () {
    const pizza = sprites.createProjectileFromSide(img`
        . . . . . . . .
        . . 4 4 4 4 . .
        . 4 2 2 2 2 4 .
        . 4 2 5 5 2 4 .
        . 4 2 2 2 2 4 .
        . . 4 4 4 4 . .
        . . . . . . . .
        . . . . . . . .
    `, 0, FALL_SPEED)
    pizza.x = Math.randomRange(12, scene.screenWidth() - 12)
    pizza.setKind(SpriteKind.Food)
})

// 接到披萨：加 1 分，响一声
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
    music.baDing.play()
})

// 披萨掉出屏幕：扣 1 条命
game.onUpdate(function () {
    for (const p of sprites.allOfKind(SpriteKind.Food)) {
        if (p.y > scene.screenHeight() + 8) {
            p.destroy()
            info.changeLifeBy(-1)
        }
    }
})
