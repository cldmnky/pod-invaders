package api

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// OpenShiftAuthMiddleware extracts the user's access token from the oauth-proxy
func (s *Server) OpenShiftAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Skip authentication for health checks
		if c.Path() == "/healthz" || c.Path() == "/readyz" {
			return c.Next()
		}

		// Extract the access token from the header set by oauth-proxy
		accessToken := c.Get("X-Forwarded-Access-Token")
		if accessToken == "" {
			log.Printf("No access token found in request")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
			})
		}

		// Create a Kubernetes client using the user's token
		config := &rest.Config{
			Host:        s.kubeConfig.Host,
			BearerToken: accessToken,
			TLSClientConfig: rest.TLSClientConfig{
				CAData: s.kubeConfig.CAData,
			},
		}

		clientset, err := kubernetes.NewForConfig(config)
		if err != nil {
			log.Printf("Failed to create Kubernetes client with user token: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authentication token",
			})
		}

		// Store the authenticated client in the context for use by handlers
		c.Locals("kubeClient", clientset)
		c.Locals("userToken", accessToken)

		return c.Next()
	}
}
