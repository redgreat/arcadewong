// 小应用：秒表（TypeScript 版 / 与同目录 main.py 完全等价）
// 讲什么：变量、时间、布尔开关、把数字画到屏幕上
// ⚠️ 绘制必须在 game.onShade（渲染之后），放 onUpdate 会被清屏擦掉 → 黑屏
let running = false
let startMs = 0
let elapsedMs = 0

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (running) {
        elapsedMs = game.runtime() - startMs
        running = false
    } else {
        startMs = game.runtime() - elapsedMs
        running = true
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    running = false
    startMs = game.runtime()
    elapsedMs = 0
})

game.onShade(function () {
    let cur = elapsedMs
    if (running) cur = game.runtime() - startMs
    screen.fill(15)
    screen.printCenter("STOPWATCH", 16, 5)
    screen.printCenter(Math.floor(cur / 1000) + " s", 52, 7)
    screen.printCenter("A:START/STOP B:RESET", 92, 1)
})
