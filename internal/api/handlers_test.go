package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"

	"github.com/cldmnky/pod-invaders/internal/config"
	"github.com/cldmnky/pod-invaders/internal/game"
	"github.com/cldmnky/pod-invaders/internal/monitor"
)

// setupTestTemplate creates a temporary template file for testing
func setupTestTemplate(t *testing.T) string {
	tempDir := t.TempDir()
	templatePath := filepath.Join(tempDir, "index.html")

	templateContent := `<!DOCTYPE html>
<html>
<head>
    <title>{{.Title}}</title>
</head>
<body>
    <h1>{{.Title}}</h1>
</body>
</html>`

	err := os.WriteFile(templatePath, []byte(templateContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test template: %v", err)
	}

	return tempDir
}

// createTestServer creates a test server with mocked dependencies
func createTestServer(enableKube bool) *Server {
	cfg := &config.Config{
		EnableKube:     enableKube,
		NamespaceNames: []string{"default", "test"},
	}

	return &Server{
		config:         cfg,
		kubeClient:     nil, // Mock kubernetes client would go here
		killCache:      game.NewKillPodCache(),
		highscoreCache: game.NewInMemoryHighscoreCache(),
		namespaces:     game.Namespaces{Namespaces: cfg.NamespaceNames},
		monitorManager: monitor.NewManager(),
	}
}

// createTestApp creates a Fiber app with routes registered
func createTestApp(server *Server, templateDir string) *fiber.App {
	var app *fiber.App

	if templateDir != "" {
		// Create template engine with the provided directory
		engine := html.New(templateDir, ".html")
		app = fiber.New(fiber.Config{
			Views: engine,
		})
	} else {
		// Create app without templates for non-template tests
		app = fiber.New()
	}

	server.registerGameHandlers(app)
	server.registerMonitorHandlers(app)

	return app
}

func TestHandleRoot(t *testing.T) {
	server := createTestServer(false)
	templateDir := setupTestTemplate(t)
	app := createTestApp(server, templateDir)

	req := httptest.NewRequest("GET", "/", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != fiber.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("Expected status 200, got %d. Response: %s", resp.StatusCode, string(body))
	}

	// Verify the response contains the title
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	bodyStr := string(body)
	if !bytes.Contains(body, []byte("Pod Invaders")) {
		t.Errorf("Expected response to contain 'Pod Invaders', got: %s", bodyStr)
	}
}

func TestHandleGetNames(t *testing.T) {
	tests := []struct {
		name         string
		enableKube   bool
		queryParam   string
		expectedCode int
	}{
		{
			name:         "fake pods default count",
			enableKube:   false,
			queryParam:   "",
			expectedCode: 200,
		},
		{
			name:         "fake pods with count",
			enableKube:   false,
			queryParam:   "?count=5",
			expectedCode: 200,
		},
		{
			name:         "fake pods with large count",
			enableKube:   false,
			queryParam:   "?count=150", // Should be capped at 100
			expectedCode: 200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(tt.enableKube)
			app := createTestApp(server, "") // No templates needed for this test

			req := httptest.NewRequest("GET", "/names"+tt.queryParam, nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				t.Errorf("Expected status %d, got %d", tt.expectedCode, resp.StatusCode)
			}

			if resp.StatusCode == 200 {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					t.Fatalf("Failed to read response body: %v", err)
				}

				var pods []game.Pod
				if err := json.Unmarshal(body, &pods); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}

				if len(pods) == 0 {
					t.Error("Expected at least one pod in response")
				}

				// Test count limit
				if tt.queryParam == "?count=150" && len(pods) > 100 {
					t.Errorf("Expected maximum 100 pods, got %d", len(pods))
				}
			}
		})
	}
}

func TestHandleKill(t *testing.T) {
	tests := []struct {
		name         string
		payload      interface{}
		expectedCode int
		description  string
	}{
		{
			name: "successful kill",
			payload: game.Pod{
				Name:      "test-pod",
				Namespace: "default",
			},
			expectedCode: 200,
			description:  "Should successfully kill a pod",
		},
		{
			name: "duplicate kill",
			payload: game.Pod{
				Name:      "duplicate-pod",
				Namespace: "default",
			},
			expectedCode: 200,
			description:  "Should handle duplicate kill gracefully",
		},
		{
			name:         "invalid payload",
			payload:      "invalid json",
			expectedCode: 400,
			description:  "Should return 400 for invalid JSON",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false) // Use fake mode
			app := createTestApp(server, "")  // No templates needed

			var reqBody []byte
			var err error

			if pod, ok := tt.payload.(game.Pod); ok {
				reqBody, err = json.Marshal(pod)
				if err != nil {
					t.Fatalf("Failed to marshal pod: %v", err)
				}

				// For duplicate kill test, add the pod to cache first
				if tt.name == "duplicate kill" {
					server.killCache.Add(pod)
				}
			} else {
				reqBody = []byte(tt.payload.(string))
			}

			req := httptest.NewRequest("POST", "/kill", bytes.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}
		})
	}
}

