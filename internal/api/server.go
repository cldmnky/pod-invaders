package api

import (
	"fmt"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"path"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"k8s.io/client-go/kubernetes"

	"github.com/cldmnky/pod-invaders/internal/assets"
	"github.com/cldmnky/pod-invaders/internal/config"
	"github.com/cldmnky/pod-invaders/internal/game"
	"github.com/cldmnky/pod-invaders/internal/k8s"
	"github.com/cldmnky/pod-invaders/internal/monitor"
)

// Server holds the dependencies for the API server.
type Server struct {
	config         *config.Config
	kubeClient     kubernetes.Interface
	killCache      *game.KillPodCache
	highscoreCache *game.HighscoreCache
	namespaces     game.Namespaces
	monitorManager *monitor.Manager
}

// NewServer creates a new API server instance.
func NewServer(cfg *config.Config) (*Server, error) {
	var kc kubernetes.Interface
	var err error

	if cfg.EnableKube {
		log.Println("Kubernetes client is enabled, attempting to connect.")
		kc, err = k8s.GetKubeClient(cfg.Kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("failed to get kube client: %w", err)
		}
	} else {
		log.Println("Kubernetes client is disabled, running in standalone mode.")
	}

	return &Server{
		config:         cfg,
		kubeClient:     kc,
		killCache:      game.NewKillPodCache(),
		highscoreCache: game.NewHighscoreCache(),
		namespaces:     game.Namespaces{Namespaces: cfg.NamespaceNames},
		monitorManager: monitor.NewManager(),
	}, nil
}

// Run starts the Fiber web server.
func Run(cfg *config.Config) error {
	server, err := NewServer(cfg)
	if err != nil {
		return err
	}

	viewsFS, _ := fs.Sub(assets.EmbeddedFiles, "views")
	engine := html.NewFileSystem(http.FS(viewsFS), ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(requestLogger())

	app.Get("/healthz", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })
	app.Get("/readyz", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusOK) })

	server.registerGameHandlers(app)
	server.registerMonitorHandlers(app)
	registerStaticFileHandlers(app)

	log.Println("Starting server on http://localhost:3000")
	return app.Listen(":3000")
}

// requestLogger is a middleware for logging HTTP requests.
func requestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		log.Printf("%s %s", c.Method(), c.OriginalURL())
		return c.Next()
	}
}

// registerStaticFileHandlers registers handlers for serving static files.
func registerStaticFileHandlers(app *fiber.App) {
	app.Get("/assets/*", func(c *fiber.Ctx) error {
		assetPath := strings.TrimPrefix(c.Path(), "/assets/")
		return serveStaticFile(c, path.Join("assets", assetPath))
	})

	app.Get("/:filename.js", func(c *fiber.Ctx) error {
		filename := c.Params("filename") + ".js"
		return serveStaticFile(c, path.Join("views", filename))
	})
}

// serveStaticFile serves a single static file from the embedded filesystem.
func serveStaticFile(c *fiber.Ctx, filePath string) error {
	file, err := assets.EmbeddedFiles.Open(filePath)
	if err != nil {
		return c.SendStatus(fiber.StatusNotFound)
	}
	defer file.Close()

	stat, _ := file.Stat()
	contentType := mime.TypeByExtension(path.Ext(filePath))
	if contentType == "" {
		// default content type
		contentType = "application/octet-stream"
	}
	if strings.HasSuffix(filePath, ".js") {
		contentType = "application/javascript"
	}

	c.Response().Header.Set("Content-Type", contentType)
	c.Response().Header.Set("Content-Length", fmt.Sprintf("%d", stat.Size()))

	return c.SendStream(file)
}
