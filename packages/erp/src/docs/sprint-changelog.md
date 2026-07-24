# Sprint changelog

Tóm tắt các sprint FE gần đây (Docs Hub MVP — cập nhật tay khi ship).

## Sprint Linkage S1 (2026-07-21)

- **LNK-02** Payroll: RESULT modal + banner liệt kê NV skip thiếu HĐ; CTA `/qlns/contract`; không success-only khi toàn skip.
- **LNK-03** Attendance daily roster: cột Tên · Phòng · In · Out · Status · GPS · Ghi chú (verify `/qlns/attendance/daily`).
- **LNK-09** Email compose/inbox: block khi chưa `activated` + CTA `/email/config`; map `error.email.config.not.found`.
- **LNK-04** PageGuide + banner tách Approval Inbox vs Workflow designer.

## Sprint 3

- **Purchase Order** từ PR `APPROVED` — list/detail, confirm/receive stub.
- **Export CSV** sổ cái + Trial Balance; trang **BCTC** (BCĐKT / KQKD).
- **Notification** deep-link + mark-all (không nuốt 401).
- **Recruitment** sync stage BE (`APPLIED` → `HIRED`) + duyệt thuê.

## Sprint 2

- Leave / Payroll → Approval Inbox.
- Stock Alerts → tạo PR; Bank fuzzy + lock/reopen.
- Depreciation preview/post.

## Sprint 1 / backlog

- Approval inbox, warehouse reorder/stock alerts.
- OKR, Performance, Onboarding, Stock Take, Meetings, Email Sequences.

## Notes Plan / FR-UX

- **FR-UX-19** Settings · Định vị chấm công: Leaflet + OpenStreetMap plan view (marker tâm + circle bán kính), live khi đổi lat/lng/radius; EmptyState khi tọa độ trống/invalid. Docs Hub GPS/WiFi giữ nguyên. Không API key.

## Next steps

- BE seed menu parent/children đầy đủ → bỏ fallback group client.
- PO receive thật + report BCTC API production.
- Docs Hub: thêm bài module-specific khi BA SRS về.
