#!/usr/bin/env bash
# =====================================================================
#  build-lang.sh —— 把某个示例项目的 TS 版 / Python 版编译成 F4 固件
#
#  用法（在 Git Bash / macOS / Linux 终端里）：
#     bash tools/build-lang.sh <项目目录名> <ts|py> [输出UF2路径]
#
#  例：
#     bash tools/build-lang.sh 01-catch-the-pizza ts
#     bash tools/build-lang.sh 01-catch-the-pizza py firmware/01b-catch-the-pizza-py.uf2
#     bash tools/build-lang.sh py-02-dice ts
#
#  为什么 Python 版要走两步？
#     MakeCode 的 Python 是「静态 Python」：先由编译器转译成 TypeScript，
#     再和 TS 一样编译成本机码。`mkc build` 直接编 pyprj 项目会报
#     "no magic"（mkc 的已知限制），所以本脚本自动完成
#     `mkc build -j`（转译）→ 拿 built/main.ts → 二次 `mkc build`（原生）。
#
#  构建产物统一放在 项目/.build-ts/ 或 项目/.build-py/ （已被 .gitignore 忽略）。
# =====================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NAME="${1:-}"
LANGKIND="${2:-}"
OUT="${3:-}"

if [[ -z "$NAME" || ( "$LANGKIND" != "ts" && "$LANGKIND" != "py" ) ]]; then
    echo "用法: bash tools/build-lang.sh <项目目录名> <ts|py> [输出UF2路径]"
    echo "可用项目："
    find "$ROOT/projects" -mindepth 1 -maxdepth 1 -type d -printf '  %f\n' | sort
    exit 1
fi

PROJ="$ROOT/projects/$NAME"
if [[ ! -d "$PROJ" ]]; then
    echo "找不到项目目录: $PROJ" >&2
    exit 1
fi
if [[ ! -f "$PROJ/mkc.json" ]]; then
    echo "缺少 mkc.json: $PROJ" >&2
    exit 1
fi

BUILD="$PROJ/.build-$LANGKIND"
rm -rf "$BUILD"
mkdir -p "$BUILD"
cp "$PROJ/mkc.json" "$BUILD/mkc.json"

# 生成 pxt.json 的小工具（用 python 保证 JSON 合法）
gen_pxt() {
    python - "$1" "$2" "$3" "${@:4}" <<'PY'
import json, sys
out, name, editor = sys.argv[1], sys.argv[2], sys.argv[3]
files = sys.argv[4:]
cfg = {
    "name": name,
    "version": "1.0.0",
    "files": files,
    "supportedTargets": ["arcade"],
    "dependencies": {"device": "*"},
    "testDependencies": {}
}
if editor == "pyprj":
    cfg["preferredEditor"] = "pyprj"   # 关键：缺了它 mkc 会静默忽略 main.py，编出空壳
with open(out, "w", encoding="utf-8") as f:
    json.dump(cfg, f, ensure_ascii=False, indent=4)
PY
}

if [[ "$LANGKIND" == "ts" ]]; then
    shopt -s nullglob
    TSFILES=( "$PROJ"/*.ts )
    shopt -u nullglob
    if (( ${#TSFILES[@]} == 0 )); then
        echo "项目里没有 .ts 文件: $PROJ" >&2
        exit 1
    fi
    BASENAMES=()
    for f in "${TSFILES[@]}"; do
        cp "$f" "$BUILD/"
        BASENAMES+=( "$(basename "$f")" )
    done
    gen_pxt "$BUILD/pxt.json" "$NAME-ts" "tsprj" "${BASENAMES[@]}"
    echo "==> [$NAME / TS] mkc build"
    ( cd "$BUILD" && mkc build )
    UF2="$BUILD/built/stm32f401/binary.uf2"
else
    if [[ ! -f "$PROJ/main.py" ]]; then
        echo "项目里没有 main.py: $PROJ" >&2
        exit 1
    fi
    cp "$PROJ/main.py" "$BUILD/"
    gen_pxt "$BUILD/pxt.json" "$NAME-py" "pyprj" "main.py"
    echo "==> [$NAME / Python] mkc build -j  (静态 Python -> TypeScript)"
    ( cd "$BUILD" && mkc build -j )
    if [[ ! -f "$BUILD/built/main.ts" ]]; then
        echo "转译失败，没有生成 built/main.ts" >&2
        exit 1
    fi
    mkdir -p "$BUILD/native"
    cp "$BUILD/built/main.ts" "$BUILD/native/main.ts"
    cp "$PROJ/mkc.json" "$BUILD/native/mkc.json"
    gen_pxt "$BUILD/native/pxt.json" "$NAME-ts-from-py" "tsprj" "main.ts"
    echo "==> [$NAME / Python] mkc build  (TypeScript -> STM32F401 本机码)"
    ( cd "$BUILD/native" && mkc build )
    UF2="$BUILD/native/built/stm32f401/binary.uf2"
fi

if [[ ! -f "$UF2" ]]; then
    echo "编译结束但没有找到 UF2: $UF2" >&2
    exit 1
fi

# 校验 UF2 头（魔数 + STM32F401 family ID）
python - "$UF2" <<'PY'
import struct, sys
d = open(sys.argv[1], "rb").read()
magic, family = struct.unpack_from("<I", d, 0)[0], struct.unpack_from("<I", d, 28)[0]
assert magic == 0x0A324655, "UF2 魔数不对"
assert family == 0x57755A57, "不是 F4 (STM32F401) 固件"
print("校验通过: UF2 / family 0x57755A57 / %d 块 / %.1f KiB" % (len(d)//512, len(d)/2/1024))
PY

if [[ -n "$OUT" ]]; then
    DEST="$OUT"
    [[ "$DEST" = /* || "$DEST" =~ ^[A-Za-z]: ]] || DEST="$ROOT/$DEST"
    mkdir -p "$(dirname "$DEST")"
    cp "$UF2" "$DEST"
    echo "已复制到: $DEST"
else
    echo "固件位置: $UF2"
fi
