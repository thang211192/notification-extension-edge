# Mầm 🌱

Extension Microsoft Edge nhắc uống nước và đứng dậy vận động, giao diện tiếng Việt với màu pastel và bạn cây nhỏ.

## Cài vào Edge

1. Mở `edge://extensions`.
2. Bật **Developer mode / Chế độ nhà phát triển**.
3. Chọn **Load unpacked / Tải phần mở rộng đã giải nén**.
4. Chọn thư mục `release/mam-edge` đã giải nén sẵn (hoặc thư mục mã nguồn chứa `manifest.json`).
5. Ghim **Mầm** trên thanh công cụ và bấm biểu tượng để mở.

Không cần npm install hoặc build.

## Thông báo hệ thống (v1.2.3)

Mỗi lần nhắc dùng một mã thông báo mới và xóa thông báo cũ cùng loại, để tránh tái sử dụng thông báo chưa đọc. Nút hoàn thành và nhắc lại vẫn hoạt động cho từng loại lời nhắc. Để kiểm tra, tắt **Nhắc ngay trên trang web**, bấm **Thử thông báo** hai lần, không bấm thông báo đầu tiên. Windows vẫn quyết định việc hiển thị banner dựa trên cài đặt thông báo và chế độ Không làm phiền.

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

Từ bản 1.2, **Nhắc ngay trên trang web** mặc định tắt, kể cả khi nâng cấp từ bản cũ. Mầm chỉ gửi thông báo hệ thống. Bạn có thể bật lại công tắc này trong popup; thay đổi được lưu ngay, không cần bấm Lưu cài đặt. Tắt công tắc cũng đóng các thẻ đang hiển thị bởi bản mới.

Khi bật tùy chọn và Edge đang được sử dụng, Mầm hiển thị thẻ pastel ở góc dưới bên phải trang đang xem. Có nút hoàn thành, nhắc lại sau 5 phút và đóng. Hai lời nhắc cùng lúc hiển thị thành hai thẻ riêng. Thông báo thử không cộng vào thống kê.

Từ bản 1.2.1, thẻ tự đóng sau 10 giây, kể cả thông báo thử. Khi rê chuột, đặt tiêu điểm bàn phím vào thẻ hoặc đang lưu thao tác, thẻ sẽ được giữ lại. Sau khi rời thẻ, thời gian 10 giây bắt đầu lại. Tự đóng không ghi nhận hoàn thành và không thay đổi lịch nhắc.

Trang nội bộ `edge://`, cửa hàng extension và các trang bị hạn chế sẽ dùng thông báo hệ thống. Khi cửa sổ Edge không được chọn, Mầm cũng dùng thông báo hệ thống.

Sau khi cập nhật, vào `edge://extensions` và bấm **Reload / Tải lại** trên Mầm. Nếu trang còn thẻ từ bản cũ, tải lại trang đó để xóa. Để thử thẻ trên trang, bật **Nhắc ngay trên trang web**, mở một trang HTTPS bình thường, mở Mầm → **Nhịp nhắc của bạn** → **Thử thông báo**, rồi đóng popup để thấy thẻ. Khi công tắc tắt, nút thử sẽ gửi thông báo hệ thống.
