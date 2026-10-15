# 谭鑫个人作品集网站

一个无外部运行依赖的静态作品集网站，可免费部署到 GitHub Pages。网站采用文艺米色编辑画册风格，包含品牌、VI、包装、海报、版式、文化设计与影像作品。个人简介位于第二屏，所有字体使用系统黑体/无衬线字体，作品图与头像均保持原始比例。

## GitHub Pages 部署

1. 在 GitHub 新建一个公开仓库，例如 `tanxin-portfolio`。
2. 将本文件夹中的全部文件上传到仓库根目录并提交。
3. 打开仓库的 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**。
5. 分支选择 `main`，目录选择 `/(root)`，点击保存。
6. 等待部署完成后，GitHub 会显示网站地址。

所有页面资源都使用相对路径，因此项目站点和用户名主页两种 GitHub Pages 地址均可工作。网站不引用 Google Fonts、CDN 或第三方脚本，图片与视频均随仓库存储。

## 添加新视频

1. 将视频转换为 H.264 编码的 MP4，放入 `assets/video/`。
2. 准备一张 WebP 封面图，放入 `assets/images/`。
3. 打开 `assets/js/projects.js`，找到 `motion-practice` 项目。
4. 在 `media` 数组中追加：

```js
{
  type: 'video',
  src: 'assets/video/新视频.mp4',
  poster: 'assets/images/新视频封面.webp',
  alt: '视频作品名称'
}
```

刷新网页后，新视频会自动进入影像项目详情。若还希望它出现在首页“影像”模块，可复制现有视频数据项的结构；当前脚本会自动读取 `motion-practice` 中全部视频。

如果视频托管在微信视频号等外部页面，可在 `assets/js/projects.js` 的 `VIDEO_SHOWCASE` 中添加截图、标题和完整视频链接。截图建议先压缩为 WebP，宽度控制在 1600px 左右。

## 添加社交链接

获得真实账号后，在 `index.html` 的 `contact-meta` 区域添加链接。不要使用尚未确认的账号地址。

## 本地预览

可直接双击 `index.html` 打开完整网站，作品列表与视频截图都能正常显示。

也可以在当前目录运行：

```bash
python3 -m http.server 8080
```

然后在浏览器打开 `http://localhost:8080`。

## 验证

本项目不需要安装依赖。安装 Node.js 后可运行：

```bash
node --test tests/*.test.mjs
```