func TestHandlePostHighscore(t *testing.T) {
	tests := []struct {
		name         string
		payload      interface{}
		expectedCode int
	}{
		{
			name: "valid highscore",
			payload: game.Highscore{
				GameStarted:    1640995200, // 2022-01-01 00:00:00 UTC
				TimeTaken:      60000,      // 60 seconds
				LevelsFinished: 5,
				Score:          1000,
				Name:           "TestPlayer",
			},
			expectedCode: 200,
		},
		{
			name:         "invalid payload",
			payload:      "invalid json",
			expectedCode: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			var reqBody []byte
			var err error

			if hs, ok := tt.payload.(game.Highscore); ok {
				reqBody, err = json.Marshal(hs)
				if err != nil {
					t.Fatalf("Failed to marshal highscore: %v", err)
				}
			} else {
				reqBody = []byte(tt.payload.(string))
			}

			req := httptest.NewRequest("POST", "/highscore", bytes.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}

			// If successful, verify the highscore was added
			if tt.expectedCode == 200 {
				scores := server.highscoreCache.Get()
				if len(scores) == 0 {
					t.Error("Expected highscore to be added to cache")
				}
			}
		})
	}
}

func TestHandleGetHighscores(t *testing.T) {
	tests := []struct {
		name          string
		addHighscores []game.Highscore
		expectedCode  int
		expectedCount int
	}{
		{
			name:          "no highscores",
			addHighscores: nil,
			expectedCode:  404,
			expectedCount: 0,
		},
		{
			name: "with highscores",
			addHighscores: []game.Highscore{
				{
					GameStarted:    1640995200,
					TimeTaken:      60000,
					LevelsFinished: 5,
					Score:          1000,
					Name:           "Player1",
				},
				{
					GameStarted:    1640995300,
					TimeTaken:      45000,
					LevelsFinished: 7,
					Score:          1500,
					Name:           "Player2",
				},
			},
			expectedCode:  200,
			expectedCount: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			// Add test highscores
			for _, hs := range tt.addHighscores {
				server.highscoreCache.Add(hs)
			}

			req := httptest.NewRequest("GET", "/highscores", nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}

			if tt.expectedCode == 200 {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					t.Fatalf("Failed to read response body: %v", err)
				}

				var scores []game.Highscore
				if err := json.Unmarshal(body, &scores); err != nil {
					t.Fatalf("Failed to unmarshal response: %v", err)
				}

				if len(scores) != tt.expectedCount {
					t.Errorf("Expected %d highscores, got %d", tt.expectedCount, len(scores))
				}
			}
		})
	}
}

func TestHandlePostNamespaces(t *testing.T) {
	tests := []struct {
		name         string
		payload      interface{}
		expectedCode int
	}{
		{
			name: "valid namespaces",
			payload: game.Namespaces{
				Namespaces: []string{"default", "kube-system", "test"},
			},
			expectedCode: 200,
		},
		{
			name: "empty namespaces",
			payload: game.Namespaces{
				Namespaces: []string{},
			},
			expectedCode: 400,
		},
		{
			name:         "invalid payload",
			payload:      "invalid json",
			expectedCode: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			var reqBody []byte
			var err error

			if ns, ok := tt.payload.(game.Namespaces); ok {
				reqBody, err = json.Marshal(ns)
				if err != nil {
					t.Fatalf("Failed to marshal namespaces: %v", err)
				}
			} else {
				reqBody = []byte(tt.payload.(string))
			}

			req := httptest.NewRequest("POST", "/namespaces", bytes.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}

			// If successful, verify namespaces were updated
			if tt.expectedCode == 200 {
				expectedNs := tt.payload.(game.Namespaces)
				if len(server.namespaces.Namespaces) != len(expectedNs.Namespaces) {
					t.Errorf("Expected %d namespaces, got %d", len(expectedNs.Namespaces), len(server.namespaces.Namespaces))
				}
			}
		})
	}
}

func TestHandleMonitor(t *testing.T) {
	tests := []struct {
		name         string
		payload      interface{}
		expectedCode int
	}{
		{
			name: "valid HTTP URL",
			payload: map[string]string{
				"url": "http://example.com",
			},
			expectedCode: 200,
		},
		{
			name: "valid HTTPS URL",
			payload: map[string]string{
				"url": "https://example.com",
			},
			expectedCode: 200,
		},
		{
			name: "valid URL with path",
			payload: map[string]string{
				"url": "https://example.com/api/health",
			},
			expectedCode: 200,
		},
		{
			name: "empty URL",
			payload: map[string]string{
				"url": "",
			},
			expectedCode: 400,
		},
		{
			name: "URL without scheme",
			payload: map[string]string{
				"url": "example.com",
			},
			expectedCode: 400,
		},
		{
			name: "URL without host",
			payload: map[string]string{
				"url": "http://",
			},
			expectedCode: 400,
		},
		{
			name: "invalid scheme",
			payload: map[string]string{
				"url": "ftp://example.com",
			},
			expectedCode: 400,
		},
		{
			name: "relative URL",
			payload: map[string]string{
				"url": "/api/health",
			},
			expectedCode: 400,
		},
		{
			name: "invalid URL format",
			payload: map[string]string{
				"url": "not-a-valid-url",
			},
			expectedCode: 400,
		},
		{
			name:         "invalid payload",
			payload:      "invalid json",
			expectedCode: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			var reqBody []byte
			var err error

			if payload, ok := tt.payload.(map[string]string); ok {
				reqBody, err = json.Marshal(payload)
				if err != nil {
					t.Fatalf("Failed to marshal payload: %v", err)
				}
			} else {
				reqBody = []byte(tt.payload.(string))
			}

			req := httptest.NewRequest("POST", "/monitor", bytes.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}
		})
	}
}

