# Kiểm tra trước phát hành — 29/10/2026

Tài khoản đích do người dùng chọn: `verohien310703-val`. Repository dự kiến: `bang-toan-ipad`. Chưa xác nhận repository đã được tạo hoặc GitHub Pages đã triển khai.

- 56/56 kiểm thử Node của ứng dụng đạt.
- Gói web được tạo từ giao diện hiện tại, hỗ trợ đường dẫn `/bang-toan-ipad/`, có đầy đủ thư mục biểu tượng và mẫu giấy.
- Edge headless với hồ sơ riêng: viết 5 nét, nhập PDF, lưu vào IndexedDB; cập nhật service worker chờ và không tải lại trang đang mở; đóng/mở lại vẫn giữ dữ liệu.
- Tắt hẳn máy chủ HTTP thử: tải lại trang vẫn mở được app và hiển thị PDF; viết thêm 5 nét rồi tải lại, tổng 10 nét còn đủ.
- Không có lỗi JavaScript trong lượt kiểm tra này. Không gửi bài qua API máy chủ trong bản độc lập.
- Đã sửa kho độc lập để chấp nhận bút hiện tại (penModel tới 24), tạo sổ theo khổ/bìa và hỗ trợ yêu thích. Xác nhận nét đơn dùng gói thay đổi để tránh dựng lại cả trang sau mỗi nét.
- Chưa kiểm tra Safari/Pencil thật, chưa xác minh GitHub Actions trên tài khoản đích. Chưa có đồng bộ bài hai chiều với laptop.

Lệnh trên dự án phát triển:

```powershell
node --test resources/app/test/*.test.js
node resources/app/scripts/qa-pages-offline.cjs
```

Kết quả chi tiết nằm tại `resources/app/scripts/pages-offline-results.json` của dự án phát triển. Dữ liệu dạy học hiện có không được dùng làm dữ liệu thử.

Cấu hình Pages tham khảo tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
