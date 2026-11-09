// 工具箱：证明这台"游戏机"也能跑普通应用（一个 UF2 里 5 个小工具）
// 菜单选择、B 返回菜单；全部只用屏幕 + 6 个按键，不需要联网/文件/传感器扩展
const MENU = 0
const TOOLS = ["CALCULATOR", "STOPWATCH", "DICE", "TORCH", "REACTION"]
let selected = settings.readNumber("t") || 0
// 读完立刻清零：冷启动永远回菜单，只有本次软重启才直达选中工具
if (selected !== 0) settings.writeNumber("t", 0)
let cursor = 1

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    settings.writeNumber("t", MENU)
    game.reset()
})

if (selected === MENU) {
    scene.setBackgroundColor(15)
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 1 ? 5 : cursor - 1
    })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
        cursor = cursor === 5 ? 1 : cursor + 1
    })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        settings.writeNumber("t", cursor)
        game.reset()
    })
    game.onShade(function () {
        screen.fill(15)
        screen.printCenter("TOOL BOX", 4, 5)
        for (let i = 0; i < 5; i++) {
            screen.printCenter((i + 1) + " " + TOOLS[i], 24 + i * 18, cursor === i + 1 ? 5 : 1)
        }
        screen.printCenter("UP/DOWN A=OPEN B=EXIT", 112, 1)
    })
} else if (selected === 1) {
    startCalculator()
} else if (selected === 2) {
    startStopwatch()
} else if (selected === 3) {
    startDice()
} else if (selected === 4) {
    startTorch()
} else {
    startReaction()
}

// ---------------- 1. 计算器 ----------------
function startCalculator() {
    let a = 1
    let b = 1
    let op = 0
    const syms = ["+", "-", "*", "/"]
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () { a = a + 1 })
    controller.down.onEvent(ControllerButtonEvent.Pressed, function () { a = a - 1 })
    controller.right.onEvent(ControllerButtonEvent.Pressed, function () { b = b + 1 })
    controller.left.onEvent(ControllerButtonEvent.Pressed, function () { b = b - 1 })
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () { op = (op + 1) % 4 })
    game.onShade(function () {
        let r = 0
        if (op === 0) r = a + b
        else if (op === 1) r = a - b
        else if (op === 2) r = a * b
        else r = Math.floor(a / b)
        screen.fill(15)
        screen.printCenter("CALCULATOR", 8, 5)
        screen.printCenter(a + " " + syms[op] + " " + b, 44, 7)
        screen.printCenter("= " + r, 66, 2)
        screen.printCenter("U/D:A  L/R:B  A:OP", 104, 1)
    })
}

// ---------------- 2. 秒表 ----------------
function startStopwatch() {
    let running = false
    let startMs = 0
    let elapsed = 0
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (running) {
            elapsed = game.runtime() - startMs
            running = false
        } else {
            startMs = game.runtime() - elapsed
            running = true
        }
    })
    controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
        running = false
        elapsed = 0
    })
    game.onShade(function () {
        if (running) elapsed = game.runtime() - startMs
        screen.fill(15)
        screen.printCenter("STOPWATCH", 8, 5)
        screen.printCenter(Math.floor(elapsed / 1000) + " s", 52, 7)
        screen.printCenter("A:START/STOP  UP:RESET", 104, 1)
    })
}

// ---------------- 3. 电子骰子 ----------------
function startDice() {
    let n = 0
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        n = Math.randomRange(1, 6)
    })
    game.onShade(function () {
        screen.fill(11)
        screen.printCenter("DICE", 12, 5)
        screen.printCenter("" + n, 54, 2)
        screen.printCenter("A: ROLL", 104, 1)
    })
}

// ---------------- 4. 手电筒 ----------------
function startTorch() {
    let level = 0
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        level = (level + 1) % 3
    })
    game.onShade(function () {
        if (level === 0) screen.fill(1)
        else if (level === 1) screen.fill(2)
        else screen.fill(15)
        screen.printCenter("A: CHANGE COLOR", 108, 0)
    })
}

// ---------------- 5. 反应速度测试 ----------------
function startReaction() {
    let state = 0   // 0 待开始 1 等待 2 变绿计时 3 结果
    let t0 = 0
    let waitUntil = 0
    let result = 0
    controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
        if (state === 0) {
            state = 1
            waitUntil = game.runtime() + Math.randomRange(1000, 4000)
        } else if (state === 2) {
            result = game.runtime() - t0
            state = 3
        } else if (state === 3) {
            state = 0
        }
    })
    game.onShade(function () {
        screen.fill(15)
        if (state === 0) {
            screen.printCenter("REACTION TEST", 34, 5)
            screen.printCenter("A: START", 64, 1)
        } else if (state === 1) {
            screen.printCenter("WAIT...", 52, 3)
            if (game.runtime() > waitUntil) {
                state = 2
                t0 = game.runtime()
            }
        } else if (state === 2) {
            screen.fill(7)
            screen.printCenter("PRESS A!", 52, 0)
        } else {
            screen.printCenter("" + result + " ms", 52, 5)
            screen.printCenter("A: AGAIN", 82, 1)
        }
    })
}
