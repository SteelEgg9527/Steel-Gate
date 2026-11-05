# 钢线 1944 · 单位素材

当前游戏所有可识别单位的矢量素材，按蓝队配色导出。
所有文件均为 SVG，透明背景，可直接缩放。

## 总览

- `ground-units-sheet.svg` / `ground-units-sheet.png`
- `air-naval-units-sheet.svg` / `air-naval-units-sheet.png`

## 地面单位

目录：`ground/`

| 文件 | 游戏 ID | 名称 | HP |
|---|---|---|---:|
| `infantry.svg` | `infantry` | 步兵班 | 300 |
| `armored.svg` | `armored` | 装甲车 | 300 |
| `tank.svg` | `tank` | 中型坦克 | 400 |
| `heavy_tank.svg` | `heavy_tank` | 重型坦克 | 520 |
| `artillery.svg` | `artillery` | 火炮 | 65 |
| `heavy_arty.svg` | `heavy_arty` | 重型火炮 | 85 |
| `aa.svg` | `aa` | 防空车 | 250 |
| `at_gun.svg` | `at_gun` | 轻型反坦克炮 | 90 |
| `rocket_arty.svg` | `rocket_arty` | 自行火箭炮 | 150 |
| `command.svg` | `command` | 指挥车 | 150 |
| `engineer_vehicle.svg` | `engineer_vehicle` | 工程车 | 220 |
| `boss_super.svg` | `boss_super` | 超级重坦 | 3000 |
| `boss_ghost.svg` | `boss_ghost` | 幽灵步兵 | 1500 |
| `target.svg` | `target` | 标靶 | 600 |
| `armor_target.svg` | `armor_target` | 装甲标靶 | 400 |
| `heavy_target.svg` | `heavy_target` | 重坦标靶 | 520 |

## 空中单位

目录：`air/`

| 文件 | 游戏内对象 | 名称 | HP |
|---|---|---|---:|
| `b17.svg` | `kind: b17` | B-17 空中堡垒 | 1500 |
| `fighter.svg` | `kind: fighter` | 战斗机 | 180 |
| `airstrike.svg` | `kind: airstrike` | 轰炸机 | 200 |
| `recon.svg` | `kind: recon` | 侦察机 | 140 |
| `seaplane.svg` | `kind: seaplane` | 水上飞机 | 120 |
| `supply.svg` | `kind: supply` | 补给运输机 | 300 |
| `hellBomber.svg` | `kind: hellBomber` | 地狱轰炸机 | 3000 |

## 海上单位 / 岸防

目录：`naval/`

| 文件 | 游戏内对象 | 名称 | HP |
|---|---|---|---:|
| `prinz-eugen-ingame.svg` | `NAVAL.drawShip` 当前绘制 | 欧根亲王号（游戏现状） | 5000 |
| `battleship.svg` | 战列舰 | 欧根亲王号（通用素材版） | 5000 |
| `supply_ship.svg` | 补给舰 | 补给舰 | 500 |
| `coastal_gun.svg` | 海岸炮台 | 406mm 岸防炮 | 1200 |

`prinz-eugen-ingame.svg` 是按当前游戏 `drawShip()` 代码重绘的静态矢量版，舰体尺寸 212.5m × 21.8m，包含：

- 当前舰体轮廓
- 甲板
- 上层建筑
- 4 座主炮
- 6 座副炮
- 6 座 37mm 防空炮
- 10 座 20mm 机关炮
- 舰首方向箭头
- 蓝队配色

不包含游戏内动态叠加的舰名、血条、装填条和炮塔状态条。

## 使用说明

- 地面单位源画布：`viewBox="0 0 180 100"`
- 空中单位源画布：`viewBox="0 0 240 140"`
- 海上单位源画布：`viewBox="0 0 240 140"`
- B-17 源画布：`viewBox="0 0 1000 720"`

蓝队色值：

- 主色：`#2f5f92`
- 亮色：`#8fbce4`
- 暗色：`#1d3d61`

红队可将主色替换为 `#a63f33`，绿队替换为 `#4f7a45`。
地面单位图形本身是蓝队版本，阵营配色可通过修改 `fill` 和 `stroke` 批量替换。

## 说明

这些素材是按游戏当前 Canvas 绘制逻辑整理的矢量版本，不是从游戏截图中抠出的位图。地面单位保留当前兵种符号；空中和海上单位使用简化俯视轮廓，方便后续统一重绘。
