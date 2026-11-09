//  游戏：接星星（Python 版，对应 01-catch-the-pizza）
//  网页版把右上角切到 Python 就能看到这种写法；不是 MicroPython，是 MakeCode 的静态 Python
//  ================== 可以随便改的旋钮 ==================
let PLAYER_SPEED = 110
let FALL_SPEED = 70
let SPAWN_MS = 800
let START_LIVES = 3
//  ====================================================
let hero = sprites.create(img`
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
game.onUpdateInterval(SPAWN_MS, function on_spawn() {
    let star = sprites.createProjectileFromSide(img`
. . . . . . . .
. . . 5 5 . . .
. . 5 5 5 5 . .
5 5 5 5 5 5 5 5
. . 5 5 5 5 . .
. . 5 . . 5 . .
. 5 . . . . 5 .
. . . . . . . .
`, 0, FALL_SPEED)
    star.x = randint(12, 148)
    star.setKind(SpriteKind.Food)
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function on_catch(sprite: Sprite, otherSprite: Sprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
})
game.onUpdate(function on_update() {
    for (let p of sprites.allOfKind(SpriteKind.Food)) {
        if (p.y > 128) {
            p.destroy()
            info.changeLifeBy(-1)
        }
        
    }
})
