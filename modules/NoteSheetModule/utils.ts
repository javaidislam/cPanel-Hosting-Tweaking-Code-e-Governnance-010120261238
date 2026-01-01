
export function toRoman(num: number): string {
  const lookup: Record<string, number> = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  let roman = '';
  for (let i in lookup ) {
    while ( num >= lookup[i] ) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

export function toChar(num: number): string {
    return String.fromCharCode(65 + num); // 0 -> A, 1 -> B
}

/**
 * Extracts a short departmental code from the statutory ID.
 * E.g. "Schedule-I-Entry-33-1000000000" -> "33"
 */
export function getDeptShortCode(deptId: string): string {
    if (!deptId) return 'GEN';
    if (deptId === 'Cabinet') return 'CAB';
    const match = deptId.match(/Entry-(\d+)/);
    return match ? match[1] : deptId.substring(0, 3).toUpperCase();
}

/**
 * Transforms specific keywords into interactive hyperlinks pointing to the PUC.
 */
export function linkifyPUC(content: string): string {
    const regex = /(\bPUC\b|\bP\.U\.C\b|\bpage under consideration\b)/gi;
    return content.replace(regex, (match) => {
        return `<a href="#" data-puc-link="true" class="text-blue-700 underline font-bold cursor-pointer hover:text-blue-900" title="View Reference PUC">${match}</a>`;
    });
}

export const getDraftTypeFromContent = (content: string) => {
    if (content.includes('Summary for CM')) return 'Summary for CM';
    if (content.includes('Summary for Governor')) return 'Summary for Governor';
    if (content.includes('Summary for Cabinet')) return 'Summary for Cabinet';
    if (content.includes('Note for CS')) return 'Note for CS';
    if (content.includes('Note for Secretary')) return 'Note for Secretary';
    if (content.includes('DFA')) return 'DFA';
    if (content.includes('Miscellaneous Note')) return 'Miscellaneous Notes';
    return null;
};
