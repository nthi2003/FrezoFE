import mammoth from 'mammoth'

const mammothAny = mammoth as any
const { paragraph: transformParagraph } = mammothAny.transforms

const WORD_TO_CSS_ALIGN: Record<string, string> = {
  left: 'left',
  center: 'center',
  right: 'right',
  both: 'justify',
  distribute: 'justify',
}

function sanitizeStyleId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function headingTagForStyle(styleId: string): string {
  const match = styleId.match(/^heading(\d)$/i)
  if (match) {
    const level = parseInt(match[1], 10)
    if (level >= 1 && level <= 6) return `h${level}`
  }
  return 'p'
}

export async function convertDocxToHtml(arrayBuffer: ArrayBuffer): Promise<string> {
  const dynamicStyleMap: string[] = []

  const transformDocument = (doc: any) => {
    const transformFn = transformParagraph((p: any) => {
      const cssAlign = p.alignment ? WORD_TO_CSS_ALIGN[p.alignment] : null
      if (cssAlign) {
        const baseId = p.styleId || 'Normal'
        const encodedId = `__aln_${cssAlign}_${sanitizeStyleId(baseId)}`
        p.styleId = encodedId

        const tag = headingTagForStyle(baseId)
        dynamicStyleMap.push(
          `p.${encodedId} => ${tag}[style='text-align:${cssAlign}']:fresh`
        )
      }
      return p
    })
    return transformFn(doc)
  }

  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: dynamicStyleMap,
    transformDocument,
  })

  return result.value
}
