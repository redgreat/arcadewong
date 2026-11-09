// 小应用：电子骰子（TypeScript 版 / 与同目录 main.py 完全等价）
// 讲什么：随机数、按键事件、把数字显示出来；桌游 / 课堂抽签都能用
const SIDES = 6

function roll() {
    game.splash("YOU ROLLED", "" + Math.randomRange(1, SIDES))
}

function rollAgain() {
    // 连续掷两次，用来讲「重复调用同一个函数」
    game.splash("FIRST", "" + Math.randomRange(1, SIDES))
    game.splash("SECOND", "" + Math.randomRange(1, SIDES))
}

controller.A.onEvent(ControllerButtonEvent.Pressed, roll)
controller.B.onEvent(ControllerButtonEvent.Pressed, rollAgain)
scene.setBackgroundColor(11)
game.splash("A: ROLL  B: TWO DICE")
