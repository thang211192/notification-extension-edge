# Bộ nộp Microsoft Edge Add-ons · Mầm 2.0.0

## Các tệp để upload

- **Package:** `../mam-edge-store-2.0.0.zip`. Upload nguyên ZIP, không phải thư mục mã nguồn. ZIP có 11 tệp chạy extension, `manifest.json` ở gốc; không chứa node_modules, kiểm thử, dữ liệu minh họa, ảnh listing, khóa ký hoặc tệp cấu hình cá nhân.
- **Ảnh listing:** `01-mam-overview-1280x800.png`, `02-mam-week-focus-1280x800.png`, `03-mam-schedule-1280x800.png`. PNG đúng 1280×800, chụp giao diện thật với dữ liệu minh họa.
- **Logo:** `store-icon-128.png`, PNG 128×128 nền trong suốt.

## Nội dung có thể dùng cho listing tiếng Việt

**Tên:** Mầm • Uống nước & vận động

**Mô tả ngắn:** Một người bạn nhỏ nhắc bạn uống nước, đứng dậy và chăm sóc bản thân mỗi ngày.

**Mô tả đầy đủ:**

Chăm mình một chút, mỗi ngày. Mầm là người bạn nhỏ trên Microsoft Edge, giúp bạn nhớ uống nước và đứng dậy vận động khi làm việc.

- Nhắc uống nước và vận động với khoảng thời gian tùy chỉnh.
- Chọn dung tích ly theo ml, mục tiêu mỗi ngày và hoàn tác lần ghi nhận gần nhất.
- Chọn ngày trong tuần, giờ nhắc và khoảng nghỉ trưa.
- Theo dõi lượng nước và vận động trong 7 ngày gần nhất.
- Nuôi một chậu cây lớn lên từ những lần chăm sóc bản thân; đạt mục tiêu nước thì cây nở hoa.
- Tập trung 25, 50 hoặc 90 phút, sau đó tự tiếp tục lịch nhắc.
- Cá nhân hóa màu giao diện, chậu cây, âm thanh hệ thống và thời gian tự đóng thẻ trên trang.
- Dùng thông báo hệ thống hoặc bật thẻ nhắc ngay trên trang đang xem.

Giao diện tiếng Việt. Không cần tài khoản. Cài đặt và lịch sử được lưu trên thiết bị, không gửi tới máy chủ.

Edge cần đang chạy để gửi lời nhắc; máy ngủ có thể làm trễ thông báo. Thẻ trên trang không hoạt động trên trang nội bộ hoặc trang bị Edge hạn chế và sẽ chuyển sang thông báo hệ thống. Banner và âm thanh hệ thống phụ thuộc cài đặt Windows. Mục tiêu nước do bạn tự chọn.

**Từ khóa:** uống nước; nhắc nghỉ; vận động; tập trung; thói quen; Mầm.

**Website / hỗ trợ:** https://github.com/thang211192/notification-extension-edge

**Privacy policy URL:** https://github.com/thang211192/notification-extension-edge/blob/main/PRIVACY.md

## Privacy / giải thích quyền

**Single purpose:** Help users maintain hydration and movement habits while using Microsoft Edge through scheduled reminders and locally stored progress.

- **alarms:** Schedules hydration and movement reminders, snoozes, and the end of focus sessions even when the popup is closed.
- **storage:** Stores user settings and self-entered hydration/movement history locally to power reminders, weekly statistics, undo and plant progress.
- **notifications:** Displays desktop reminders with completion and snooze buttons.
- **scripting:** Injects the packaged reminder UI into the active page only when the user enables in-page reminders.
- **HTTP/HTTPS host permissions:** Allows the optional reminder card to appear on the active website when a scheduled reminder fires. The extension does not read page content, browsing history, passwords or form input, and does not transmit browsing data.
- **Remote code:** No. All executable code is included in the package.
- **Data usage:** User-entered hydration/movement records and preferences are stored locally. The extension does not transmit them to the developer or third parties. Use this actual behavior to complete the data-use fields shown in Partner Center; do not describe the extension as storing no data.

## Certification testing notes

No login or payment is required. Open the toolbar popup and click **Thử thông báo** to test a desktop notification immediately. To test an in-page card, enable **Nhắc ngay trên trang web**, visit a normal HTTPS page, click **Thử thông báo**, then close the popup. Internal Edge pages use a desktop fallback.

Use **＋ 250 ml**, **Đã vận động**, and **Hoàn tác** to verify tracking. Configure a five-minute interval for scheduled testing. Open **Nhịp nhắc của bạn** for workdays/hours and lunch; **Cá nhân hóa Mầm** for themes and dismissal duration. Focus mode pauses scheduled reminders; the explicit test button still works during focus. Production installs start without the sample history shown in listing screenshots.

## Nộp hồ sơ

Vào Partner Center → Edge → Create new extension → upload ZIP → điền Properties, Privacy, Store listing tiếng Việt → tải ảnh và logo riêng → xem lại rồi Submit. Bạn tự điền thông tin nhà phát hành và danh mục phù hợp với các lựa chọn của tài khoản. Bộ tệp này chưa được nộp hoặc duyệt bởi Microsoft.

Tài liệu chính thức đã đối chiếu: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
