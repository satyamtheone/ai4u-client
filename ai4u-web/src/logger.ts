export function LOGGER(message: string, level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN' = 'INFO') {
    const now = new Date().toISOString();

    const err = new Error();
    const stackLines = err.stack?.split('\n') || [];
    const callerLine = stackLines[2] || '';

    const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
    const file = match ? match[1].split('/').pop() : 'unknown';
    const line = match ? match[2] : '0';
    const componentName = 'AI4U';

    // ANSI escape codes for purple
    const purple = '\x1b[35m';
    const reset = '\x1b[0m';

    console.log(`${purple}${componentName}:${now}:${level}:${file}:${line}:${message}${reset}`);
}
