// JSON Format - Beautify, Validate & Transform

// DOM Elements
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const statsEl = document.getElementById('stats');
const treeView = document.getElementById('tree-view');
const pathOutput = document.getElementById('path-output');
const selectedPath = document.getElementById('selected-path');

// Sample JSON
const sampleJSON = {
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "isActive": true,
    "address": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001"
    },
    "hobbies": ["reading", "gaming", "coding"],
    "settings": {
        "theme": "dark",
        "notifications": {
            "email": true,
            "push": false
        }
    }
};

// Initialize
function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Main actions
    document.getElementById('format-btn').addEventListener('click', formatJSON);
    document.getElementById('minify-btn').addEventListener('click', minifyJSON);
    document.getElementById('validate-btn').addEventListener('click', validateJSON);
    document.getElementById('clear-btn').addEventListener('click', clearAll);

    // Panel actions
    document.getElementById('paste-btn').addEventListener('click', pasteFromClipboard);
    document.getElementById('sample-btn').addEventListener('click', loadSample);
    document.getElementById('copy-btn').addEventListener('click', copyOutput);
    document.getElementById('download-btn').addEventListener('click', downloadJSON);

    // Transform buttons
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.addEventListener('click', () => transform(btn.dataset.action));
    });

    // Compare
    document.getElementById('compare-btn').addEventListener('click', compareJSON);

    // Path copy
    document.getElementById('copy-path').addEventListener('click', () => {
        navigator.clipboard.writeText(selectedPath.value);
    });

    // Auto-format on paste
    inputEl.addEventListener('paste', () => {
        setTimeout(formatJSON, 100);
    });
}

function getIndent() {
    const indent = document.getElementById('indent').value;
    return indent === 'tab' ? '\t' : parseInt(indent);
}

function formatJSON() {
    try {
        const input = inputEl.value.trim();
        if (!input) {
            setStatus('Enter some JSON to format', false);
            return;
        }

        let parsed = JSON.parse(input);

        // Sort keys if option enabled
        if (document.getElementById('sort-keys').checked) {
            parsed = sortObjectKeys(parsed);
        }

        const indent = getIndent();
        let formatted = JSON.stringify(parsed, null, indent);

        // Escape unicode if option enabled
        if (document.getElementById('escape-unicode').checked) {
            formatted = escapeUnicode(formatted);
        }

        outputEl.value = formatted;
        setStatus('✓ Formatted successfully', false);
        updateStats(input, formatted, parsed);
        renderTreeView(parsed);

    } catch (e) {
        setStatus('✗ Invalid JSON: ' + e.message, true);
        outputEl.value = '';
    }
}

function minifyJSON() {
    try {
        const input = inputEl.value.trim();
        if (!input) {
            setStatus('Enter some JSON to minify', false);
            return;
        }

        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);

        outputEl.value = minified;
        setStatus('✓ Minified successfully', false);
        updateStats(input, minified, parsed);

    } catch (e) {
        setStatus('✗ Invalid JSON: ' + e.message, true);
    }
}

function validateJSON() {
    try {
        const input = inputEl.value.trim();
        if (!input) {
            setStatus('Enter some JSON to validate', false);
            return;
        }

        const parsed = JSON.parse(input);
        setStatus('✓ Valid JSON', false);
        outputEl.value = 'Valid JSON!\n\nType: ' + getType(parsed) + '\n' + 
                        (Array.isArray(parsed) ? 'Items: ' + parsed.length : 'Keys: ' + Object.keys(parsed).length);

    } catch (e) {
        setStatus('✗ Invalid JSON: ' + e.message, true);
        outputEl.value = 'Error at position ' + extractPosition(e.message) + '\n\n' + e.message;
    }
}

function clearAll() {
    inputEl.value = '';
    outputEl.value = '';
    treeView.innerHTML = '<p class="empty-state">Format JSON to see the tree view</p>';
    pathOutput.style.display = 'none';
    setStatus('Ready', false);
    statsEl.textContent = '';
}

function pasteFromClipboard() {
    navigator.clipboard.readText().then(text => {
        inputEl.value = text;
        formatJSON();
    });
}

function loadSample() {
    inputEl.value = JSON.stringify(sampleJSON, null, 2);
    formatJSON();
}

function copyOutput() {
    navigator.clipboard.writeText(outputEl.value).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = '✓ Copied';
        setTimeout(() => btn.textContent = '📋 Copy', 2000);
    });
}

function downloadJSON() {
    const blob = new Blob([outputEl.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
}

function transform(action) {
    try {
        const input = inputEl.value.trim();
        if (!input) {
            setStatus('Enter some JSON first', false);
            return;
        }

        const parsed = JSON.parse(input);
        let result;

        switch (action) {
            case 'to-array':
                result = Array.isArray(parsed) ? parsed : [parsed];
                break;
            case 'flatten':
                result = flattenObject(parsed);
                break;
            case 'extract-keys':
                result = extractKeys(parsed);
                break;
            case 'extract-values':
                result = extractValues(parsed);
                break;
            case 'to-csv':
                result = toCSV(parsed);
                outputEl.value = result;
                setStatus('✓ Converted to CSV', false);
                return;
            case 'to-yaml':
                result = toYAML(parsed);
                outputEl.value = result;
                setStatus('✓ Converted to YAML', false);
                return;
        }

        outputEl.value = JSON.stringify(result, null, getIndent());
        setStatus('✓ Transformed successfully', false);

    } catch (e) {
        setStatus('✗ Transform failed: ' + e.message, true);
    }
}

function compareJSON() {
    const a = document.getElementById('compare-a').value.trim();
    const b = document.getElementById('compare-b').value.trim();
    const resultEl = document.getElementById('compare-result');

    try {
        const objA = JSON.parse(a || '{}');
        const objB = JSON.parse(b || '{}');
        const diff = deepDiff(objA, objB);

        if (diff.length === 0) {
            resultEl.innerHTML = '<span class="diff-add">✓ Objects are identical</span>';
        } else {
            resultEl.innerHTML = diff.map(d => {
                const cls = d.type === 'added' ? 'diff-add' : d.type === 'removed' ? 'diff-remove' : 'diff-change';
                return `<div class="${cls}">${d.type.toUpperCase()}: ${d.path} ${d.type === 'changed' ? `(${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.newValue)})` : ''}</div>`;
            }).join('');
        }
    } catch (e) {
        resultEl.innerHTML = `<span class="diff-remove">Error parsing JSON: ${e.message}</span>`;
    }
}

// Helper functions
function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'error' : '';
}

