# Bảng Toán trên iPad

Gói web độc lập được tạo từ mã Bảng Toán đang dùng. Thư mục `site/` chỉ chứa chương trình và tài nguyên đi kèm; không chứa dữ liệu bài giảng trên laptop. Bài giảng của người dùng lưu trong IndexedDB trên thiết bị, không đưa vào repository.

## Phát hành lần đầu

1. Đưa nội dung thư mục này lên repository GitHub, nhánh `main`.
2. Vào Settings → Pages → Build and deployment → Source: GitHub Actions.
3. Chạy workflow Publish Bang Toan iPad hoặc đẩy commit mới lên main.
4. Mở địa chỉ do GitHub Pages trả về bằng Safari. Giữ mạng đến khi app báo Đã sẵn sàng dùng offline, rồi Chia sẻ → Thêm vào Màn hình chính.

Repository project có thể nằm tại `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`; gói dùng đường dẫn tương đối, không bắt buộc tên repository cụ thể.

## Khi có cải tiến

Trên máy phát triển Bảng Toán, chạy từ `D:\BangToan`:

```powershell
node resources/app/scripts/refresh-pages.cjs publish/bang-toan-ipad
```

Sau khi kiểm tra, commit và push thay đổi trong repository phát hành. GitHub Actions triển khai cùng địa chỉ. App có nút Kiểm tra cập nhật; khi bản mới tải xong, chờ Đã lưu, đóng mọi cửa sổ/tab Bảng Toán rồi mở lại. Không tự tải lại trang đang viết, không xóa kho IndexedDB khi thay cache chương trình. Mã cache tính từ nội dung tệp, nên vẫn phát hiện thay đổi nếu số package chưa tăng.

## Dữ liệu và giới hạn

- Nên dùng Sao lưu dữ liệu định kỳ để giữ tệp `.bangtoan` trong ứng dụng Tệp; Khôi phục tạo thư mục mới và giữ bài hiện có.
- Bản này chưa tự đồng bộ hai chiều với laptop. Đăng lên GitHub Pages không tự chuyển các bài cũ từ laptop sang iPad.
- Giữ ổn định địa chỉ sử dụng. Đổi domain/origin có thể làm app nhìn thấy một kho dữ liệu khác; xuất sao lưu trước khi chuyển địa chỉ.
- Xóa dữ liệu Safari/website có thể xóa bài trên thiết bị. Cache chương trình và dữ liệu bài là hai phần riêng.
- Đã kiểm tra bằng Edge trên Windows; vẫn cần nghiệm thu Safari và Apple Pencil thật.
