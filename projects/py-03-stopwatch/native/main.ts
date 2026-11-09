//  小应用：秒表 / 反应计时（Python 版，不是游戏）
//  讲什么：变量、时间、布尔开关、把数字画到屏幕上
let running = false
let start_ms = 0
let elapsed_ms = 0
controller.A.onEvent(ControllerButtonEvent.Pressed, function toggle() {
    
    if (running) {
        elapsed_ms = game.runtime() - start_ms
        running = false
    } else {
        start_ms = game.runtime() - elapsed_ms
        running = true
    }
    
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function reset() {
    
    running = false
    start_ms = game.runtime()
    elapsed_ms = 0
})
game.onShade(function draw() {
    screen.fill(15)
    screen.printCenter("STOPWATCH", 16, 5)
    //  用局部变量，避免在 draw 里给全局变量赋值（静态 Python 会误判为局部）
    let cur = elapsed_ms
    if (running) {
        cur = game.runtime() - start_ms
    }
    
    let secs = Math.floor(cur / 1000)
    screen.printCenter("" + secs + " s", 52, 7)
    screen.printCenter("A:START/STOP B:RESET", 92, 1)
})
