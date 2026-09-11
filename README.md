# Mầm 🌱

Extension Microsoft Edge nhắc uống nước và đứng dậy vận động, giao diện tiếng Việt với màu pastel và bạn cây nhỏ.

## Cài vào Edge

1. Mở `edge://extensions`.
2. Bật **Developer mode / Chế độ nhà phát triển**.
3. Chọn **Load unpacked / Tải phần mở rộng đã giải nén**.
4. Chọn thư mục chứa `manifest.json` này (nếu dùng ZIP, giải nén trước).
5. Ghim **Mầm** trên thanh công cụ và bấm biểu tượng để mở.

Không cần npm install hoặc build.

## Sử dụng

- Mặc định nhắc uống nước mỗi 30 phút, vận động mỗi 60 phút.
- Bật/tắt riêng từng lời nhắc. Mở **Nhịp nhắc của bạn** để đổi lịch và mục tiêu ly nước.
- Bấm **Đã uống 1 ly / Đã vận động** để ghi nhận; lời nhắc tương ứng bắt đầu một chu kỳ mới.
- Thông báo có nút hoàn thành và nhắc lại sau 5 phút (khả năng hiển thị nút phụ thuộc hệ điều hành).
- **Tạm nghỉ 1 giờ** dừng cả hai lời nhắc, sau đó tự tiếp tục.
- Thống kê tự sang ngày mới theo giờ máy; dữ liệu chỉ lưu trên thiết bị.
- Chọn **Thử thông báo** để kiểm tra. Cho phép thông báo của Edge trong Windows và kiểm tra chế độ Không làm phiền nếu không thấy thông báo.

Lời nhắc dùng API alarms chạy khi popup đã đóng. Edge phải đang chạy; khi máy ngủ hoặc Edge bị tắt hoàn toàn, lời nhắc có thể bị trễ. Extension có quyền chèn thẻ nhắc trên trang HTTP/HTTPS, không thu thập nội dung trang hay gửi dữ liệu ra máy chủ.

## Phát triển

`npm test` kiểm thử lịch nhắc và thống kê bằng mô phỏng API trình duyệt. `npm run check` kiểm tra cú pháp JavaScript. Có thể phục vụ thư mục qua HTTP để xem trước popup; hành động thông báo cần chạy dưới dạng extension.

Tài liệu API: https://developer.chrome.com/docs/extensions/reference/api/alarms và https://developer.chrome.com/docs/extensions/develop/ui/notify-users.

## Thông báo ngay trên trang web (v1.1)

Khi Edge đang được sử dụng, Mầm hiển thị thẻ pastel ở góc dưới bên phải trang đang xem. Có nút hoàn thành, nhắc lại sau 5 phút và đóng. Hai lời nhắc cùng lúc hiển thị thành hai thẻ riêng. Thông báo thử không cộng vào thống kê.

Trang nội bộ `edge://`, cửa hàng extension và các trang bị hạn chế sẽ dùng thông báo hệ thống. Khi cửa sổ Edge không được chọn, Mầm cũng dùng thông báo hệ thống.

Sau khi cập nhật, vào `edge://extensions` và bấm **Reload / Tải lại** trên Mầm. Edge có thể yêu cầu chấp nhận quyền truy cập các trang web để hiển thị thẻ nhắc. Mở một trang HTTPS bình thường, mở Mầm → **Nhịp nhắc của bạn** → **Thử thông báo**, rồi đóng popup để thấy thẻ. Không cần tải lại các tab đang mở.
