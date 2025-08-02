// API Communication Functions
import { updateDebugPanelMonitorStatus } from './ui.js';

export async function reportKill(podName, namespace, isRealPod) {
    try {
        await fetch('/kill', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: podName, namespace: namespace, isRealPod: true })
        });
    } catch (error) { 
        console.error("Failed to report kill:", error); 
    }
}

export async function sendHighscore(playerName, gameStartedTimestamp, timeTaken, levelsFinished, score) {
    try {
        await fetch('/highscore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: playerName,
                gameStarted: gameStartedTimestamp,
                timeTaken: timeTaken,
                levelsFinished: levelsFinished,
                score: score
            })
        });
    } catch (e) {
        console.error('Failed to send highscore:', e);
    }
}

export async function sendNamespaces(namespaces) {
    try {
        await fetch('/namespaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ namespaces })
        });
    } catch (e) {
        console.error('Failed to send namespaces:', e);
    }
}

export async function startMonitor(monitorUrl) {
    try {
        const res = await fetch('/monitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: monitorUrl })
        });
        if (res.ok) {
            const data = await res.json();
            return data.id || null;
        }
        return null;
    } catch (e) {
        console.error('Failed to send monitor URL:', e);
        return null;
    }
}

export async function stopMonitor(monitorId) {
    if (monitorId) {
        try {
            await fetch('/monitor/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: monitorId })
            });
        } catch (e) {
            console.error('Failed to stop monitor:', e);
        }
    }
}

// Monitor Status Polling
let monitorStatusInterval = null;

export function startMonitorStatusPolling(monitorId) {
    if (monitorStatusInterval) clearInterval(monitorStatusInterval);
    monitorStatusInterval = setInterval(() => {
        fetch(`/monitor/status?id=${monitorId}`)
            .then(res => res.json())
            .then(data => {
                let statusText = '';
                if (data.error) {
                    statusText = `Monitor Error: ${data.error}`;
                } else {
                    statusText = `Monitor Status: ${data.status || data.Status} | URL: ${data.url || data.URL}`;
                }
                updateDebugPanelMonitorStatus(statusText);
            })
            .catch(err => {
                updateDebugPanelMonitorStatus(`Monitor Status fetch error: ${err}`);
            });
    }, 5000);
}

export function stopMonitorStatusPolling() {
    if (monitorStatusInterval) {
        clearInterval(monitorStatusInterval);
        monitorStatusInterval = null;
        updateDebugPanelMonitorStatus('');
    }
}
