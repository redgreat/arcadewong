# 饼干游戏编程学习机（ELECFREAKS Retro Arcade）· 上手包

设备：2.4 寸 320×240 彩屏、Type-C、陀螺仪 / 光敏 / 震动 / 蜂鸣器、MakeCode Arcade「F4」硬件（STM32F401，UF2 烧录）。

---

## 一、驱动到底要不要装？

**结论：不装也能正常编程和*烧录***，这台机器本质是「免驱 UF2 + WebUSB」设备。

- 插上电脑后，Windows 已经自动把 `USB\VID_0483&PID_5799` 的**接口 0** 装成 `WinUsb Device`（网页版 MakeCode 的「设备配对 / 一键下载」就走它）。
- 设备管理器里「其他设备 → Arcade (app)」带感叹号的是**接口 1**（错误码 28，缺驱动），它是设备额外提供的自定义 USB 接口，刷机用不到。
- 按一下机身复位键进入下载模式后，机器会变成一个名为 `ARCADE` 的 U 盘，Windows 自带驱动，**完全不需要任何第三方驱动**。

如果你希望把那个感叹号消掉：双击 `tools/install-driver.cmd`，在弹出的 UAC 窗口点「是」即可（它只给接口 1 绑定系统自带的、微软签名的 WinUSB 驱动，不安装任何第三方文件）。结果写在 `tools/driver-install.log`。

---

## 二、编程要用什么桌面 IDE？不是只能网页拖拽

| 方式                                             | 说明                                                                                                                                       | 适合谁               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **网页版** <https://arcade.makecode.com/>         | 积木拖拽；右上角可一键切换 **JavaScript / Python** 文本模式；自带模拟器；可「安装为应用」(PWA) 离线用                                                                       | 给孩子入门，首选          |
| **VS Code + 官方扩展 "Microsoft MakeCode Arcade"** | 微软官方桌面 IDE。纯 TypeScript 开发，有智能提示、像素画 / 关卡编辑器、内置模拟器、一键编译出 `binary.uf2`；也支持 vscode.dev 网页版 VS Code。文档：<https://arcade.makecode.com/vscode> | 大一点的孩子 / 想用专业编辑器  |
| **命令行 mkc**（`npm i -g makecode`）               | 完全本地编译，不打开浏览器：`mkc build` 出 UF2，`mkc -d` 自动找盘烧录，`mkc serve` 起本地模拟器。文档：<https://github.com/microsoft/pxt-mkc>                             | 批量编译、自动化、Git 管理代码 |
| 网页版 JavaScript 视图                              | 不用装任何东西，把本目录 `main.ts` 全选粘贴进去就能看到图形化版                                                                                                    | 从积木过渡到代码          |

补充：主控是 STM32F401，理论上也能用 STM32Cube/Arduino 写 C++，但会失去 MakeCode 的积木、模拟器和全部教程，**不建议入门用**。

本机已经装好 `mkc`，本目录 3 个项目都是用它编译的（`mkc.json` 里 `hwVariant: "stm32f401"`，即网页版里选的「F4」硬件）。

---

## 三、三个项目（按讲解顺序）

三个都是街机史上最经典、规则一句话能讲清、改一个数字就能看到变化的玩法。每个 `main.ts` 开头都有一段「可以随便改的旋钮」，专门留给孩子动手。

### 1. 接披萨 `01-catch-the-pizza` — 第一堂课

对应官方教程 **Chase the Pizza** 的接物玩法（<https://arcade.makecode.com/tutorials）。>

- 讲：精灵（角色）、左右移动、随机位置、碰撞、计分、生命。
- 先让孩子改 `PLAYER_SPEED`（跑多快）、`FALL_SPEED`（掉多快）、`SPAWN_MS`（多久掉一个）。
- 进阶：把 `+1` 改成 `+5`，或把扣命改成加命（观察游戏变得多简单）。

### 2. 飞扬的小鸟 `02-flappy-bird` — 第二堂课

经典 Flappy Bird 玩法，MakeCode Arcade 社区里被改造最多的类型之一。

- 讲：重力 `ay`、按键事件、两条柱子中间的「随机缝隙」、看不见的得分线、撞到就结束。
- 先让孩子改 `GRAVITY` 和 `JUMP_VY`（手感），再改 `GAP`（难度）。
- 进阶：给得分加音效，或让柱子随分数越来越快。

