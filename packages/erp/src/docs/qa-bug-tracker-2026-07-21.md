# Bug tracker paste — Linkage S1 (2026-07-21)

**Cách đưa vào Google Sheet BUG FREZO**

1. Mở sheet: https://docs.google.com/spreadsheets/d/1Bep0AyTObzFKeusDFbQhjA4zZviwrotK1Rl5sD2ScVM/edit?usp=sharing
2. **File → Import → Upload** chọn `qa-bug-tracker-2026-07-21.tsv` (hoặc `.csv`) · Separator = Tab (TSV) / Comma (CSV) · Replace current sheet hoặc Append.
3. Hoặc mở TSV bằng Excel/Sheets rồi **copy toàn bộ → paste** vào ô A1 (UTF-8). Filter `Status = Confirmed` để xem bug thật; `Need Verify` = Blocked runtime.

**API ghi thẳng:** hiện **chưa** — máy không có `GOOGLE_*` / service account / gcloud. Để agent ghi sau: tạo SA Google Cloud (Sheets API bật) → share sheet **Editor** cho email SA → đặt JSON path vào `GOOGLE_APPLICATION_CREDENTIALS`.

---

## Counts

| Confirmed (Fail) | Need Verify (Blocked) | Pass (không vào sheet) |
|-----------------:|----------------------:|-----------------------:|
| 1 | 9 | 33 |

## Confirmed bug

| Bug ID | Linked TC | Severity | Priority | Title |
|--------|-----------|----------|----------|-------|
| BUG-FP-04 | FP-04 | Major | P1 | Fiscal close/reopen thiếu UI (hooks+BE có, không page gọi) |

## Need Verify rows (Blocked — không gọi Confirmed)

LNK01-02, LNK02-06, LNK02-07, LNK03-07, LNK03-08, LNK09-06, LNK09-07, DEP-05, MOB-03.
