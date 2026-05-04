# LEXIQUIZ - AI-Powered Quiz Platform

LexiQuiz là một nền tảng tạo và làm bài trắc nghiệm thông minh, tích hợp AI (Gemini) để tạo câu hỏi từ văn bản và tài liệu (PDF, Word).

## 🛠️ Yêu cầu hệ thống
- **Python**: 3.10 trở lên
- **Node.js**: 18.0 trở lên
- **API Key**: Cần có [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt Backend (Django)

Chuyển vào thư mục backend:
```bash
cd lexiquiz
```

Tạo môi trường ảo (khuyên dùng):
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

Cài đặt các thư viện cần thiết:
```bash
pip install -r ../requirements.txt
```

Chạy migration và khởi động server:
```bash
python manage.py migrate
python manage.py runserver
```

### 2. Cài đặt Frontend (React + Vite)

Chuyển vào thư mục frontend:
```bash
cd frontend
```

Cài đặt các thư viện:
```bash
npm install
# Hoặc nếu dùng pnpm:
pnpm install
```

Khởi động frontend:
```bash
npm run dev
```

---

## 📦 Danh sách thư viện chính

### Backend (Python/Django)
- `django`: Framework web chính.
- `djangorestframework`: Xây dựng API.
- `djangorestframework-simplejwt`: Xác thực người dùng bằng JWT.
- `django-cors-headers`: Xử lý lỗi CORS.
- `channels` & `daphne`: Hỗ trợ Real-time (WebSockets).
- `google-generativeai`: Kết nối với AI Gemini.
- `PyPDF2`: Đọc nội dung từ file PDF.
- `python-docx`: Đọc nội dung từ file Word (.docx).
- `pillow`: Xử lý hình ảnh (Avatar người dùng).

### Frontend (React/TypeScript)
- `react` & `react-dom`: Thư viện giao diện chính.
- `react-router-dom`: Quản lý điều hướng (routing).
- `axios`: Gửi yêu cầu HTTP đến API.
- `recharts`: Vẽ biểu đồ thống kê.
- `lucide-react`: Bộ icon hiện đại.
- `tailwindcss`: Framework CSS để thiết kế giao diện.
- `clsx` & `tailwind-merge`: Quản lý class CSS linh hoạt.

---

## 🔑 Cấu hình AI
Để sử dụng tính năng tạo câu hỏi tự động, bạn cần dán API Key vào file `lexiquiz/lexiquiz/settings.py`:
```python
GEMINI_API_KEY = 'YOUR_API_KEY_HERE'
```
