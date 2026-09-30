# Mầm 🌱 · 2.0

Extension Microsoft Edge nhắc uống nước, đứng dậy và chăm mình mỗi ngày. Giao diện tiếng Việt, icon nền trong suốt, dữ liệu lưu trên thiết bị.

## Cài đặt / cập nhật

1. Mở `edge://extensions`, bật **Developer mode / Chế độ nhà phát triển**.
2. Chọn **Load unpacked / Tải phần mở rộng đã giải nén** → thư mục `release/mam-edge`.
3. Ghim **Mầm** trên thanh công cụ. Không cần cài npm để sử dụng extension.
4. Khi cập nhật, bấm **Tải lại** trên Mầm. Tải lại các trang đang mở để thay thế thẻ nhắc của bản cũ.

Bản phát hành luôn nằm sẵn trong `release/mam-edge`, không đóng ZIP. Giữ nguyên thư mục đã tải vào Edge để giữ dữ liệu của extension.

## Các tính năng

### Giờ nhắc linh hoạt

Mở **Nhịp nhắc của bạn** để đặt khoảng cách nhắc uống nước/vận động (5–180 phút), chọn các ngày trong tuần, giờ bắt đầu/kết thúc trong cùng ngày và giờ nghỉ trưa. Bấm **Lưu nhịp nhắc**.

Mặc định giới hạn giờ chưa bật để giữ cách hoạt động trước đây. Khi bật, lời nhắc chỉ đến trong khung giờ đã chọn, theo múi giờ của máy. Lời nhắc đến hạn trong giờ nghỉ sẽ dời tới khung giờ phù hợp tiếp theo. Nhắc lại sau 5 phút cũng tuân theo lịch này. Không hỗ trợ khung giờ qua đêm.

### Lượng nước và hoàn tác

- Chọn dung tích ly/bình (50–2.000 ml) và mục tiêu cá nhân (100–10.000 ml/ngày).
- Bấm **＋ … ml** để ghi nhận một lần uống theo dung tích đã chọn. Thông báo cũng có nút ghi nhận lượng nước.
- Đổi dung tích không thay đổi lượng nước đã uống. Đổi mục tiêu áp dụng cho hôm nay và các ngày tiếp theo; mục tiêu cũ của các ngày trước được giữ lại.
- **Hoàn tác** xóa lần ghi nhận gần nhất, kể cả vận động hoặc một lần đã ghi từ thông báo. Chỉ hoàn tác một bước, không hoàn tác lặp lại. Nếu đã qua ngày mới, dữ liệu được sửa ở đúng ngày gốc.
- Hoàn tác không tua lại đồng hồ nhắc đã bắt đầu sau lần ghi nhận.

### Cây phát triển theo thói quen

Mỗi lần uống nước hoặc vận động được ghi nhận là một “điều tốt”. Cây có bốn giai đoạn: mầm mới, lá non (8 điểm), cây xanh (25 điểm), trưởng thành (60 điểm). Đạt mục tiêu nước trong ngày thì cây nở hoa. Ngày mới hoa bắt đầu lại, còn tiến độ lớn của cây vẫn giữ nguyên. Không trừ điểm vì nghỉ một ngày; hoàn tác chỉ xóa điểm của lần ghi nhầm.

### Nhìn lại tuần của bạn

Biểu đồ 7 ngày gần nhất hiển thị lượng nước và tổng số lần vận động. Bấm từng cột để xem lượng nước, mục tiêu và vận động của ngày đó. Ngày chưa có dữ liệu được hiển thị bằng cột nét đứt, không giả lập lịch sử.

Khi nâng cấp từ bản cũ, số ly đang lưu được quy đổi **250 ml/ly**; mục tiêu cũ được quy đổi tương tự. Bản cũ chỉ giữ một ngày, nên không thể khôi phục những ngày đã bị bản cũ xóa. Từ bản 2.0, lịch sử được lưu khi ghi nhận hoặc khi extension chuyển ngày, kể cả khi popup đóng.

### Chế độ tập trung

Chọn **25 / 50 / 90 phút** để tạm dừng lời nhắc. Popup có đồng hồ đếm ngược. Các lời nhắc lại đang chờ và thẻ đang hiển thị được dọn khi bắt đầu tập trung. Thời điểm kết thúc được lưu nên vẫn giữ khi đóng popup hoặc khởi động lại Edge. Hết giờ, Mầm tự khôi phục lịch; lời nhắc đầu tiên đến sau khoảng nhắc đã đặt và trong khung giờ cho phép. Có thể bấm **Kết thúc tập trung** sớm. Vẫn ghi nhận nước/vận động bằng tay được khi đang tập trung.

### Cá nhân hóa

- Màu: xanh lá, hồng phấn, xanh trời. Áp dụng cho popup và các thẻ trên trang được gửi sau khi lưu.
- Chậu cây: đất nung, oải hương, kem sữa; áp dụng cho cây trong popup.
- Bật/tắt âm thanh thông báo hệ thống. Âm thanh dùng thiết lập của Windows; không có âm thanh tùy chỉnh cho thẻ trên trang.
- Thẻ trên trang tự đóng sau 5, 10, 20, 30 giây hoặc giữ đến khi bạn đóng. Rê chuột / đặt tiêu điểm bàn phím vào thẻ sẽ giữ lại, sau khi rời thẻ thời gian bắt đầu lại.
- Bấm **Lưu diện mạo** để áp dụng. Lựa chọn tự đóng không thay đổi thời lượng banner của Windows.

## Thông báo

**Nhắc ngay trên trang web** mặc định tắt; công tắc tự lưu khi đổi. Khi bật, thẻ hiện trên trang đang xem nếu Edge đang được chọn. Trang nội bộ `edge://`, cửa hàng extension hoặc trang bị hạn chế sẽ chuyển sang thông báo hệ thống. Không đọc nội dung trang hay gửi dữ liệu ra máy chủ.

Mỗi thông báo hệ thống có mã mới và dọn thông báo cũ cùng loại để tránh tái sử dụng thông báo chưa đọc. Có nút hoàn thành và nhắc lại sau 5 phút (hiển thị nút phụ thuộc hệ điều hành). Mỗi loại chỉ giữ một thông báo hệ thống gần nhất.

**Thử thông báo** hoạt động ngay, kể cả ngoài giờ nhắc / đang tập trung, và không ghi vào thống kê. Windows quyết định việc hiển thị banner và phát âm thanh theo quyền thông báo của Edge và chế độ Không làm phiền. Edge phải đang chạy; máy ngủ hoặc Edge tắt hoàn toàn có thể làm trễ lịch nhắc.

## Phát triển và kiểm tra

```sh
npm ci
npm test
npm run check
npm run test:ui
npm run release
```

`npm test` kiểm tra lịch nhắc, nghỉ trưa/cuối tuần, chế độ tập trung, chuyển ngày, quy đổi dữ liệu cũ, ml/hoàn tác, thông báo lặp lại, cây và thời gian tự đóng. `test:ui` dùng Playwright với Microsoft Edge cài trên máy; chạy popup thật với API extension được mô phỏng, kiểm tra thao tác và bố cục. Thông báo Windows vẫn cần kiểm tra thực tế trên máy người dùng.

`npm run release` sao chép các tệp cần thiết vào thư mục đã giải nén, không chứa công cụ phát triển hay khóa ký.

Tài liệu API: [Alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms) · [Notifications](https://developer.chrome.com/docs/extensions/reference/api/notifications).