### 3. 太空射击 `03-space-shooter` — 第三堂课

对应官方教程 **Space Destroyer** 的射击玩法。

- 讲：发射子弹、两类碰撞（子弹打敌人 / 敌人撞自己）、分数与生命、回收飞出屏幕的敌人。
- 先让孩子改 `BULLET_SPEED`、`SPAWN_MS`、`START_LIVES`。
- 进阶：一次发两颗子弹、敌人分两种速度。

**为什么选这三个**：规则都能一句话说完；每局几十秒，反馈快；核心参数都是顶部 3～5 个数字；从「移动 → 物理 → 发射」正好覆盖入门三块知识。

---

## 四、把游戏刷进机器

1. 用**带数据传输**的 Type-C 线连接电脑（纯充电线不行）。
2. 开机，**单击机身复位键** → 屏幕进入下载界面，电脑出现名为 `ARCADE`（部分固件叫 `ARCADE-F4`）的 U 盘。
3. 把 `firmware/` 里想玩的 `.uf2` 拖进这个盘，机器会自动重启并运行游戏。
4. 想换游戏：重复 2～3，拖另一个 `.uf2` 进去即可。**一次只能装一个游戏**，新的会覆盖旧的。

也可以用脚本自动等待并烧录：

```powershell
powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 1   # 1~9
```

网页版手动下载：编辑器左下角「…」→ 选择硬件 **F4** → 点「下载」得到 `.uf2` → 拖进 `ARCADE` 盘。官方说明：<https://wiki.elecfreaks.com/retroarcade/program-download-method>

重新编译（改完 `main.ts` 后）：

```bash
cd projects/01-catch-the-pizza
mkc build          # 生成 built/stm32f401/binary.uf2
```

---

## 五、目录说明

```
projects/
  01-catch-the-pizza/   TS 游戏：接披萨
  02-flappy-bird/       TS 游戏：飞扬的小鸟
  03-space-shooter/     TS 游戏：太空射击
  04-game-collection/   ★ 一个 UF2 装 3 个游戏（菜单切换）
  05-toolbox/           ★ 非游戏应用合集（计算器 / 秒表 / 骰子 / 手电筒 / 反应测试）
  py-01-catch-star/     Python 游戏：接星星
  py-02-dice/           Python 应用：电子骰子
  py-03-stopwatch/      Python 应用：秒表
  06-legend-collection/ ★★ 四大经典游戏合集（1968 行 TS + Python 教学精简版）
  README.md              本文件：项目总索引
doc/
  00-入门导读.md          ★★ 学习路线与索引（从这里开始）
  01 ~ 10 章              开发环境 / 变量 / 判断循环 / 函数事件 / 数组 /
                          绘图与黑屏陷阱 / 精灵碰撞 / 状态机与存档 /
                          静态 Python 限制 / 双语言速查表
  硬件介绍.md             ★ 机身按键、规格、内存地图、屏幕与调色板（带图）、
                          能跑什么 / 跑不了什么、GB 模拟器为什么不行
  images/                 文档配图（官方产品图 + 脚本生成的示意图）
firmware/
  01-catch-the-pizza.uf2 ~ 09-legend-4in1.uf2   ← 可直接拖进 ARCADE 盘或网页版编辑器
tools/
  build-lang.sh             ★ 用任一项目的 TS 版 / Python 版编译出 F4 固件
  flash.ps1                自动等待 ARCADE 盘并烧录（参数 -Game 1~9）
  install-arcade-driver.ps1 提权安装 WinUSB 驱动（可选）
  install-driver.cmd        双击运行的入口（可选）
  arcade-winusb.inf         驱动 INF（可选）
```

**每个项目根目录都有 `README.md`**（从零书写过程 + 针对孩子的教案 + 双语言对照），
并且都同时含 `main.ts`（TypeScript 版）与 `main.py`（Python 版），两者玩法等价、均已实测编译通过。

全部 9 个 UF2 均已校验：UF2 魔数 `0x0A324655`、family ID `0x57755A57`（STM32F401 / F4），与本机硬件匹配。

---

## 六、第二轮新增内容速览

