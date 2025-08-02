package api

import (
	"context"
	"fmt"
	"log"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"k8s.io/client-go/kubernetes"

	"github.com/cldmnky/pod-invaders/internal/game"
	"github.com/cldmnky/pod-invaders/internal/k8s"
	"github.com/cldmnky/pod-invaders/internal/monitor"
)

// registerGameHandlers registers the game-related endpoints.
func (s *Server) registerGameHandlers(app *fiber.App) {
	app.Get("/", s.handleRoot)
	app.Get("/names", s.handleGetNames)
	app.Post("/kill", s.handleKill)
	app.Post("/highscore", s.handlePostHighscore)
	app.Get("/highscores", s.handleGetHighscores)
	app.Post("/namespaces", s.handlePostNamespaces)
	app.Get("/healthz", s.handleHealthz)
	app.Get("/readyz", s.handleReadyz)
}

// registerMonitorHandlers registers the monitoring-related endpoints.
func (s *Server) registerMonitorHandlers(app *fiber.App) {
	app.Post("/monitor", s.handleMonitor)
	app.Post("/monitor/stop", s.handleMonitorStop)
	app.Get("/monitor/status", s.handleMonitorStatus)
}

// handleRoot serves the main game page.
func (s *Server) handleRoot(c *fiber.Ctx) error {
	return c.Render("index", fiber.Map{
		"Title": "Pod Invaders",
	})
}

// handleGetNames provides a list of pods, either real or fake.
func (s *Server) handleGetNames(c *fiber.Ctx) error {
	count := c.QueryInt("count", 10)
	if count > 100 {
		count = 100
	}

	if !s.config.EnableKube {
		pods := make([]game.Pod, count)
		for i := 0; i < count; i++ {
			pods[i] = game.GenerateFakePod()
		}
		return c.JSON(pods)
	}

	if s.config.EnableOpenShiftAuth {
		// Use the authenticated kube client from the context
		client, ok := c.Locals("kubeClient").(kubernetes.Interface)
		if !ok {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Kubernetes client not found"})
		}
		s.kubeClient = client
	}

	pods, err := k8s.GetPods(s.kubeClient, count, s.namespaces.Namespaces...)
	if err != nil {
		log.Printf("Error getting pods: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to retrieve pods"})
	}

	log.Printf("Returning %d pods", len(pods))
	return c.JSON(pods)
}

// handleKill handles the request to kill a pod.
func (s *Server) handleKill(c *fiber.Ctx) error {
	var payload game.Pod
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse JSON"})
	}

	if s.killCache.IsKilled(payload) {
		msg := fmt.Sprintf("Pod %s/%s already killed", payload.Namespace, payload.Name)
		log.Println(msg)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "skipped", "message": msg})
	}

	if s.config.EnableKube {
		if s.config.EnableOpenShiftAuth {
			// Use the authenticated kube client from the context
			client, ok := c.Locals("kubeClient").(kubernetes.Interface)
			if !ok {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Kubernetes client not found"})
			}
			s.kubeClient = client
		}
		if err := k8s.KillPod(s.kubeClient, payload); err != nil {
			log.Printf("Error killing pod: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Failed to kill pod: %v", err)})
		}
	} else {
		log.Printf("Simulated kill for pod: %s/%s (not a real Kubernetes pod)", payload.Namespace, payload.Name)
	}

	s.killCache.Add(payload)
	log.Printf("Logging kill for pod: %s/%s", payload.Namespace, payload.Name)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Logged kill for pod: %s/%s", payload.Namespace, payload.Name),
	})
}

// handlePostHighscore saves a new highscore.
func (s *Server) handlePostHighscore(c *fiber.Ctx) error {
	var hs game.Highscore
	if err := c.BodyParser(&hs); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse JSON"})
	}
	s.highscoreCache.Add(hs)
	log.Printf("Highscore submitted: %+v", hs)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "success", "message": "Highscore logged"})
}

// handleGetHighscores returns all saved highscores.
func (s *Server) handleGetHighscores(c *fiber.Ctx) error {
	scores := s.highscoreCache.Get()
	if len(scores) == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "No highscores found"})
	}
	return c.JSON(scores)
}

// handlePostNamespaces updates the list of namespaces to query for pods.
func (s *Server) handlePostNamespaces(c *fiber.Ctx) error {
	if err := c.BodyParser(&s.namespaces); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse JSON"})
	}
	if len(s.namespaces.Namespaces) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no namespaces provided"})
	}
	log.Printf("Updated namespaces: %v", s.namespaces.Namespaces)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Updated namespaces to: %v", s.namespaces.Namespaces),
	})
}

// handleMonitor starts a new URL monitor.
func (s *Server) handleMonitor(c *fiber.Ctx) error {
	var m monitor.Monitor
	if err := c.BodyParser(&m); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse JSON"})
	}
	if m.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "monitor URL cannot be empty"})
	}

	// Validate URL format more strictly
	parsedURL, err := url.Parse(m.URL)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid monitor URL format"})
	}

	// Ensure URL has a valid scheme and host
	if parsedURL.Scheme == "" || parsedURL.Host == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid monitor URL format"})
	}

	// Only allow http and https schemes
	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid monitor URL format"})
	}

	id, err := s.monitorManager.Start(context.Background(), m.URL)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	log.Printf("Monitoring service started for URL: %s with ID: %s", m.URL, id)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Monitor started for URL: %s", m.URL),
		"id":      id,
	})
}

// handleMonitorStop stops a running URL monitor.
func (s *Server) handleMonitorStop(c *fiber.Ctx) error {
	var req struct {
		ID string `json:"id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse JSON"})
	}
	if req.ID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "monitor ID is required"})
	}

	if err := s.monitorManager.Stop(req.ID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":  "success",
		"message": fmt.Sprintf("Monitoring service for ID %s stopped", req.ID),
	})
}

// handleMonitorStatus returns the status of a specific monitor.
func (s *Server) handleMonitorStatus(c *fiber.Ctx) error {
	monitorID := c.Query("id")
	if monitorID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "monitor ID is required"})
	}

	status, err := s.monitorManager.GetStatus(monitorID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(status)
}

// Healthz checks if the server is healthy.
func (s *Server) handleHealthz(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusOK)
}

// Readyz checks if the server is ready to serve requests.
func (s *Server) handleReadyz(c *fiber.Ctx) error {
	if s.kubeClient == nil && s.config.EnableKube {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Kubernetes client is not available"})
	}
	if s.highscoreCache == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Highscore cache is not initialized"})
	}
	return c.SendStatus(fiber.StatusOK)
}
