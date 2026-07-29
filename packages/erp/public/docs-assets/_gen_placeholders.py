from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(__file__), "eu")
os.makedirs(OUT, exist_ok=True)

W, H = 1440, 900
BG = (248, 250, 252)
CARD = (255, 255, 255)
BORDER = (226, 232, 240)
PRIMARY = (15, 118, 110)
TEXT = (30, 41, 59)
MUTED = (100, 116, 139)
GREEN = (22, 163, 74)
AMBER = (217, 119, 6)
RED = (220, 38, 38)


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\tahoma.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


F12, F14, F16, F18, F22, F28 = font(12), font(14), font(16), font(18), font(22), font(28)
F14B, F16B, F18B, F22B, F28B = font(14, True), font(16, True), font(18, True), font(22, True), font(28, True)


def new():
    return Image.new("RGB", (W, H), BG), None


def draw(im):
    return ImageDraw.Draw(im)


def rounded(d, xy, fill, outline=BORDER, r=12):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=1)


def badge(d, x, y, text, bg, fg=(255, 255, 255)):
    tw = d.textlength(text, font=F12)
    rounded(d, (x, y, x + tw + 16, y + 22), fill=bg, outline=bg, r=8)
    d.text((x + 8, y + 3), text, fill=fg, font=F12)


def chrome(d, title, subtitle=None):
    d.rectangle((0, 0, W, 64), fill=CARD)
    d.line((0, 64, W, 64), fill=BORDER, width=1)
    d.ellipse((24, 16, 48, 40), fill=PRIMARY)
    d.text((56, 18), "Frezo · FTECH", fill=TEXT, font=F18B)
    d.text((W - 220, 22), "Lê Minh Tuấn", fill=MUTED, font=F14)
    d.text((40, 88), title, fill=TEXT, font=F28B)
    if subtitle:
        d.text((40, 128), subtitle, fill=MUTED, font=F16)
        return 160
    return 140


def save(im, name):
    path = os.path.join(OUT, name)
    im.save(path, "PNG", optimize=True)
    print("wrote", name)


# 1 approval-inbox-list
im, _ = new()
d = draw(im)
y0 = chrome(d, "Hộp thư duyệt", "Phê duyệt · Chờ tôi duyệt")
rounded(d, (40, y0, 220, y0 + 40), fill=PRIMARY, outline=PRIMARY, r=10)
d.text((58, y0 + 10), "Chờ tôi duyệt (3)", fill=(255, 255, 255), font=F14B)
rounded(d, (236, y0, 340, y0 + 40), fill=CARD, r=10)
d.text((258, y0 + 10), "Tất cả", fill=MUTED, font=F14)
rounded(d, (40, y0 + 60, W - 40, H - 40), fill=CARD, r=14)
headers = ["Loại", "Người gửi", "Nội dung", "Ngày", ""]
xs = [60, 220, 420, 980, 1180]
for i, h in enumerate(headers):
    d.text((xs[i], y0 + 80), h, fill=MUTED, font=F12)
d.line((60, y0 + 108, W - 60, y0 + 108), fill=BORDER)
rows = [
    ("Nghỉ phép", "Lê Minh Tuấn", "Phép năm · 10–12/08/2026 · Du lịch Đà Nẵng", "05/08"),
    ("Nghỉ phép", "Đặng Quốc Bảo", "Nghỉ ốm · Giấy khám BV Bạch Mai", "04/08"),
    ("Bảng lương", "Bộ phận lương", "Khóa kỳ lương 07/2026", "03/08"),
]
for ri, row in enumerate(rows):
    yy = y0 + 130 + ri * 70
    for i, val in enumerate(row):
        d.text((xs[i], yy), val, fill=TEXT, font=F14)
    rounded(d, (1180, yy - 4, 1260, yy + 28), fill=GREEN, outline=GREEN, r=8)
    d.text((1194, yy + 2), "Duyệt", fill=(255, 255, 255), font=F12)
    rounded(d, (1274, yy - 4, 1370, yy + 28), fill=CARD, outline=RED, r=8)
    d.text((1288, yy + 2), "Từ chối", fill=RED, font=F12)