func TestHandleMonitorStop(t *testing.T) {
	tests := []struct {
		name         string
		payload      interface{}
		expectedCode int
		setupMonitor bool
	}{
		{
			name: "stop existing monitor",
			payload: map[string]string{
				"id": "test-monitor-id",
			},
			expectedCode: 404, // Will be 404 since we're not actually starting a monitor
			setupMonitor: false,
		},
		{
			name: "empty ID",
			payload: map[string]string{
				"id": "",
			},
			expectedCode: 400,
			setupMonitor: false,
		},
		{
			name:         "invalid payload",
			payload:      "invalid json",
			expectedCode: 400,
			setupMonitor: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			var reqBody []byte
			var err error

			if payload, ok := tt.payload.(map[string]string); ok {
				reqBody, err = json.Marshal(payload)
				if err != nil {
					t.Fatalf("Failed to marshal payload: %v", err)
				}
			} else {
				reqBody = []byte(tt.payload.(string))
			}

			req := httptest.NewRequest("POST", "/monitor/stop", bytes.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}
		})
	}
}

func TestHandleMonitorStatus(t *testing.T) {
	tests := []struct {
		name         string
		queryParam   string
		expectedCode int
	}{
		{
			name:         "missing monitor ID",
			queryParam:   "",
			expectedCode: 400,
		},
		{
			name:         "non-existent monitor",
			queryParam:   "?id=non-existent",
			expectedCode: 404,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(false)
			app := createTestApp(server, "") // No templates needed

			req := httptest.NewRequest("GET", "/monitor/status"+tt.queryParam, nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}
		})
	}
}

func TestHandleHealthz(t *testing.T) {
	server := createTestServer(false)
	app := createTestApp(server, "") // No templates needed

	req := httptest.NewRequest("GET", "/healthz", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
}

func TestHandleReadyz(t *testing.T) {
	tests := []struct {
		name           string
		enableKube     bool
		nilCache       bool
		expectedCode   int
		expectedSubstr string
	}{
		{
			name:         "ready - kube disabled",
			enableKube:   false,
			nilCache:     false,
			expectedCode: 200,
		},
		{
			name:           "not ready - kube enabled but client nil",
			enableKube:     true,
			nilCache:       false,
			expectedCode:   503,
			expectedSubstr: "Kubernetes client is not available",
		},
		{
			name:           "not ready - cache nil",
			enableKube:     false,
			nilCache:       true,
			expectedCode:   503,
			expectedSubstr: "Highscore cache is not initialized",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := createTestServer(tt.enableKube)
			if tt.nilCache {
				server.highscoreCache = nil
			}
			app := createTestApp(server, "") // No templates needed

			req := httptest.NewRequest("GET", "/readyz", nil)
			resp, err := app.Test(req)
			if err != nil {
				t.Fatalf("Failed to make request: %v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != tt.expectedCode {
				body, _ := io.ReadAll(resp.Body)
				t.Errorf("Expected status %d, got %d. Response: %s", tt.expectedCode, resp.StatusCode, string(body))
			}

			if tt.expectedSubstr != "" {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					t.Fatalf("Failed to read response body: %v", err)
				}

				bodyStr := string(body)
				if len(bodyStr) > 0 {
					var response map[string]interface{}
					if err := json.Unmarshal(body, &response); err == nil {
						if errorMsg, ok := response["error"].(string); ok {
							if errorMsg != tt.expectedSubstr {
								t.Errorf("Expected error message '%s', got '%s'", tt.expectedSubstr, errorMsg)
							}
						}
					}
				}
			}
		})
	}
}

func TestHandleGetNamesIntegration(t *testing.T) {
	// Integration test that validates the structure of returned pods
	server := createTestServer(false)
	app := createTestApp(server, "") // No templates needed

	req := httptest.NewRequest("GET", "/names?count=3", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("Failed to make request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Fatalf("Expected status 200, got %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}

	var pods []game.Pod
	if err := json.Unmarshal(body, &pods); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(pods) != 3 {
		t.Errorf("Expected 3 pods, got %d", len(pods))
	}

	// Validate pod structure
	for i, pod := range pods {
		if pod.Name == "" {
			t.Errorf("Pod %d has empty name", i)
		}
		if pod.Namespace == "" {
			t.Errorf("Pod %d has empty namespace", i)
		}
	}
}
