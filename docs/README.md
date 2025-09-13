# Documentation Images

Thư mục này chứa các hình ảnh minh họa cho documentation của Free Clouds project.

## Cấu trúc Images

### Screenshots Required

- `free-clouds-dashboard.png` - Giao diện chính của Free Clouds Dashboard
- `features-overview.png` - Tổng quan các tính năng chính  
- `dashboard-main.png` - Giao diện dashboard chính với danh sách file
- `upload-interface.png` - Giao diện upload file với drag & drop
- `file-preview.png` - Modal preview file với metadata

### Image Guidelines

- **Kích thước**: 1920x1080 cho desktop screenshots
- **Format**: PNG hoặc JPG
- **Chất lượng**: High quality, rõ nét
- **Nội dung**: Thể hiện đúng tính năng được mô tả
- **Branding**: Consistent với thiết kế của ứng dụng

### Placeholder Images

Trong quá trình phát triển, bạn có thể sử dụng placeholder images:

```markdown
![Free Clouds Interface](https://via.placeholder.com/1200x600/1f2937/ffffff?text=Free+Clouds+Dashboard)
```

### Contributing Images

Khi contribute screenshots:

1. Sử dụng data test realistic
2. Ẩn thông tin nhạy cảm (tokens, IDs)
3. Optimize file size (< 500KB)
4. Đặt tên file theo convention
5. Update README này nếu thêm images mới

### Automated Screenshots

Có thể sử dụng Playwright để tạo screenshots tự động:

```bash
npm run screenshot:generate
```

Xem `scripts/generate-screenshots.js` để biết chi tiết.