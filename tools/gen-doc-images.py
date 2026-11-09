"""生成 doc/images 下的示意图（规格/内存分区/坐标系/调色板）。

用法：python tools/gen-doc-images.py
依赖：Pillow（pip install pillow）；Windows 自带 msyh.ttc 字体。
"""

import os

from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "doc", "images")
FONT = "C:/Windows/Fonts/msyh.ttc"
FONT_BD = "C:/Windows/Fonts/msyhbd.ttc"

INK = (33, 37, 41)
MUTED = (110, 118, 128)
LINE = (206, 212, 218)
ACCENT = (43, 108, 176)
ACCENT_2 = (214, 90, 49)
OK = (47, 133, 90)
BG = (255, 255, 255)


def f(size, bold=False):
    return ImageFont.truetype(FONT_BD if bold else FONT, size)


def canvas(w, h):
    img = Image.new("RGB", (w, h), BG)
    return img, ImageDraw.Draw(img)


def title(d, text, sub=None):
    d.text((40, 28), text, font=f(30, True), fill=INK)
    if sub:
        d.text((40, 72), sub, font=f(17), fill=MUTED)


# ---------------------------------------------------------------- 内存分区
def memory_map():
    W, H = 1080, 640
    img, d = canvas(W, H)
    title(d, "512 KiB Flash + 96 KiB SRAM：空间都去哪儿了",
          "地址取自 MakeCode 目标配置；用量是本仓库四个游戏的实测编译结果")

    x0, x1, y = 60, W - 60, 190
    bar_h = 86
    total = 512.0
    boot = 64.0
    span = x1 - x0

    # bootloader 段
    bl, br = x0, x0 + boot / total * span
    d.rectangle([bl, y, br, y + bar_h], fill=(120, 128, 138))
    d.text(((bl + br) / 2 - 8, y + 30), "64", font=f(20, True), fill=(255, 255, 255))
    d.text((x0, y - 52), "bootloader 64 KiB", font=f(16, True), fill=(90, 98, 108))
    d.text((x0, y - 30), "0x0800_0000", font=f(13), fill=MUTED)

    # 应用区底
    d.rectangle([br, y, x1, y + bar_h], fill=(226, 232, 240))

    # 已用部分
    used = 344.2
    ux = br + used / 448.0 * (x1 - br)
    d.rectangle([br, y, ux, y + bar_h], fill=ACCENT)
    d.text((br + 14, y + 12), "应用区 448 KiB", font=f(18, True), fill=(255, 255, 255))
    d.text((br + 14, y + 42), "四合一合集已用 344 KiB（76.8%）", font=f(15), fill=(226, 236, 247))
    d.text((br + 14, y + 64), "0x0801_0000 →", font=f(13), fill=(200, 218, 238))

    # 剩余部分
    d.text((ux + 14, y + 16), "剩 104 KiB", font=f(17, True), fill=ACCENT)
    d.text((ux + 14, y + 46), "≈ 5 个同类小游戏", font=f(14), fill=MUTED)

    # 刻度
    for kib in range(0, 513, 64):
        gx = x0 + kib / total * span
        d.line([gx, y + bar_h, gx, y + bar_h + 8], fill=LINE, width=2)
        d.text((gx - 8, y + bar_h + 14), str(kib), font=f(13), fill=MUTED)
    d.text((x1 - 36, y + bar_h + 36), "KiB", font=f(13), fill=MUTED)
    end_lab = "0x0808_0000（Flash 末尾）"
    d.text((x1 - d.textlength(end_lab, font=f(13)), y - 30), end_lab, font=f(13), fill=MUTED)

    # 单个游戏开销
    ty = 340
    d.text((60, ty), "单个游戏吞掉多少 Flash（其余三个换成空壳后编译）", font=f(19, True), fill=INK)
    rows = [("空壳：只有运行时 + 菜单", 280.5, (120, 128, 138)),
            ("+ 贪吃蛇", 288.5, ACCENT),
            ("+ 横版闯关", 298.7, ACCENT),
            ("+ 横版枪战", 299.5, ACCENT),
            ("+ 坦克大战", 299.7, ACCENT_2)]
    by = ty + 44
    for name, v, color in rows:
        d.text((60, by + 5), name, font=f(16), fill=INK)
        bx0, bx1 = 400, 760
        d.rounded_rectangle([bx0, by, bx1, by + 26], radius=5, fill=(240, 243, 246))
        d.rounded_rectangle([bx0, by, bx0 + v / 320.0 * (bx1 - bx0), by + 26], radius=5, fill=color)
        d.text((bx1 + 16, by + 3), f"{v} KiB", font=f(16, True), fill=color)
        by += 40

    d.text((60, H - 52), "结论：四个完整游戏装得下，还能接着加内容；真正的瓶颈是 96 KiB 的 SRAM，不是 Flash。",
           font=f(16), fill=MUTED)
    img.save(os.path.join(OUT, "05-memory-map.png"))


