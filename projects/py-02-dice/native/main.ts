//  小应用：电子骰子（Python 版，不是游戏）
//  讲什么：随机数、事件、把数字显示出来；桌游/课堂抽签都能用
let SIDES = 6
controller.A.onEvent(ControllerButtonEvent.Pressed, function roll() {
    let n = randint(1, SIDES)
    game.splash("YOU ROLLED", "" + n)
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function roll_again() {
    //  连续掷两次，用来讲"重复调用同一个函数"
    game.splash("FIRST", "" + randint(1, SIDES))
    game.splash("SECOND", "" + randint(1, SIDES))
})
scene.setBackgroundColor(11)
game.splash("A: ROLL  B: TWO DICE")
