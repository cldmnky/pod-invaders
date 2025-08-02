package main

import (
	"log"

	"github.com/cldmnky/pod-invaders/internal/api"
	"github.com/cldmnky/pod-invaders/internal/config"
)

// main is the entry point of the application.
func main() {

	// Initialize configuration from command-line flags and environment variables.
	cfg := config.New()

	// Create and run the server.
	if err := api.Run(cfg); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
