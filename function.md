# Danh sách chức năng LEXIQUIZ

Dưới đây là các chức năng hiện đang có trong hệ thống LEXIQUIZ:

## 1. Quản lý Quiz (Quiz Management)
- **Tạo Quiz thủ công**: Cho phép người dùng tự tạo bộ câu hỏi với các tùy chọn tiêu đề, mô tả, hình ảnh và danh mục.
- **Tạo Quiz bằng AI**: Tự động tạo bộ câu hỏi từ nội dung văn bản được trích xuất.
- **Nhập Quiz từ tài liệu**: Trích xuất câu hỏi và đáp án từ tệp tin **PDF** và **DOCX** (sử dụng Regex).
- **Duyệt Quiz**: Tìm kiếm và lọc quiz theo danh mục (Toán, Anh văn, Công nghệ...).
- **Làm Quiz cá nhân**: Chế độ làm bài đơn lẻ với tính năng đếm ngược thời gian và chấm điểm tự động.
- **Lịch sử làm bài**: Lưu giữ và xem lại kết quả các lần làm bài trước đó.

## 2. Chế độ Chơi trực tuyến (Live Mode - Kahoot Style)
- **Tạo phòng chơi (Host)**: Chủ sở hữu quiz có thể mở phòng chơi trực tiếp với mã PIN 6 số.
- **Tham gia bằng mã PIN**: Người chơi dễ dàng tham gia vào phòng chờ thông qua mã PIN.
- **Điều khiển trực tiếp**: Host kiểm soát việc chuyển câu hỏi; kết quả được cập nhật ngay lập tức sau mỗi câu.
- **Bảng xếp hạng thời gian thực**: Hiển thị điểm số và thứ hạng của người chơi ngay trong trận đấu.
- **Thách đấu (Live Duel)**: Chế độ 1v1 trực tiếp giữa các người dùng.

## 3. Hệ thống Gamification (Trò chơi hóa)
- **Hệ thống Cấp độ & XP**: Tích lũy kinh nghiệm từ việc trả lời đúng để thăng cấp.
- **Hệ thống Tiền tệ (Coins)**: Nhận xu khi hoàn thành quiz và nhiệm vụ.
- **Nhiệm vụ hàng ngày (Daily Quests)**: Hệ thống 3 nhiệm vụ ngẫu nhiên mỗi ngày (ví dụ: Làm 5 quiz, đạt 1000 XP...).
- **Hệ thống Huy hiệu (Badges)**: Mở khóa các danh hiệu như "Genius", "Mastermind", "Explorer" dựa trên thành tích.
- **Chuỗi hoạt động (Streak)**: Theo dõi số ngày hoạt động liên tiếp của người dùng.
- **Kỹ năng theo danh mục (Skill Tree)**: Tăng cấp độ chuyên biệt cho từng lĩnh vực (Toán học, Ngoại ngữ...).

## 4. Cửa hàng & Trang trí (Shop & Inventory)
- **Cửa hàng (Shop)**: Sử dụng xu để mua các vật phẩm trang trí như Khung ảnh đại diện (Avatar Frames) và Giao diện (Themes).
- **Kho đồ (Inventory)**: Quản lý, trang bị hoặc thay đổi các vật phẩm đã sở hữu.
- **Tùy chỉnh Hồ sơ**: Cập nhật ảnh đại diện, thông tin cá nhân và hiển thị khung trang trí đã trang bị.

## 5. Tương tác Xã hội
- **Bình luận & Đánh giá**: Người dùng có thể để lại ý kiến và chấm điểm (1-5 sao) cho các bộ quiz.
- **Theo dõi người dùng (Follow)**: Theo dõi những người sáng tạo quiz yêu thích.
- **Bảng xếp hạng (Leaderboard)**: Vinh danh Top 20 người chơi có XP cao nhất hệ thống.

## 6. Thống kê & Quản lý tài khoản
- **Đăng ký / Đăng nhập**: Hệ thống bảo mật với JWT.
- **Bảng điều khiển (Dashboard)**: Thống kê chi tiết số lượng quiz đã tạo/làm, tỷ lệ chính xác và biểu đồ phân tích kỹ năng.
- **Thông tin thống kê**: Xem biểu đồ phân bổ danh mục quiz đã thực hiện.