- **导入网页版 / 教孩子用积木**：三种方式——
  1. **最省事**：把 `firmware/*.uf2` 直接**拖进** <https://arcade.makecode.com> 的编辑器窗口。MakeCode 的 UF2 里内嵌了完整项目源码（`pxt.json` + `main.ts` / `main.py`），会自动还原成可编辑的网页项目。
  2. 新建空项目 → 右上角切到 **JavaScript** 视图 → 把本仓库的 `main.ts` 全选粘进去。
  3. 网页版「导入」→ 填本项目在 GitHub 上的链接。

   ⚠️ 但**别用"导入我的代码"来教孩子入门**：手写代码反编译成积木时，`for...of`、`image.create`、顶层 `const` 这类写法会变成**灰色代码块**而不是彩色积木。正确顺序是先跟官方分步积木教程（**Chase the Pizza** / **Caterpillar** 等，<https://arcade.makecode.com/tutorials>）把"积木 → 逻辑"建立起来，再用本仓库代码做"看懂并改造"。每个项目的 `README.md` 里都写了该怎么给孩子讲。
- **Python**：`py-01/py-02/py-03` 是 MakeCode 的**静态 Python**（编译成本机码），不是 MicroPython，不能 `import` 第三方库。⚠️ 这三个项目的 UF2 曾经是空壳（缺 `preferredEditor`），已修复，见 `06-屏幕绘图与坐标.md`；编译 UF2 走各项目下的 `native/` 子目录。
- **一个 UF2 装多个游戏**：`04-game-collection.uf2`。开机菜单 ↑↓ 选、A 进入、B 回菜单。原理是 `settings` 写 Flash + `game.reset()` 软重启。
- **非游戏应用**：`05-toolbox.uf2`，5 个工具。证明计算器这类普通应用完全能跑。
- **GB 模拟器**：`硬件介绍.md` 有逐条瓶颈分析（96 KiB RAM / 512 KiB Flash / 无 SD 卡 / 160×120 逻辑分辨率），结论是**不现实，尤其"加载好多游戏"做不到**；可行的替代是上面的多游戏合集。

换游戏：`powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 4`（1~9）。

---

## 七、第三轮：四大经典游戏合集

`firmware/09-legend-4in1.uf2` —— 一个固件装 **贪吃蛇 / 横版动作闯关 / 横版枪战 / 坦克攻防**，共 1968 行 TypeScript，7 张关卡地图、3 个关底 Boss、6 种道具、4 种武器，全部原创像素美术。

- **内存实测：344.2 KiB / 448 KiB 可用 Flash（76.8%），还剩 104 KiB。** 四个游戏各自只占 8~19 KiB。
- 省内存的关键：不用精灵系统，改成每帧直接画屏；四个游戏代码都在 Flash，靠 `settings` + `game.reset()` 一次只跑一个。
- 官方同类积木示例对照、每个游戏的完整功能清单与操作、**逐游戏体积隔离编译数据**都在 `projects/06-legend-collection/README.md`。
- 刷入：`powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 9`（记得按复位键）。
- 注意：是玩法复刻 + 原创美术，不含原版 ROM / 关卡 / 音乐。
- 🛠 **2026-11-09 修复黑屏**：直接画屏的代码放错了回调，导致每帧被引擎清屏擦掉；`04/05/09` 与三个 Python 固件都已重编并完成模拟器 + 真机回归，详见 `06-屏幕绘图与坐标.md`。

---

## 八、当前机器里装的是什么

修复后已把 **`firmware/09-legend-4in1.uf2`** 真机烧录验证（写入后设备自动重启回游戏模式）。

- 开机是 `RETRO 4-IN-1` 菜单：↑↓ 选游戏、A 进入。
- 游戏内 **长按 B 约 1.2 秒**回菜单（屏幕底部有黄色进度条）。
- 换其它固件：按一下机身复位键 → 把 `firmware/` 里另一个 `.uf2` 拖进 `ARCADE-F4` 盘，或 `powershell -ExecutionPolicy Bypass -File tools\flash.ps1 -Game 1`（1~9）。

⚠️ 如果刷完还是黑屏，先确认用**带数据传输**的 Type-C 线、且拖入的是 `firmware/` 里**新日期**的 `.uf2`（旧文件已被覆盖，重新复制一次即可）。