function updateStats(input, output, parsed) {
    const inputSize = new Blob([input]).size;
    const outputSize = new Blob([output]).size;
    const depth = getDepth(parsed);
    statsEl.textContent = `${inputSize} → ${outputSize} bytes | Depth: ${depth}`;
}

function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = sortObjectKeys(obj[key]);
            return acc;
        }, {});
    }
    return obj;
}

function escapeUnicode(str) {
    return str.replace(/[\u0080-\uffff]/g, (char) => {
        return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
    });
}

function flattenObject(obj, prefix = '') {
    const result = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(result, flattenObject(obj[key], newKey));
        } else {
            result[newKey] = obj[key];
        }
    }
    return result;
}

function extractKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(extractKeys(obj[key], fullKey));
        }
    }
    return keys;
}

function extractValues(obj) {
    let values = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            values = values.concat(extractValues(obj[key]));
        } else {
            values.push(obj[key]);
        }
    }
    return values;
}

function toCSV(data) {
    if (!Array.isArray(data)) data = [data];
    if (data.length === 0) return '';
    
    const headers = Object.keys(flattenObject(data[0]));
    const rows = data.map(item => {
        const flat = flattenObject(item);
        return headers.map(h => JSON.stringify(flat[h] ?? '')).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}

function toYAML(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === 'object' && item !== null) {
                yaml += `${spaces}-\n${toYAML(item, indent + 1)}`;
            } else {
                yaml += `${spaces}- ${formatYAMLValue(item)}\n`;
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                yaml += `${spaces}${key}:\n${toYAML(value, indent + 1)}`;
            } else {
                yaml += `${spaces}${key}: ${formatYAMLValue(value)}\n`;
            }
        }
    }
    
    return yaml;
}

function formatYAMLValue(val) {
    if (val === null) return 'null';
    if (typeof val === 'string') return val.includes(':') || val.includes('#') ? `"${val}"` : val;
    return String(val);
}

function getType(val) {
    if (Array.isArray(val)) return 'Array';
    if (val === null) return 'null';
    return typeof val;
}

function getDepth(obj, depth = 0) {
    if (typeof obj !== 'object' || obj === null) return depth;
    return Math.max(...Object.values(obj).map(v => getDepth(v, depth + 1)));
}

function extractPosition(msg) {
    const match = msg.match(/position (\d+)/);
    return match ? match[1] : 'unknown';
}

function deepDiff(a, b, path = '') {
    const diffs = [];
    const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    
    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const inA = key in (a || {});
        const inB = key in (b || {});
        
        if (!inA && inB) {
            diffs.push({ type: 'added', path: currentPath, value: b[key] });
        } else if (inA && !inB) {
            diffs.push({ type: 'removed', path: currentPath, value: a[key] });
        } else if (typeof a[key] === 'object' && typeof b[key] === 'object') {
            diffs.push(...deepDiff(a[key], b[key], currentPath));
        } else if (a[key] !== b[key]) {
            diffs.push({ type: 'changed', path: currentPath, oldValue: a[key], newValue: b[key] });
        }
    }
    
    return diffs;
}

// Tree View
function renderTreeView(obj, path = '') {
    treeView.innerHTML = renderNode(obj, path);
    pathOutput.style.display = 'none';
}

function renderNode(obj, path) {
    if (obj === null) return `<span class="tree-value null" onclick="selectPath('${path}')">null</span>`;
    
    if (typeof obj !== 'object') {
        const type = typeof obj;
        const display = type === 'string' ? `"${obj}"` : String(obj);
        return `<span class="tree-value ${type}" onclick="selectPath('${path}')">${escapeHTML(display)}</span>`;
    }
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) return '<span class="tree-bracket">[]</span>';
        return '<span class="tree-bracket">[</span>\n' +
            obj.map((item, i) => `<div class="tree-node">${renderNode(item, `${path}[${i}]`)}</div>`).join('') +
            '<span class="tree-bracket">]</span>';
    }
    
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="tree-bracket">{}</span>';
    
    return '<span class="tree-bracket">{</span>\n' +
        keys.map((key, i) => {
            const comma = i < keys.length - 1 ? '<span class="tree-comma">,</span>' : '';
            return `<div class="tree-node"><span class="tree-key">"${key}"</span>: ${renderNode(obj[key], path ? `${path}.${key}` : key)}${comma}</div>`;
        }).join('') +
        '<span class="tree-bracket">}</span>';
}

function selectPath(path) {
    selectedPath.value = path;
    pathOutput.style.display = 'flex';
}
window.selectPath = selectPath;

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