save(im, "approval-inbox-list.png")

# 2 qlts
im, _ = new()
d = draw(im)
y0 = chrome(d, "Quản lý tài sản", "Tài sản · Yêu cầu cấp phát")
rounded(d, (40, y0, 160, y0 + 36), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((62, y0 + 8), "Tài sản", fill=(255, 255, 255), font=F14B)
rounded(d, (172, y0, 360, y0 + 36), fill=CARD, r=8)
d.text((188, y0 + 8), "Yêu cầu cấp phát", fill=MUTED, font=F14)
rounded(d, (W - 280, y0, W - 160, y0 + 36), fill=CARD, r=8)
d.text((W - 268, y0 + 8), "Thêm tài sản", fill=TEXT, font=F14)
rounded(d, (W - 148, y0, W - 40, y0 + 36), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((W - 130, y0 + 8), "Cấp phát", fill=(255, 255, 255), font=F14B)
assets = [
    ("LT-IT-015", "Laptop Dell Latitude 5440", "22.500.000 VNĐ", "Sẵn sàng", GREEN),
    ("LT-IT-014", "Laptop Dell Latitude 5430", "21.000.000 VNĐ", "Đang dùng · Bảo", AMBER),
    ("MN-IT-003", 'Màn hình Dell 27"', "6.800.000 VNĐ", "Sẵn sàng", GREEN),
]
for i, a in enumerate(assets):
    x = 40 + (i % 3) * 460
    y = y0 + 70
    rounded(d, (x, y, x + 440, y + 280), fill=CARD, r=14)
    d.text((x + 24, y + 24), a[0], fill=PRIMARY, font=F18B)
    d.text((x + 24, y + 60), a[1], fill=TEXT, font=F16B)
    d.text((x + 24, y + 100), a[2], fill=MUTED, font=F14)
    badge(d, x + 24, y + 140, a[3], a[4])
    if a[3].startswith("Sẵn sàng"):
        rounded(d, (x + 24, y + 200, x + 160, y + 240), fill=PRIMARY, outline=PRIMARY, r=8)
        d.text((x + 48, y + 210), "Cấp phát", fill=(255, 255, 255), font=F14B)
save(im, "qlts-asset-list.png")

# 3 assign dialog
im, _ = new()
d = draw(im)
y0 = chrome(d, "Cấp phát tài sản", "LT-IT-015 · Laptop Dell Latitude 5440")
rounded(d, (280, y0, W - 280, H - 60), fill=CARD, r=16)
d.text((320, y0 + 28), "Gửi yêu cầu cấp phát", fill=TEXT, font=F22B)
fields = [
    ("Tài sản", "LT-IT-015 · Laptop Dell Latitude 5440"),
    ("Nhân viên nhận", "Đặng Quốc Bảo · Kỹ sư · IT"),
    ("Ngày dự kiến", "05/08/2026"),
    ("Lý do", "Cấp laptop dự án Frezo ERP — thay máy hết BH."),
]
for i, f in enumerate(fields):
    yy = y0 + 90 + i * 90
    d.text((320, yy), f[0], fill=MUTED, font=F14)
    rounded(d, (320, yy + 28, W - 320, yy + 68), fill=BG, r=8)
    d.text((336, yy + 38), f[1], fill=TEXT, font=F14)
rounded(d, (W - 520, H - 140, W - 360, H - 100), fill=CARD, r=8)
d.text((W - 492, H - 130), "Huỷ", fill=MUTED, font=F14)
rounded(d, (W - 340, H - 140, W - 120, H - 100), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((W - 300, H - 130), "Gửi yêu cầu", fill=(255, 255, 255), font=F14B)
save(im, "asset-assign-dialog.png")

# 4 depreciation
im, _ = new()
d = draw(im)
y0 = chrome(d, "Khấu hao TSCĐ", "Năm 2026 · Tháng 8")
for i, (lab, val) in enumerate([("Tài sản chờ ghi", "12"), ("Ước tính tháng", "8.450.000"), ("Đã ghi sổ", "0")]):
    x = 40 + i * 460
    rounded(d, (x, y0, x + 440, y0 + 100), fill=CARD, r=12)
    d.text((x + 24, y0 + 20), lab, fill=MUTED, font=F14)
    d.text((x + 24, y0 + 48), val, fill=TEXT, font=F22B)
rounded(d, (40, y0 + 130, W - 40, H - 40), fill=CARD, r=14)
d.text((60, y0 + 150), "Xem trước · LT-IT-015 · 22.500.000 ÷ 36 tháng", fill=TEXT, font=F16B)
d.text((60, y0 + 190), "Số tiền ghi sổ tháng 8/2026: 625.000 VNĐ", fill=PRIMARY, font=F18B)
headers = ["Mã TS", "Tên", "Nguyên giá", "Số tháng", "KH tháng"]
cols = [60, 220, 620, 900, 1100]
for i, h in enumerate(headers):
    d.text((cols[i], y0 + 240), h, fill=MUTED, font=F12)
d.line((60, y0 + 268, W - 60, y0 + 268), fill=BORDER)
d.text((60, y0 + 290), "LT-IT-015", fill=TEXT, font=F14)
d.text((220, y0 + 290), "Laptop Dell Latitude 5440", fill=TEXT, font=F14)
d.text((620, y0 + 290), "22.500.000", fill=TEXT, font=F14)
d.text((900, y0 + 290), "36", fill=TEXT, font=F14)
d.text((1100, y0 + 290), "625.000", fill=TEXT, font=F14)
rounded(d, (W - 220, H - 100, W - 40, H - 60), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((W - 180, H - 90), "Ghi sổ", fill=(255, 255, 255), font=F14B)
rounded(d, (W - 380, H - 100, W - 240, H - 60), fill=CARD, r=8)
d.text((W - 360, H - 90), "Xem trước", fill=TEXT, font=F14)
save(im, "depreciation-preview.png")

# 5 articles editor
im, _ = new()
d = draw(im)
y0 = chrome(d, "Quản lý Bài viết", "Thêm mới · Nháp")
rounded(d, (40, y0, W - 40, H - 40), fill=CARD, r=14)
d.text((70, y0 + 30), "Tiêu đề", fill=MUTED, font=F14)
rounded(d, (70, y0 + 58, W - 80, y0 + 110), fill=BG, r=8)
d.text((86, y0 + 72), "Thông báo nghỉ lễ Quốc khánh 2/9/2026 — lịch làm bù", fill=TEXT, font=F16)
d.text((70, y0 + 140), "Nội dung", fill=MUTED, font=F14)
rounded(d, (70, y0 + 168, W - 80, y0 + 360), fill=BG, r=8)
d.text((86, y0 + 190), "Nghỉ 01–02/09/2026. IT on-call theo lịch Hùng.", fill=TEXT, font=F14)
d.text((86, y0 + 220), "Đơn nghỉ liền kề gửi trước 25/08.", fill=TEXT, font=F14)
d.text((70, y0 + 390), "Người duyệt · Phòng Nhân Sự · Trần Thị Mai", fill=MUTED, font=F14)
badge(d, 70, y0 + 430, "Mã bài: ART-2026-0041 (tự cấp)", PRIMARY)
rounded(d, (W - 420, H - 110, W - 280, H - 70), fill=CARD, r=8)
d.text((W - 400, H - 100), "Lưu nháp", fill=TEXT, font=F14)
rounded(d, (W - 260, H - 110, W - 80, H - 70), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((W - 230, H - 100), "Gửi duyệt", fill=(255, 255, 255), font=F14B)
save(im, "articles-editor.png")

# 6 flow cards
im, _ = new()
d = draw(im)
y0 = chrome(d, "Cấu hình luồng duyệt", "Ba thẻ đang kích hoạt")
flows = [
    ("Nghỉ phép — QL rồi HR", "Áp dụng: Nghỉ phép", "Quản lý trực tiếp → HR", "Hùng → Mai"),
    ("Yêu cầu mua trên 5 triệu — TP rồi CFO", "Áp dụng: Yêu cầu mua", "Trưởng phòng → CFO", "Anh → Loan"),
    ("Chốt bảng lương — KT trưởng rồi Admin", "Áp dụng: Bảng lương", "CFO → Admin hệ thống", "Loan → Admin"),
]
for i, f in enumerate(flows):
    x = 40 + i * 460
    rounded(d, (x, y0, x + 440, y0 + 320), fill=CARD, r=14)
    d.text((x + 24, y0 + 24), f[0], fill=TEXT, font=F16B)
    badge(d, x + 24, y0 + 70, f[1], GREEN)
    badge(d, x + 24, y0 + 110, "Đang kích hoạt", PRIMARY)
    d.text((x + 24, y0 + 170), "Bước", fill=MUTED, font=F12)
    d.text((x + 24, y0 + 196), f[2], fill=TEXT, font=F14)
    d.text((x + 24, y0 + 230), f[3], fill=MUTED, font=F14)
save(im, "wf-flow-card-applied.png")

# 7 hire kanban
im, _ = new()
d = draw(im)
y0 = chrome(d, "Kanban tuyển dụng", "Tin: ENG-BE-01 · Tuyển dụng Kỹ sư Backend Q3")
cols = ["Ứng tuyển", "Sàng lọc CV", "Phỏng vấn", "Offer", "Đã nhận"]
names = [
    ["Phạm Minh Đức", "Trần Thu Hà"],
    ["Nguyễn Thị Lan"],
    ["Vũ Hoàng Nam"],
    [],
    [],
]
for i, c in enumerate(cols):
    x = 40 + i * 276
    rounded(d, (x, y0, x + 260, H - 40), fill=(241, 245, 249), r=12)
    d.text((x + 16, y0 + 16), c, fill=TEXT, font=F14B)
    for j, n in enumerate(names[i]):
        yy = y0 + 56 + j * 90
        rounded(d, (x + 12, yy, x + 248, yy + 76), fill=CARD, r=10)
        d.text((x + 24, yy + 16), n, fill=TEXT, font=F14B)
        d.text((x + 24, yy + 42), "Backend · 3y+", fill=MUTED, font=F12)
save(im, "hire-kanban.png")


def phone(d, title, lines, tab="Trang chủ"):
    px, py, pw, ph = 470, 40, 500, 820
    rounded(d, (px, py, px + pw, py + ph), fill=(15, 23, 42), outline=(15, 23, 42), r=36)
    rounded(d, (px + 12, py + 12, px + pw - 12, py + ph - 12), fill=CARD, outline=CARD, r=28)
    d.text((px + 36, py + 28), "9:41", fill=TEXT, font=F12)
    d.text((px + 36, py + 56), title, fill=TEXT, font=F18B)
    yy = py + 100
    for lab, val in lines:
        rounded(d, (px + 28, yy, px + pw - 28, yy + 70), fill=BG, r=12)
        d.text((px + 44, yy + 12), lab, fill=MUTED, font=F12)
        d.text((px + 44, yy + 34), val, fill=TEXT, font=F14B)
        yy += 84
    tabs = ["Trang chủ", "Chấm công", "Nghỉ phép", "Lương", "Cá nhân"]
    ty = py + ph - 70
    d.line((px + 20, ty - 8, px + pw - 20, ty - 8), fill=BORDER)
    for i, t in enumerate(tabs):
        tx = px + 28 + i * 90
        col = PRIMARY if t == tab else MUTED
        d.text((tx, ty + 8), t[:6], fill=col, font=F12)
    return px, py


# 8 mobile-home
im, _ = new()
d = draw(im)
d.text((40, 30), "Frezo Mobile · Trang chủ", fill=TEXT, font=F22B)
phone(
    d,
    "Xin chào, Tuấn",
    [
        ("Chấm công hôm nay", "Chưa vào ca · Check-in ngay"),
        ("Phiếu lương mới nhất", "07/2026 · Thực nhận 24.850.000"),
        ("Đơn nghỉ đang chờ", "Phép năm 10–12/08 · Chờ QL"),
    ],
    "Trang chủ",
)
save(im, "mobile-home.png")

# 9 mobile-checkin
im, _ = new()
d = draw(im)
d.text((40, 30), "Frezo Mobile · Chấm công", fill=TEXT, font=F22B)
px, py = phone(
    d,
    "Chấm công",
    [
        ("Vị trí của bạn", "Trong văn phòng · FTECH HN"),
        ("Ca hôm nay", "Vào — · Ra —"),
        ("Hành động", "Xác nhận check-in"),
    ],
    "Chấm công",
)
d.ellipse((px + 140, py + 430, px + 360, py + 650), outline=PRIMARY, width=3)
d.ellipse((px + 235, py + 525, px + 265, py + 555), fill=PRIMARY)
save(im, "mobile-checkin.png")

# 10 mobile-leave-form
im, _ = new()
d = draw(im)
d.text((40, 30), "Frezo Mobile · Xin phép", fill=TEXT, font=F22B)
phone(
    d,
    "Xin phép",
    [
        ("Loại phép", "Nghỉ phép năm"),
        ("Từ / Đến", "10/08/2026 → 12/08/2026 (3 ngày)"),
        ("Lý do", "Du lịch Đà Nẵng cùng gia đình."),
    ],
    "Nghỉ phép",
)
save(im, "mobile-leave-form.png")

# 11 mobile-payslip
im, _ = new()
d = draw(im)
d.text((40, 30), "Frezo Mobile · Phiếu lương", fill=TEXT, font=F22B)
phone(
    d,
    "Kỳ 07/2026",
    [
        ("Thực nhận (Net)", "24.850.000 VNĐ"),
        ("Gross / BH / TNCN", "30.000.000 · 3.150.000 · 2.000.000"),
        ("Trạng thái", "Đã xác nhận · Chia sẻ PDF"),
    ],
    "Lương",
)
save(im, "mobile-payslip.png")

# 12 articles list
im, _ = new()
d = draw(im)
y0 = chrome(d, "Quản lý Bài viết", "Danh sách nội bộ")
rounded(d, (W - 200, y0 - 50, W - 40, y0 - 14), fill=PRIMARY, outline=PRIMARY, r=8)
d.text((W - 170, y0 - 42), "Thêm mới", fill=(255, 255, 255), font=F14B)
rounded(d, (40, y0, W - 40, H - 40), fill=CARD, r=14)
rows2 = [
    ("ART-2026-0041", "Thông báo nghỉ lễ Quốc khánh 2/9/2026", "Nháp · Mai"),
    ("ART-2026-0038", "On-call IT tuần 11/08", "Đã duyệt"),
    ("ART-2026-0035", "Cập nhật WiFi FTECH-Office", "Đã xuất bản"),
]
for i, r in enumerate(rows2):
    yy = y0 + 40 + i * 90
    d.text((70, yy), r[0], fill=PRIMARY, font=F14B)
    d.text((70, yy + 28), r[1], fill=TEXT, font=F16)
    badge(d, W - 280, yy + 20, r[2], AMBER if "Nháp" in r[2] else GREEN)
save(im, "articles-list.png")

print("DONE")
