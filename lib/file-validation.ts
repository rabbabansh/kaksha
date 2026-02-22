export const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]; // %PDF
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function isValidPDF(file: File): Promise<boolean> {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 4) return false;

    for (let i = 0; i < 4; i++) {
        if (bytes[i] !== PDF_MAGIC_BYTES[i]) {
            return false;
        }
    }
    return true;
}

export function isFileSizeValid(file: File, maxSize = MAX_FILE_SIZE): boolean {
    return file.size <= maxSize;
}

export function sanitizeFilename(filename: string): string {
    if (!filename) return "unnamed_file";
    // Remove path traversal characters and control characters
    return filename.replace(/[\/\\]/g, "").replace(/[\x00-\x1F\x7F]/g, "");
}
