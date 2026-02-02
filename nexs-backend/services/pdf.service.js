const html_to_pdf = require('html-pdf-node');

/**
 * PDF Service - Handles HTML to PDF conversion
 */
class PDFService {
    /**
     * Convert HTML content to PDF buffer
     * @param {string} htmlContent - HTML to convert
     * @param {Object} options - Conversion options
     * @returns {Promise<Buffer>} PDF buffer
     */
    async generateFromHtml(htmlContent, options = {}) {
        try {
            const file = { content: htmlContent };
            const defaultOptions = {
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                },
                printBackground: true
            };

            const pdfBuffer = await html_to_pdf.generatePdf(file, { ...defaultOptions, ...options });
            return pdfBuffer;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error('Failed to generate PDF from HTML');
        }
    }
}

module.exports = new PDFService();
