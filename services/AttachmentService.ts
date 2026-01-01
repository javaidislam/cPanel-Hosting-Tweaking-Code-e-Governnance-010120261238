
import { DataService } from './dataService.ts';
import { Official } from '../types/shared.ts';

export const AttachmentService = {
    /**
     * Uploads a file to the DataService and returns the attachment ID.
     */
    upload: async (file: File, content?: string, existingId?: string): Promise<string> => {
        return await DataService.saveAttachment(file, content, existingId);
    },

    /**
     * Opens the attachment in a new window with a watermark.
     */
    view: async (attachmentId: string, viewer: Official) => {
        const attachment = await DataService.getAttachment(attachmentId);
        
        if (!attachment) {
            alert("Attachment not found.");
            return;
        }

        const win = window.open("", "_blank");
        if (!win) {
            alert("Please allow popups to view attachments.");
            return;
        }

        const timestamp = new Date().toLocaleString();
        const watermarkText = `${viewer.designation} - ${timestamp}`;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>View Attachment - ${attachment.name}</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #f0f0f0; display: flex; justify-content: center; align-items: center; }
                    .content-wrapper { position: relative; max-width: 95%; max-height: 95%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    img, iframe { max-width: 100%; max-height: 100vh; border: 1px solid #ccc; background: white; }
                    .watermark-container {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        pointer-events: none;
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                        align-content: center;
                        overflow: hidden;
                        z-index: 999;
                    }
                    .watermark {
                        transform: rotate(-45deg);
                        color: rgba(255, 0, 0, 0.15);
                        font-family: sans-serif;
                        font-weight: bold;
                        font-size: 10px;
                        margin: 50px;
                        white-space: nowrap;
                    }
                </style>
            </head>
            <body>
                <div class="content-wrapper">
                    ${attachment.type.startsWith('image/') 
                        ? `<img src="${attachment.data}" />`
                        : `<iframe src="${attachment.data}" width="800" height="1000"></iframe>`
                    }
                    <div class="watermark-container">
                        <!-- Repeat watermark to cover screen -->
                        ${Array(12).fill(`<div class="watermark">${watermarkText}</div>`).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;

        win.document.write(htmlContent);
        win.document.close();
    }
};