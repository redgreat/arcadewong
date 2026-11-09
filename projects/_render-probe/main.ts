scene.setBackgroundColor(9)
game.onUpdate(function () {
    screen.fillRect(0, 0, 80, 120, 2)      // 左半屏：红
})
game.onShade(function () {
    screen.fillRect(80, 0, 80, 120, 7)     // 右半屏：绿
})
