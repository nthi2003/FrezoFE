// ============================================================
// FREZO ERP — Menu Types (FE)
// Matches BE MenuResponse / MenuSidebarResponse
// ============================================================

// ---- Raw response từ BE (flat list) ----
// Tương ứng MenuResponse.java
export interface MenuResponseItem {
  id: string
  code: string
  appCode?: string
  name: string
  nameEn?: string
  parentCode: string | null   // null = root group
  orderIndex: number
  menuType?: number           // 1 = folder/group, 2 = leaf item
  isPublic?: boolean
  status?: boolean
  icon?: string | null
  feUrl?: string | null       // Route path để navigate
  folderPath?: string | null  // Phân nhóm folder logic
  permissions?: MenuPermission[]
}

export interface MenuPermission {
  id: string
  code: string
  name: string
}

// ---- FE Menu Tree Node (sau khi build từ flat list) ----
export interface MenuTreeNode extends MenuResponseItem {
  children: MenuTreeNode[]    // [] = leaf item
  isGroup: boolean            // parentCode === null hoặc không có feUrl
}
