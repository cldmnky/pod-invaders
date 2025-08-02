package monitor

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Monitor represents a URL to be monitored.
type Monitor struct {
	URL    string             `json:"url"`
	ID     string             `json:"id"`
	Ctx    context.Context    `json:"-"`
	Cancel context.CancelFunc `json:"-"`
}

// Status represents the health status of a monitored URL.
type Status struct {
	URL    string `json:"url"`
	Status string `json:"status"` // e.g., "up", "down", "unknown"
	ID     string `json:"id"`
}

// Manager handles all active monitors.
type Manager struct {
	mu       sync.Mutex
	monitors map[string]*Monitor
	statuses map[string]*Status
}

// NewManager creates a new monitor manager.
func NewManager() *Manager {
	return &Manager{
		monitors: make(map[string]*Monitor),
		statuses: make(map[string]*Status),
	}
}

// Start begins monitoring a new URL.
func (m *Manager) Start(ctx context.Context, url string) (string, error) {

	m.mu.Lock()
	defer m.mu.Unlock()

	id := uuid.New().String()
	monitorCtx, cancel := context.WithCancel(ctx)

	monitor := &Monitor{
		URL:    url,
		ID:     id,
		Ctx:    monitorCtx,
		Cancel: cancel,
	}

	status := &Status{
		URL:    url,
		ID:     id,
		Status: "unknown",
	}

	m.monitors[id] = monitor
	m.statuses[id] = status

	go m.runMonitor(monitor)

	return id, nil
}

// runMonitor is the background goroutine that checks the URL status.
func (m *Manager) runMonitor(mon *Monitor) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	// Custom transport to ignore TLS verification
	transport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := http.Client{
		Timeout:   5 * time.Second,
		Transport: transport,
	}

	// Run the monitor once immediately
	resp, err := client.Get(mon.URL)
	newStatus := "down"
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode >= 200 && resp.StatusCode < 500 {
			newStatus = "up"
		}
	} else {
		log.Printf("Error monitoring URL %s: %v", mon.URL, err)
	}
	m.updateStatus(mon.ID, newStatus)

	for {
		select {
		case <-mon.Ctx.Done():
			log.Printf("Monitoring service for URL %s (ID: %s) stopped.", mon.URL, mon.ID)
			return
		case <-ticker.C:
			resp, err := client.Get(mon.URL)
			newStatus := "down"
			if err == nil {
				defer resp.Body.Close()
				if resp.StatusCode >= 200 && resp.StatusCode < 500 {
					newStatus = "up"
				}
			} else {
				log.Printf("Error monitoring URL %s: %v", mon.URL, err)
			}
			m.updateStatus(mon.ID, newStatus)
		}
	}
}

// updateStatus safely updates the status of a monitor.
func (m *Manager) updateStatus(id, status string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s, ok := m.statuses[id]; ok {
		s.Status = status
	}
}

// Stop terminates monitoring for a given ID.
func (m *Manager) Stop(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	monitor, ok := m.monitors[id]
	if !ok {
		return fmt.Errorf("monitor with ID %s not found", id)
	}

	monitor.Cancel()
	delete(m.monitors, id)
	delete(m.statuses, id)

	return nil
}

// GetStatus retrieves the current status of a monitor.
func (m *Manager) GetStatus(id string) (*Status, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	status, ok := m.statuses[id]
	if !ok {
		return nil, fmt.Errorf("monitor status for ID %s not found", id)
	}
	// Return a copy
	statusCopy := *status
	return &statusCopy, nil
}
