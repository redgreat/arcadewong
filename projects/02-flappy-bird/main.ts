// 游戏 2：飞扬的小鸟（Flappy Bird）
// 讲什么：重力、速度、按键事件、随机生成障碍、穿过得分、碰撞结束
// 怎么讲：改 GRAVITY / JUMP_VY 感受"手感"，改 GAP 感受难度
// ================== 可以随便改的旋钮 ==================
const GRAVITY = 230         // 重力，越大掉得越快
const JUMP_VY = -85         // 按 A 时的上升速度（负数是向上）
const PIPE_SPEED = -50      // 柱子向左移动的速度
const PIPE_INTERVAL = 1500  // 每隔多久出现一组柱子
const GAP = 46              // 上下柱子之间的缝隙，越小越难
// ====================================================

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

// 重力一直把小鸟往下拉；飞出上下边界就结束
game.onUpdate(function () {
    bird.ay = GRAVITY
    if (bird.y < 4 || bird.y > scene.screenHeight() - 4) {
        game.over(false)
    }
})

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    bird.vy = JUMP_VY
})
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    bird.vy = JUMP_VY
})

// 每次生成：上面柱子 + 下面柱子 + 中间一条看不见的"得分线"
game.onUpdateInterval(PIPE_INTERVAL, function () {
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

// 穿过缝隙：加 1 分
sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    otherSprite.destroy()
    info.changeScoreBy(1)
    music.baDing.play()
})

// 撞到柱子：游戏结束
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function () {
    game.over(false)
})
