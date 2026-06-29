import { ScrollText, FileCheck, FileSignature, UserCheck } from 'lucide-react'

export const CONTRACT_TYPES = [
  { value: 'THU_VIEC', label: 'Hợp đồng thử việc' },
  { value: 'CHINH_THUC', label: 'Hợp đồng chính thức' },
  { value: 'THOI_VU', label: 'Hợp đồng thời vụ' },
  { value: 'PART_TIME', label: 'Hợp đồng bán thời gian' },
]

export const CONTRACT_TEMPLATES = [
  {
    id: 'thu-viec',
    name: 'Thử việc',
    type: 'THU_VIEC',
    icon: ScrollText,
    desc: 'Hợp đồng thử việc mẫu',
    content: `<h2 style="text-align:center;"><strong>HỢP ĐỒNG THỬ VIỆC</strong></h2>
<p style="text-align:center;">(Số: {{code}})</p>
<p> </p>
<p><strong>Hôm nay, ngày {{startDate}} tháng ... năm ...</strong></p>
<p>Tại: {{workLocation}}</p>
<p> </p>
<p><strong>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</strong></p>
<p>Tên công ty: {{employerName}}</p>
<p>Địa chỉ: {{employerAddress}}</p>
<p>Đại diện: {{employerRep}}</p>
<p> </p>
<p><strong>BÊN B (NGƯỜI LAO ĐỘNG):</strong></p>
<p>Họ và tên: {{personName}}</p>
<p>Ngày sinh: {{employeeDob}}</p>
<p>CCCD: {{employeeIdNumber}}</p>
<p> </p>
<p><strong>HAI BÊN THỎA THUẬN KÝ KẾT HỢP ĐỒNG THỬ VIỆC VỚI CÁC ĐIỀU KHOẢN SAU:</strong></p>
<p> </p>
<p><strong>Điều 1: Công việc và địa điểm làm việc</strong></p>
<p>1. Công việc: {{jobPosition}}</p>
<p>2. Địa điểm: {{workLocation}}</p>
<p> </p>
<p><strong>Điều 2: Thời gian thử việc</strong></p>
<p>Thời gian thử việc: ... ngày, kể từ ngày .../.../......</p>
<p> </p>
<p><strong>Điều 3: Mức lương thử việc</strong></p>
<p>Mức lương chính: {{basicSalary}} VNĐ/tháng</p>
<p>Thưởng KPI: {{kpiAmount}} VNĐ/tháng</p>
<p>Tổng thu nhập: {{netSalary}} VNĐ/tháng</p>
<p>Phụ cấp: {{allowance}}</p>
<p> </p>
<p><strong>Điều 4: Các điều khoản khác</strong></p>
<p>Hai bên cam kết thực hiện đúng các quy định của pháp luật lao động.</p>
<p> </p>
<p style="text-align:right;"><strong>ĐẠI DIỆN BÊN A</strong></p>
<p style="text-align:right;"><em>(Ký, ghi rõ họ tên)</em></p>
<p style="text-align:right;">..........................</p>
<p style="text-align:left;"> </p>
<p style="text-align:left;"><strong>ĐẠI DIỆN BÊN B</strong></p>
<p style="text-align:left;"><em>(Ký, ghi rõ họ tên)</em></p>
<p style="text-align:left;">..........................</p>`
  },
  {
    id: 'chinh-thuc',
    name: 'Chính thức',
    type: 'CHINH_THUC',
    icon: FileCheck,
    desc: 'Hợp đồng lao động chính thức',
    content: `<h2 style="text-align:center;"><strong>HỢP ĐỒNG LAO ĐỘNG</strong></h2>
<p style="text-align:center;">(Số: {{code}})</p>
<p> </p>
<p><strong>Hôm nay, ngày ... tháng ... năm ...</strong></p>
<p>Tại: {{workLocation}}</p>
<p> </p>
<p><strong>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</strong></p>
<p>Tên công ty: {{employerName}}</p>
<p>Địa chỉ: {{employerAddress}}</p>
<p>Đại diện: {{employerRep}}</p>
<p> </p>
<p><strong>BÊN B (NGƯỜI LAO ĐỘNG):</strong></p>
<p>Họ và tên: {{personName}}</p>
<p>Ngày sinh: {{employeeDob}}</p>
<p>CCCD: {{employeeIdNumber}}</p>
<p>Địa chỉ thường trú: ...</p>
<p> </p>
<p><strong>HAI BÊN THỎA THUẬN KÝ KẾT HỢP ĐỒNG VỚI CÁC ĐIỀU KHOẢN SAU:</strong></p>
<p> </p>
<p><strong>Điều 1: Công việc và địa điểm làm việc</strong></p>
<p>1. Chức danh chuyên môn: {{jobPosition}}</p>
<p>2. Công việc: {{jobPosition}}</p>
<p>3. Địa điểm làm việc: {{workLocation}}</p>
<p> </p>
<p><strong>Điều 2: Thời hạn hợp đồng</strong></p>
<p>- Loại hợp đồng: Không xác định thời hạn / Xác định thời hạn</p>
<p>- Thời hạn: ... tháng, kể từ ngày {{startDate}} đến ngày {{endDate}}</p>
<p> </p>
<p><strong>Điều 3: Mức lương và chế độ</strong></p>
<p>1. Mức lương chính: {{basicSalary}} VNĐ/tháng</p>
<p>2. Thưởng KPI: {{kpiAmount}} VNĐ/tháng</p>
<p>3. Tổng thu nhập: {{netSalary}} VNĐ/tháng</p>
<p>4. Phụ cấp: {{allowance}}</p>
<p>5. Hình thức trả lương: Chuyển khoản / Tiền mặt</p>
<p> </p>
<p><strong>Điều 4: Thời giờ làm việc và nghỉ ngơi</strong></p>
<p>1. Thời giờ làm việc: 8h/ngày, 48h/tuần</p>
<p>2. Chế độ nghỉ: Theo quy định của pháp luật</p>
<p> </p>
<p><strong>Điều 5: Các điều khoản khác</strong></p>
<p>Hai bên cam kết thực hiện đúng và đầy đủ các quy định của Bộ luật Lao động.</p>
<p> </p>
<p style="text-align:right;"><strong>ĐẠI DIỆN BÊN A</strong></p>
<p style="text-align:right;"><em>(Ký, ghi rõ họ tên)</em></p>
<p style="text-align:right;">..........................</p>
<p style="text-align:left;"> </p>
<p style="text-align:left;"><strong>ĐẠI DIỆN BÊN B</strong></p>
<p style="text-align:left;"><em>(Ký, ghi rõ họ tên)</em></p>
<p style="text-align:left;">..........................</p>`
  },
  {
    id: 'thoi-vu',
    name: 'Thời vụ',
    type: 'THOI_VU',
    icon: FileSignature,
    desc: 'Hợp đồng lao động thời vụ',
    content: `<h2 style="text-align:center;"><strong>HỢP ĐỒNG LAO ĐỘNG THỜI VỤ</strong></h2>
<p style="text-align:center;">(Số: {{code}})</p>
<p> </p>
<p><strong>Hôm nay, ngày ... tháng ... năm ...</strong></p>
<p> </p>
<p><strong>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</strong></p>
<p>Tên công ty: {{employerName}}</p>
<p>Địa chỉ: {{employerAddress}}</p>
<p> </p>
<p><strong>BÊN B (NGƯỜI LAO ĐỘNG):</strong></p>
<p>Họ và tên: {{personName}}</p>
<p>CCCD: {{employeeIdNumber}}</p>
<p> </p>
<p><strong>NỘI DUNG HỢP ĐỒNG:</strong></p>
<p>1. Công việc: {{jobPosition}}</p>
<p>2. Thời hạn: Từ ngày {{startDate}} đến ngày {{endDate}}</p>
<p>3. Lương cơ bản: {{basicSalary}} VNĐ</p>
<p>4. Thưởng KPI: {{kpiAmount}} VNĐ</p>
<p>5. Tổng thu nhập: {{netSalary}} VNĐ</p>
<p>6. Hình thức trả: Theo sản phẩm / Theo thời gian</p>
<p>Phụ cấp: {{allowance}}</p>
<p> </p>
<p style="text-align:right;"><strong>ĐẠI DIỆN BÊN A</strong></p>
<p style="text-align:right;">..........................</p>
<p style="text-align:left;"> </p>
<p style="text-align:left;"><strong>ĐẠI DIỆN BÊN B</strong></p>
<p style="text-align:left;">..........................</p>`
  },
  {
    id: 'part-time',
    name: 'Bán thời gian',
    type: 'PART_TIME',
    icon: UserCheck,
    desc: 'Hợp đồng bán thời gian',
    content: `<h2 style="text-align:center;"><strong>HỢP ĐỒNG LAO ĐỘNG BÁN THỜI GIAN</strong></h2>
<p style="text-align:center;">(Số: {{code}})</p>
<p> </p>
<p><strong>Hôm nay, ngày ... tháng ... năm ...</strong></p>
<p> </p>
<p><strong>BÊN A (NGƯỜI SỬ DỤNG LAO ĐỘNG):</strong></p>
<p>Tên công ty: {{employerName}}</p>
<p> </p>
<p><strong>BÊN B (NGƯỜI LAO ĐỘNG):</strong></p>
<p>Họ và tên: {{personName}}</p>
<p> </p>
<p><strong>NỘI DUNG HỢP ĐỒNG:</strong></p>
<p>1. Công việc: {{jobPosition}}</p>
<p>2. Thời gian làm việc: ... giờ/ngày, ... ngày/tuần</p>
<p>3. Thời hạn: Từ ngày {{startDate}} đến ngày {{endDate}}</p>
<p>4. Lương cơ bản: {{basicSalary}} VNĐ/tháng</p>
<p>5. Thưởng KPI: {{kpiAmount}} VNĐ/tháng</p>
<p>6. Tổng thu nhập: {{netSalary}} VNĐ/tháng</p>
<p>Phụ cấp: {{allowance}}</p>
<p> </p>
<p style="text-align:right;"><strong>ĐẠI DIỆN BÊN A</strong></p>
<p style="text-align:right;">..........................</p>
<p style="text-align:left;"> </p>
<p style="text-align:left;"><strong>ĐẠI DIỆN BÊN B</strong></p>
<p style="text-align:left;">..........................</p>`
  },
]

export const PLACEHOLDER_PATTERNS = [
  { key: 'personName', label: 'Tên người lao động' },
  { key: 'jobPosition', label: 'Chức vụ' },
  { key: 'employerName', label: 'Tên công ty' },
  { key: 'employerAddress', label: 'Địa chỉ công ty' },
  { key: 'employerRep', label: 'Người đại diện' },
  { key: 'employeeIdNumber', label: 'CCCD' },
  { key: 'employeeDob', label: 'Ngày sinh' },
  { key: 'workLocation', label: 'Địa điểm làm việc' },
  { key: 'basicSalary', label: 'Lương cơ bản' },
  { key: 'kpiAmount', label: 'Thưởng KPI' },
  { key: 'netSalary', label: 'Tổng lương net' },
  { key: 'allowance', label: 'Phụ cấp' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày kết thúc' },
  { key: 'code', label: 'Mã hợp đồng' },
]
