# immich-amap-transform

为 [Immich](https://immich.app) 提供高德地图瓦片代理与动态 MapLibre Style JSON，解决国内自托管 Immich 无法直接使用高德底图的问题。

## 功能

- **瓦片代理** — 自动注入高德 Key、隐藏真实地址、Vercel CDN 多层缓存
- **动态 Style API** — 支持亮色 / 暗色主题、自定义 `background-color`
- **CORS** — 允许任意 Immich 实例跨域加载 style 与瓦片
- **Edge Runtime** — 全球边缘节点低延迟响应

## 快速部署（Vercel）

1. Fork 或导入本仓库到 [Vercel](https://vercel.com)
2. 在 **Settings → Environment Variables** 添加：

   ```
   GAODE_API_KEY=你的高德Web服务Key
   ```

3. 部署完成后，记下域名，例如 `https://immich-amap-transform.vercel.app`

## Immich 配置

在 Immich 管理后台 → **Settings → Map Settings → Custom Map Style URL**，填入：

| 主题 | URL |
|------|-----|
| 亮色 | `https://你的域名.vercel.app/api/style?theme=light` |
| 暗色 | `https://你的域名.vercel.app/api/style?theme=dark` |

Immich 若支持分别配置亮 / 暗样式，可各填一条；否则先使用亮色 URL。

### 自定义背景色

```
https://你的域名.vercel.app/api/style?theme=dark&bg=#0d1117
```

参数 `bg`、`background`、`background-color` 三选一，值为 hex 颜色（如 `#f8f4f0`）。

## API

### `GET /api/style`

返回 MapLibre Style JSON。

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `theme` | `light` 或 `dark` | `light` |
| `bg` | 背景色 hex | 亮色 `#f8f4f0` / 暗色 `#0d1117` |

### `GET /api/tile/{z}/{x}/{y}`

代理高德栅格瓦片。可选 query 参数：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `style` | 高德样式（7=亮色路网，8=暗色路网） | `7` |
| `lang` | 语言 | `zh_cn` |
| `size` | 瓦片尺寸 | `1` |
| `scale` | 缩放倍率 | `1` |

## 本地开发

```bash
pnpm install
cp .env.example .env.local
# 编辑 .env.local 填入 GAODE_API_KEY

pnpm dev
```

- 首页：http://localhost:3000
- Style：http://localhost:3000/api/style?theme=light
- 瓦片：http://localhost:3000/api/tile/10/842/388

## 缓存策略

| 资源 | 浏览器 | Vercel CDN | 回源 fetch |
|------|--------|------------|------------|
| 瓦片 | 7 天 | 30 天 | 30 天 |
| Style JSON | 1 小时 | 1 天 | — |

错误响应（4xx / 5xx）不缓存。

## 关于 GPS 偏移

照片 EXIF 中的 GPS 为 **WGS84** 坐标，高德底图为 **GCJ-02**（火星坐标）。本项目的瓦片代理 **不解决坐标偏移**；若照片打点与道路错位，需要在 Immich 侧做 WGS84 → GCJ-02 转换，或换用 WGS84 底图。

## 技术栈

- [Next.js 14](https://nextjs.org) App Router
- [pnpm](https://pnpm.io)
- 部署于 [Vercel](https://vercel.com)

## License

MIT
