# -*- coding: utf-8 -*-
"""Append QA bugs to Google Sheet BUGS tab. Do not print private keys."""
from __future__ import annotations

import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build

sys.stdout.reconfigure(encoding="utf-8")

CREDS = Path(r"C:\Users\admin.DESKTOP-Q3LH2CK\.frezo\bugfrezo-sheets-writer.json")
SHEET_ID = "1Bep0AyTObzFKeusDFbQhjA4zZviwrotK1Rl5sD2ScVM"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

creds = service_account.Credentials.from_service_account_file(str(CREDS), scopes=SCOPES)
service = build("sheets", "v4", credentials=creds)

existing = (
    service.spreadsheets()
    .values()
    .get(spreadsheetId=SHEET_ID, range="BUGS!A2:A200")
    .execute()
    .get("values", [])
)
existing_ids = {r[0] for r in existing if r}
print("existing", sorted(existing_ids))

rows = [
    [
        "BUG-DEP-06",
        "2026-07-22",
        "Assets / Auth seed",
        "Khấu hao: FE/BE gate ASSET.DEPRECIATION.* nhưng permission_data.sql không seed /asset/depreciation",
        "Major",
        "P1",
        "Confirmed",
        "BE/SA: thêm ASSET_DEPRECIATION_VIEW|CREATE|UPDATE (api=/asset/depreciation); map ADMIN/MANAGER; QA retest DEP-02 non-admin",
        "Static verify (seed + FE/BE)",
        "1. Đọc DepreciationController @CheckPermission api=/asset/depreciation. 2. FE usePermission ASSET.DEPRECIATION.VIEW|UPDATE. 3. Grep permission_data.sql — chỉ qlts/asset, không có ASSET_DEPRECIATION_*. 4. menu_permission map SYS_ASSET_DEP → /asset/depreciation (join rỗng).",
        "Có permission ASSET_DEPRECIATION_* trên /asset/depreciation; role ADMIN/MANAGER nhận; FE hiện UI; BE không 403 oan.",
        "Seed chỉ QLTS_ASSET_*; không row /asset/depreciation. Non-isAdmin: FE EmptyState không quyền; BE PERM-DENY. Menu join perm rỗng. Chỉ bypass isAdmin/dataAction=3.",
        "CYCLE-DEP ship FE/BE trước khi thêm block seed permission (comment controller ≠ seed).",
        "DEP-02",
        "BE/SA (+ FE verify)",
        "QA Frontend",
        "Severity S2→Major. Block release khấu hao cho user non-admin.",
    ],
    [
        "BUG-DEP-07",
        "2026-07-22",
        "Assets / Depreciation",
        "DepreciationPostPage: nút Ghi sổ vẫn mở khi kỳ CLOSED hoặc đã POSTED — không pre-check kỳ",
        "Minor",
        "P2",
        "Confirmed",
        "FE: bind usePeriods; disable/ẩn Ghi sổ khi period CLOSED/LOCKED hoặc existingPosted; copy hint mở lại kỳ",
        "Static verify (FE code)",
        "1. Trace DepreciationPostPage — không usePeriods. 2. Nút Ghi sổ chỉ disabled={post.isPending}. 3. existingPosted chỉ badge, không khóa CTA. 4. BE assertPeriodOpen chỉ khi POST.",
        "Kỳ CLOSED/LOCKED → disable Ghi sổ + copy; kỳ đã POSTED → không khuyến khích ghi lại (CTA khóa).",
        "User bấm Ghi sổ → Confirm → fail toast PERIOD_CLOSED hoặc idempotent. Guide nói kỳ đóng nhưng UI không pre-check.",
        "FE chỉ map lỗi sau API; thiếu bind periodsApi + disable theo status/existingPosted.",
        "DEP-03,DEP-04",
        "FE",
        "QA Frontend",
        "Severity S3→Minor. UX/guard; BE vẫn chặn đúng.",
    ],
    [
        "BUG-ACC-JE-01",
        "2026-07-22",
        "Accounting / Journals",
        "JournalsPage: API lỗi hiển thị như empty “Chưa có chứng từ” — thiếu ErrorState",
        "Minor",
        "P2",
        "Confirmed",
        "FE: destructure isError từ useJournalsByPeriod; render ErrorState + Thử lại; không nhầm empty",
        "Static verify (FE code)",
        "1. Mở JournalsPage.tsx. 2. useJournalsByPeriod chỉ lấy data/isLoading/refetch. 3. Body: !isLoading && filtered.length===0 → copy empty.",
        "ErrorState + Thử lại khi 403/500/network; không nhầm empty.",
        "403/500/network → cùng copy empty; KPI=0. Không ErrorState.",
        "Thiếu nhánh error theo FE_UI_UX_STANDARD CRUD.",
        "CRUD-ErrorState",
        "FE",
        "QA Frontend",
        "Severity S3→Minor.",
    ],
    [
        "BUG-ACC-JE-02",
        "2026-07-22",
        "Accounting / Journals",
        "JournalsPage: kỳ CLOSED vẫn cho mở “Đảo chứng từ”; BE mới chặn PERIOD_CLOSED",
        "Minor",
        "P2",
        "Confirmed",
        "FE: đọc selectedPeriod.status; ẩn/disable Đảo khi != OPEN; hint khóa kỳ",
        "Static verify (FE+BE)",
        "1. Period selector tô xám CLOSED nhưng vẫn chọn được. 2. Detail POSTED + canUpdateJournal → nút Đảo. 3. BE reverse → assertPeriodStatus.",
        "Kỳ không OPEN → ẩn/disable Đảo + hint khóa kỳ.",
        "User đi hết flow → toast/error PERIOD_CLOSED. UI không đọc status trước mutation.",
        "UI không bind selectedPeriod.status trước mutation reverse.",
        "FP period guards",
        "FE",
        "QA Frontend",
        "Severity S3→Minor. Liên quan FP close.",
    ],
    [
        "BUG-MOB-ATT-01",
        "2026-07-22",
        "Mobile / Attendance",
        "Mobile check-in/list: personId fallback profile.id (userId) khi thiếu personId",
        "Major",
        "P1",
        "Confirmed",
        "Mobile: bỏ fallback profile.id; chỉ dùng personId; thiếu → block UI chưa liên kết nhân sự",
        "Static verify (Mobile+Auth BE)",
        "1. AuthProfileService: id=userId, personId riêng (chỉ set nếu user.personId!=null). 2. Mobile attendance/check-in/leave/new/index: personId = profile?.personId ?? profile?.id. 3. Payload check-in gửi personId.",
        "Chỉ dùng personId thật; thiếu → block + copy liên kết NV; không gửi user UUID.",
        "User thiếu personId → gửi userId → check-in/list/stats sai hoặc lỗi nghiệp vụ; roster ERP lệch.",
        "Fallback nhầm entity User vs Person.",
        "MOB-01,MOB-03",
        "Mobile",
        "QA Frontend",
        "Severity S2→Major. payroll.tsx đã đúng (personId ?? null) — parity.",
    ],
    [
        "BUG-MOB-LEAVE-01",
        "2026-07-22",
        "Mobile / Leave",
        "Leave tab: thiếu contractId vẫn EmptyState “Chưa có đơn phép” + CTA Xin phép",
        "Minor",
        "P2",
        "Confirmed",
        "Mobile: phân nhánh !contractId → EmptyState chưa có HĐ active; ẩn CTA tạo đơn",
        "Static verify (Mobile)",
        "1. useMyLeaves(contractId) enabled: !!contractId. 2. contractId null → không fetch. 3. ListEmptyComponent vẫn “Chưa có đơn phép” + Tạo đơn phép.",
        "Empty riêng: chưa có HĐ active / chưa resolve contract; không CTA tạo đơn.",
        "Giống “chưa xin phép lần nào”; CTA /leave/new cũng fail thiếu contract.",
        "Không phân biệt !contractId vs empty list.",
        "MOB-02",
        "Mobile",
        "QA Frontend",
        "Severity S3→Minor.",
    ],
]

new_rows = [r for r in rows if r[0] not in existing_ids]
skipped = [r[0] for r in rows if r[0] in existing_ids]
print("skip_dup", skipped)
print("append", [r[0] for r in new_rows])

if new_rows:
    result = (
        service.spreadsheets()
        .values()
        .append(
            spreadsheetId=SHEET_ID,
            range="BUGS!A1",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": new_rows},
        )
        .execute()
    )
    updates = result.get("updates", {})
    print("updatedRange", updates.get("updatedRange"))
    print("updatedRows", updates.get("updatedRows"))
else:
    print("nothing to append")

final = (
    service.spreadsheets()
    .values()
    .get(spreadsheetId=SHEET_ID, range="BUGS!A2:G50")
    .execute()
    .get("values", [])
)
for r in final:
    while len(r) < 7:
        r.append("")
    print(f"{r[0]} | {r[6]} | {r[3][:70]}")
