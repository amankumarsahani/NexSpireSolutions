const fs = require('fs');
const path = require('path');

/**
 * Template Loader - Loads and renders email templates
 * Templates are stored in /templates/emails/ directory
 * Supports variable substitution via {{variable}} syntax
 */
class TemplateLoader {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates', 'emails');
        this.cache = new Map();
    }

    /**
     * Load a template file from disk (with caching)
     * @param {string} templateName - Name of template file (without .html)
     * @returns {string} Template content
     */
    loadTemplate(templateName) {
        // Check cache first
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        const templatePath = path.join(this.templatesDir, `${templateName}.html`);

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Email template not found: ${templateName}`);
        }

        const content = fs.readFileSync(templatePath, 'utf8');

        // Cache in production
        if (process.env.NODE_ENV === 'production') {
            this.cache.set(templateName, content);
        }

        return content;
    }

    /**
     * Load base layout template
     * @returns {string} Base template content
     */
    loadBaseTemplate() {
        return this.loadTemplate('base');
    }

    /**
     * Replace variables in template with values
     * @param {string} template - Template string
     * @param {Object} variables - Key-value pairs to substitute
     * @returns {string} Rendered template
     */
    substituteVariables(template, variables) {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, value ?? '');
        }

        // Remove any remaining unsubstituted variables
        result = result.replace(/{{\s*\w+\s*}}/g, '');

        return result;
    }

    /**
     * Render a template with variables, wrapped in base layout
     * @param {string} templateName - Name of template file (without .html)
     * @param {Object} variables - Variables to substitute in template
     * @param {boolean} useBaseLayout - Whether to wrap in base layout (default: true)
     * @returns {string} Rendered HTML
     */
    render(templateName, variables = {}, useBaseLayout = true) {
        let content = this.loadTemplate(templateName);
        content = this.substituteVariables(content, variables);

        if (useBaseLayout) {
            try {
                let baseTemplate = this.loadBaseTemplate();
                baseTemplate = this.substituteVariables(baseTemplate, {
                    CONTENT: content,
                    year: new Date().getFullYear(),
                    ...variables
                });
                return baseTemplate;
            } catch (error) {
                // If base template doesn't exist, return content only
                console.warn('Base template not found, using content-only template');
                return content;
            }
        }

        return content;
    }

    /**
     * Clear template cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get list of available templates
     * @returns {string[]} Array of template names
     */
    getAvailableTemplates() {
        if (!fs.existsSync(this.templatesDir)) {
            return [];
        }

        return fs.readdirSync(this.templatesDir)
            .filter(file => file.endsWith('.html'))
            .map(file => file.replace('.html', ''));
    }
}

module.exports = new TemplateLoader();
