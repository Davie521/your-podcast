# Issue #3: 添加 PWA 支持（离线播放、主屏图标）

**Status:** OPEN
**Labels:** enhancement, frontend, low-priority
**Link:** https://github.com/Davie521/your-podcast/issues/3

## 目标

将网页升级为 PWA，让用户可以"安装"到手机主屏幕，获得接近原生 App 的体验。

## 功能

- [ ] 添加 `manifest.json`（应用名称、图标、主题色）
- [ ] 添加 Service Worker（缓存静态资源）
- [ ] 支持"添加到主屏幕"提示
- [ ] 缓存已播放的 MP3，支持离线回听
- [ ] 全屏模式（隐藏浏览器地址栏）

## 优先级

**低** — MVP 完成后再做，普通移动端网页已经够用。

## 参考

- Next.js PWA: `next-pwa` 包或 `@serwist/next`
