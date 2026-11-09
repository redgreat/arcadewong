// 游戏：接星星（TypeScript 版 / 与同目录 main.py 完全等价）
// 讲什么：精灵、左右移动、定时生成、碰撞、计分、生命
// ================== 可以随便改的旋钮 ==================
const PLAYER_SPEED = 110
const FALL_SPEED = 70
const SPAWN_MS = 800
const START_LIVES = 3
// ====================================================

const hero = sprites.create(img`
    . . . . . . . .
    . . 4 4 4 4 . .
    . 4 4 4 4 4 4 .
    . . f f f f . .
    . . f f f f . .
    . . . f f . . .
    . . f . . f . .
    . f . . . . f .
`, SpriteKind.Player)
hero.y = 108
hero.setStayInScreen(true)
controller.moveSprite(hero, PLAYER_SPEED, 0)
scene.setBackgroundColor(9)
info.setScore(0)
info.setLife(START_LIVES)
game.splash("CATCH THE STARS!")

game.onUpdateInterval(SPAWN_MS, function () {
    const star = sprites.createProjectileFromSide(img`
        . . . . . . . .
        . . . 5 5 . . .
        . . 5 5 5 5 . .
        5 5 5 5 5 5 5 5
        . . 5 5 5 5 . .
        . . 5 . . 5 . .
        . 5 . . . . 5 .
        . . . . . . . .
    `, 0, FALL_SPEED)
    star.x = Math.randomRange(12, 148)
    star.setKind(SpriteKind.Food)
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
})

game.onUpdate(function () {
    for (const p of sprites.allOfKind(SpriteKind.Food)) {
        if (p.y > 128) {
            p.destroy()
            info.changeLifeBy(-1)
        }
    }
})