# ---------------------------------------------------------------- 坐标系
def coords():
    W, H = 1000, 660
    img, d = canvas(W, H)
    title(d, "屏幕坐标系：160 × 120，y 轴朝下",
          "精灵的 x / y 是中心点；fillRect / print 的 x / y 是左上角")

    sx, sy, sw = 150, 150, 600
    sh = sw * 120 / 160
    d.rectangle([sx, sy, sx + sw, sy + sh], outline=INK, width=3)
    for i in range(1, 8):
        gx = sx + i * sw / 8
        d.line([gx, sy, gx, sy + sh], fill=(234, 238, 242), width=1)
    for j in range(1, 6):
        gy = sy + j * sh / 6
        d.line([sx, gy, sx + sw, gy], fill=(234, 238, 242), width=1)

    # 角点标注
    d.text((sx - 4, sy - 32), "(0,0)", font=f(16, True), fill=INK)
    d.text((sx + sw - 62, sy - 32), "(159,0)", font=f(16, True), fill=INK)
    d.text((sx - 4, sy + sh + 10), "(0,119)", font=f(16, True), fill=INK)
    d.text((sx + sw - 78, sy + sh + 10), "(159,119)", font=f(16, True), fill=INK)

    # x 轴
    ax_y = sy + sh + 46
    d.line([sx, ax_y, sx + sw + 40, ax_y], fill=ACCENT, width=3)
    d.polygon([(sx + sw + 52, ax_y), (sx + sw + 38, ax_y - 8), (sx + sw + 38, ax_y + 8)], fill=ACCENT)
    d.text((sx + sw - 30, ax_y + 12), "x 变大 →", font=f(16), fill=ACCENT)
    d.text((sx + 190, ax_y - 28), "宽 160 像素", font=f(15), fill=MUTED)

    # y 轴
    ax_x = sx - 56
    d.line([ax_x, sy, ax_x, sy + sh + 12], fill=ACCENT, width=3)
    d.polygon([(ax_x, sy + sh + 24), (ax_x - 8, sy + sh + 10), (ax_x + 8, sy + sh + 10)], fill=ACCENT)
    d.text((ax_x - 44, sy + sh - 20), "y 变大", font=f(15), fill=ACCENT)
    d.text((sx + 12, sy + 8), "高 120 像素", font=f(15), fill=MUTED)

    # 中心点
    cx, cy = sx + sw / 2, sy + sh / 2
    d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=ACCENT_2)
    d.line([cx, cy - 34, cx, cy - 12], fill=ACCENT_2, width=2)
    d.text((cx + 14, cy - 42), "精灵放在 (80,60) = 屏幕正中", font=f(16), fill=ACCENT_2)

    d.text((sx + 10, sy + sh + 84), "和数学坐标系相反：往下 y 变大，所以\u201c向上飞\u201d的速度要写负数。",
           font=f(16), fill=MUTED)
    img.save(os.path.join(OUT, "06-coords.png"))


# ---------------------------------------------------------------- 调色板
def palette():
    names = ["透明", "白", "红", "粉", "橙", "黄", "青绿", "绿",
             "蓝", "青", "紫", "浅蓝", "棕", "深红", "深蓝", "黑"]
    rgb = [(0, 0, 0), (255, 255, 255), (255, 33, 33), (255, 147, 196),
           (255, 129, 53), (255, 246, 0), (28, 192, 138), (0, 148, 49),
           (0, 96, 255), (0, 199, 255), (182, 0, 255), (160, 195, 255),
           (140, 90, 50), (153, 0, 0), (0, 40, 130), (0, 0, 0)]
    W, H = 980, 560
    img, d = canvas(W, H)
    title(d, "16 色固定调色板：写 screen.fill(7) 这种编号，不是 #RRGGBB")
    cw, ch = 214, 76
    for i in range(16):
        col = i % 4
        row = i // 4
        x = 40 + col * (cw + 12)
        y = 120 + row * (ch + 16)
        d.rounded_rectangle([x, y, x + cw, y + ch], radius=8, fill=rgb[i], outline=LINE, width=2)
        txt_col = (255, 255, 255) if i in (0, 2, 7, 8, 10, 12, 13, 14) else INK
        d.text((x + 12, y + 10), f"{i}", font=f(24, True), fill=txt_col)
        d.text((x + 12, y + 44), names[i], font=f(17, True), fill=txt_col)
    d.text((40, H - 36), "0 号是透明；像素画里的 f 也代表透明，别和 15 号黑色搞混。", font=f(15), fill=MUTED)
    img.save(os.path.join(OUT, "07-palette.png"))


# ---------------------------------------------------------------- 按键映射
def buttons():
    W, H = 980, 520
    img, d = canvas(W, H)
    title(d, "四个方向键 + A + B：代码里怎么叫", "左列是机身按键，右列是 TypeScript / Python 的写法")

    rows = [("↑ ↓ ← →", "controller.up / down / left / right", "controller.up"),
            ("A 键", "controller.A", "controller.A"),
            ("B 键", "controller.B", "controller.B"),
            ("菜单键", "不进入游戏代码（系统键）", "—"),
            ("复位键", "触发下载模式，不进代码", "—")]
    y = 130
    for left, mid, py in rows:
        d.rounded_rectangle([40, y, 300, y + 46], radius=8, fill=(240, 243, 246), outline=LINE)
        d.text((58, y + 12), left, font=f(18, True), fill=INK)
        d.text((330, y + 12), mid, font=f(17), fill=INK)
        y += 58

    d.text((40, H - 44), "Python 里是 snake_case：controller.up.is_pressed()、controller.A.on_event(...)",
           font=f(15), fill=MUTED)
    img.save(os.path.join(OUT, "08-buttons.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    memory_map()
    coords()
    palette()
    buttons()
    for n in sorted(os.listdir(OUT)):
        print(n, os.path.getsize(os.path.join(OUT, n)), "bytes")
