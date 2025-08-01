package main

import (
	"context"
	"crypto/rand"
	"crypto/tls"
	"flag"
	"fmt"
	"io/fs"
	"log"
	mathrand "math/rand"
	"mime"
	"net/http"
	"net/url"
	"path"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/google/uuid"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// Names for the pods
var fakePodNames = []string{
	// a list of latin names for pods
	"lucius", "marcus", "tiberius", "gaius", "octavius", "julius", "claudius", "nero",
	"augustus", "constantine", "hadrian", "traianus", "vulcanus", "mercurius", "neptunus", "pluto",
}

// Names for namespaces
var fakeNamespaceNames = []string{
	// A list of animal-themed namespaces
	"tiger", "lion", "elephant", "giraffe", "zebra", "panda", "koala", "kangaroo",
	"penguin", "dolphin", "whale", "shark", "octopus", "crab", "lobster", "jellyfish",
	"seahorse", "starfish", "seal", "walrus", "narwhal", "orca", "stingray", "turtle",
	"flamingo", "peacock", "parrot", "macaw", "cockatoo", "canary", "finch", "sparrow", "hummingbird",
	"owl", "eagle", "hawk", "falcon", "vulture",
	"raven", "crow", "magpie", "bluejay", "cardinal",
	"woodpecker", "hummingbird", "swallow", "sparrowhawk",
	"kingfisher", "heron", "egret",
}

// Pod represents a Kubernetes pod with its name and namespace
// It is used for the JSON body of the /kill endpoint and for generating fake pods
type Pod struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	IsRealPod bool   `json:"isRealPod,omitempty"` // Indicates if the pod is a real Kubernetes pod
}

type Namespaces struct {
	Namespaces []string `json:"namespaces"`
}

type Monitor struct {
	URL    string             `json:"url"`
	Id     string             `json:"id"`
	Ctx    context.Context    `json:"-"`
	Cancel context.CancelFunc `json:"-"`
}

type MonitorStatus struct {
	URL    string `json:"url"`
	Status string `json:"status"` // e.g., "up", "down"
	Id     string `json:"id"`
}

// Mutex to protect monitor status updates
var monitorStatusMutex sync.Mutex
var MonitorStatusesMutex sync.Mutex // Mutex to protect the global MonitorStatuses slice

var MonitorStatuses []MonitorStatus // Global slice to hold monitor statuses

// getMonitorStatus retrieves the status of a monitor by its ID
func getMonitorStatus(id string, monitorStatuses []MonitorStatus) (*MonitorStatus, error) {
	MonitorStatusesMutex.Lock()
	defer MonitorStatusesMutex.Unlock()
	// Find the monitor status by ID
	for _, status := range monitorStatuses {
		if status.Id == id {
			return &status, nil
		}
	}
	return nil, fmt.Errorf("monitor status not found")
}

func (m *Monitor) String() string {
	return fmt.Sprintf("Monitor URL: %s", m.URL)
}

// Start starts a background monitoring service
func (m *Monitor) Start(ctx context.Context) (string, error) {
	// Create a cancellable context
	m.Ctx, m.Cancel = context.WithCancel(ctx)
	// Create a monitor status struct to track the status
	id := uuid.New().String()
	status := &MonitorStatus{
		URL:    m.URL,
		Status: "unknown",
		Id:     id,
	}
	if m.URL == "" {
		log.Println("Monitor URL is empty, skipping monitoring service")
		return "", fmt.Errorf("monitor URL cannot be empty")
	}
	m.Id = id
	// Add the monitor status to the global slice
	MonitorStatusesMutex.Lock()
	MonitorStatuses = append(MonitorStatuses, *status)
	MonitorStatusesMutex.Unlock()
	log.Printf("Starting monitoring service for URL: %s", m.URL)
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-m.Ctx.Done():
				log.Printf("Monitoring service for URL %s stopped", m.URL)
				return
			case <-ticker.C:
				// Ignore any TLS errors
				http.DefaultTransport.(*http.Transport).TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
				// Set timeout for the HTTP request
				client := http.Client{
					Timeout: 5 * time.Second,
				}
				// Perform a GET request to the URL
				resp, err := client.Get(m.URL)
				MonitorStatusesMutex.Lock()
				if err != nil {
					log.Printf("Error monitoring URL %s: %v", m.URL, err)
					status.Status = "down"
					// Update the global MonitorStatuses slice
					for i := range MonitorStatuses {
						if MonitorStatuses[i].Id == status.Id {
							MonitorStatuses[i].Status = status.Status
							break
						}
					}
					MonitorStatusesMutex.Unlock()
					continue // Ignore errors, just log them
				}
				resp.Body.Close() // Close the response body
				// If response i >= 200 and < 500, consider it "up"
				if resp.StatusCode >= 200 && resp.StatusCode < 500 {
					status.Status = "up"
				} else {
					status.Status = "down"
				}
				// Update the global MonitorStatuses slice
				for i := range MonitorStatuses {
					if MonitorStatuses[i].Id == status.Id {
						MonitorStatuses[i].Status = status.Status
						break
					}
				}
				MonitorStatusesMutex.Unlock()
			}
		}
	}()
	return m.Id, nil
}

// Stop stops the monitoring service for a specific URL
func (m *Monitor) Stop() {
	log.Printf("Stopping monitoring service for URL: %s", m.URL)
	// Only lock MonitorStatusesMutex if modifying MonitorStatuses
	if m.Cancel != nil {
		m.Cancel()
	}
	log.Printf("Monitoring service for URL %s stopped", m.URL)
}

type KillPodCache struct {
	Pods []Pod `json:"pods"`
}

var killPodCache KillPodCache    // Cache to track killed pods
var killPodCacheMutex sync.Mutex // Mutex for cache

type Highscore struct {
	GameStarted    int64  `json:"gameStarted"`
	TimeTaken      int64  `json:"timeTaken"`
	LevelsFinished int    `json:"levelsFinished"`
	Score          int    `json:"score"`
	Name           string `json:"name"` // Player's name
}

type HighscoreCache struct {
	Highscores []Highscore `json:"highscores"`
}

// New HighscoreCache initializes a new HighscoreCache
func NewHighscoreCache() *HighscoreCache {
	return &HighscoreCache{
		Highscores: make([]Highscore, 0),
	}
}

func (c *HighscoreCache) AddHighscore(hs Highscore) {
	// This function can be extended to add highscores to a persistent store
	// For now, we just log the highscore
	log.Printf("Highscore added: %+v", hs)
	c.Highscores = append(c.Highscores, hs)
}

// randomChoice selects a random element from the list
func randomChoice(list []string) string {
	if len(list) == 0 {
		return ""
	}
	b := make([]byte, 1)
	_, err := rand.Read(b)
	if err != nil {
		return list[0]
	}
	return list[int(b[0])%len(list)]
}

// generateFakePod creates a unique-ish name for a pod
func generateFakePod() Pod {
	podName := randomChoice(fakePodNames)
	namespaceName := randomChoice(fakeNamespaceNames)
	return Pod{
		Name:      podName,
		Namespace: namespaceName,
		IsRealPod: false, // Mark as fake pod
	}
}

func getPods(client kubernetes.Interface, count int, namespaces ...string) ([]Pod, error) {
	pods := make([]Pod, 0, count)
	// shuffle the namespaces to randomize the order
	if len(namespaces) == 0 {
		namespaces = append(namespaces, "default") // Default namespace if none provided
	}
	// Shuffle namespaces to randomize the order
	for i := len(namespaces) - 1; i > 0; i-- {
		b := make([]byte, 1)
		_, err := rand.Read(b)
		if err != nil {
			continue // Fallback to default behavior if randomization fails
		}
		j := int(b[0]) % (i + 1)
		namespaces[i], namespaces[j] = namespaces[j], namespaces[i]
	}
	for _, ns := range namespaces {
		if ns == "" {
			continue // Skip empty namespaces
		}
		log.Printf("Getting pods in namespace: %s", ns)
		// Check if the namespace exists
		_, err := client.CoreV1().Namespaces().Get(context.TODO(), ns, metav1.GetOptions{})
		if err != nil {
			log.Printf("Namespace %s does not exist, skipping", ns)
			continue // Ignore errors for non-existing namespaces
		}
		// List running pods in the specified namespace
		podList, err := client.CoreV1().Pods(ns).List(context.TODO(), metav1.ListOptions{
			// Only include pods that are running
			FieldSelector: "status.phase=Running",
		})
		if err != nil {
			log.Printf("Failed to list pods in namespace %s: %v", ns, err)
			continue // Skip this namespace if listing fails
		}
		// Convert to Pod struct and append to the list
		for _, pod := range podList.Items {
			// Only include pods that are running
			if pod.Status.Phase != "Running" || pod.DeletionTimestamp != nil {
				log.Printf("Skipping pod %s/%s, not in Running phase", pod.Namespace, pod.Name)
				continue // Skip pods that are not running
			}
			pods = append(pods, Pod{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				IsRealPod: true, // Mark as real pod
			})
		}
	}
	// If we have enough pods, return them randomized
	if len(pods) >= count {
		mathrand.Shuffle(len(pods), func(i, j int) {
			pods[i], pods[j] = pods[j], pods[i]
		})
		return pods[:count], nil
	}
	// If we don't have enough pods, generate fake pods to fill the count
	log.Printf("Found %d real pods, generating fake pods to reach count %d", len(pods), count)
	// Generate fake pods to fill the remaining count
	for len(pods) < count {
		fakePod := generateFakePod()
		// append the fake pod to the list
		pods = append(pods, fakePod)
	}
	// Shuffle the final list of pods to randomize the order
	mathrand.Shuffle(len(pods), func(i, j int) {
		pods[i], pods[j] = pods[j], pods[i]
	})
	return pods, nil
}

func killPod(client kubernetes.Interface, pod Pod) error {
	if !pod.IsRealPod {
		log.Printf("Cannot kill fake pod: %s/%s", pod.Namespace, pod.Name)
		return fmt.Errorf("cannot kill fake pod: %s/%s", pod.Namespace, pod.Name)
	}
	err := client.CoreV1().Pods(pod.Namespace).Delete(context.TODO(), pod.Name, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete pod %s/%s: %v", pod.Namespace, pod.Name, err)
	}
	return nil
}

func getKubeClient(kubeconfigPath string) (kubernetes.Interface, error) {
	var kubeconfig *rest.Config

	if kubeconfigPath != "" {
		config, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
		if err != nil {
			return nil, fmt.Errorf("unable to load kubeconfig from %s: %v", kubeconfigPath, err)
		}
		kubeconfig = config
	} else {
		config, err := rest.InClusterConfig()
		if err != nil {
			return nil, fmt.Errorf("unable to load in-cluster config: %v", err)
		}
		kubeconfig = config
	}

	client, err := kubernetes.NewForConfig(kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("unable to create a client: %v", err)
	}

	return client, nil
}

// Helper to check if a pod is already in the cache
func isPodKilled(pod Pod) bool {
	killPodCacheMutex.Lock()
	defer killPodCacheMutex.Unlock()
	for _, killed := range killPodCache.Pods {
		if killed.Name == pod.Name && killed.Namespace == pod.Namespace {
			return true
		}
	}
	return false
}

// Helper to add a pod to the cache
func addPodToCache(pod Pod) {
	killPodCacheMutex.Lock()
	defer killPodCacheMutex.Unlock()
	killPodCache.Pods = append(killPodCache.Pods, pod)
}

func main() {
	var kubeconfig string
	var enableKube bool
	var namespaceNames []string
	var highscoreCache = NewHighscoreCache()
	var namespaces Namespaces
	var monitors []Monitor

	rootCmd := &cobra.Command{
		Use:   "pod-invaders-app",
		Short: "Pod Invaders Game Server",
		Run: func(cmd *cobra.Command, args []string) {
			var kc kubernetes.Interface
			var err error

			// Use embedded views
			viewsFS, _ := fs.Sub(EmbeddedFiles, "views")
			engine := html.NewFileSystem(http.FS(viewsFS), ".html")

			if !enableKube {
				log.Println("Kubernetes client is disabled, running in standalone mode")
				// Start the server without Kubernetes client
			} else {
				log.Println("Kubernetes client is enabled, attempting to connect")
				kc, err = getKubeClient(kubeconfig)
				if err != nil {
					log.Fatalf("Failed to get kube client: %v", err)
				}
			}

			app := fiber.New(fiber.Config{
				Views: engine,
			})

			// Add request logging middleware
			app.Use(func(c *fiber.Ctx) error {
				log.Printf("%s %s", c.Method(), c.OriginalURL())
				return c.Next()
			})

			// --- API Endpoints ---

			// Health and readiness endpoints for Kubernetes probes
			app.Get("/healthz", func(c *fiber.Ctx) error {
				return c.SendStatus(fiber.StatusOK)
			})
			app.Get("/readyz", func(c *fiber.Ctx) error {
				// Optionally, add readiness logic here
				return c.SendStatus(fiber.StatusOK)
			})

			// 1. Root endpoint to serve the game template
			app.Get("/", func(c *fiber.Ctx) error {
				// Render the index.html template
				return c.Render("index", fiber.Map{
					"Title": "Pod Invaders",
				})
			})

			// 2. API to get a list of pod names and namespaces
			app.Get("/names", func(c *fiber.Ctx) error {
				// Get the 'count' query parameter
				count := min(
					// Default to 10 if not provided
					c.QueryInt("count", 10),
					// Add a reasonable limit
					100)

				// If Kubernetes client is not enabled, generate fake pod names
				if !enableKube {
					pods := make([]Pod, count)
					for i := range count {
						pods[i] = generateFakePod()
					}
					return c.JSON(pods)
				} else {
					if len(namespaces.Namespaces) == 0 {
						log.Println("No namespaces provided, using namespaces from command line flags")
						namespaces.Namespaces = namespaceNames
					}
					pods, err := getPods(kc, count, namespaces.Namespaces...)
					if err != nil {
						log.Printf("Error getting pods: %v", err)
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": "Failed to retrieve pods",
						})
					}
					// Return the list of pods as JSON
					log.Printf("Returning %d pods", len(pods))
					return c.JSON(pods)
				}

			})

			// 3. API to log a killed pod
			app.Post("/kill", func(c *fiber.Ctx) error {
				payload := new(Pod)

				if err := c.BodyParser(payload); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "cannot parse JSON",
					})
				}

				// Check if pod is already killed
				if isPodKilled(*payload) {
					log.Printf("Pod %s/%s already killed, skipping", payload.Namespace, payload.Name)
					return c.Status(fiber.StatusOK).JSON(fiber.Map{
						"status":  "skipped",
						"message": fmt.Sprintf("Pod %s/%s already killed", payload.Namespace, payload.Name),
					})
				}

				// For demonstration, we just log the name to the console.
				// In a real app, you might update a database or metrics.
				if enableKube {
					if err := killPod(kc, *payload); err != nil {
						log.Printf("Error killing pod: %v", err)
						return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
							"error": fmt.Sprintf("Failed to kill pod: %v", err),
						})
					}
				} else {
					log.Printf("Simulated kill for pod: %s/%s (not a real Kubernetes pod)", payload.Namespace, payload.Name)
				}
				// Add the pod to the cache
				log.Printf("Logging kill for pod: %s/%s", payload.Namespace, payload.Name)
				// Add the pod to the cache

				addPodToCache(*payload)

				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":  "success",
					"message": fmt.Sprintf("Logged kill for pod: %s/%s", payload.Namespace, payload.Name),
				})
			})

			// 4. API to log highscore
			app.Post("/highscore", func(c *fiber.Ctx) error {
				var hs Highscore
				if err := c.BodyParser(&hs); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "cannot parse JSON",
					})
				}
				log.Printf("Highscore submitted: started=%d, timeTaken=%dms, levelsFinished=%d, score=%d", hs.GameStarted, hs.TimeTaken, hs.LevelsFinished, hs.Score)
				// Add the highscore to the cache
				highscoreCache.AddHighscore(hs)
				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":  "success",
					"message": "Highscore logged",
				})
			})

			// 5. API to GET highscores
			app.Get("/highscores", func(c *fiber.Ctx) error {
				// Return the highscores as JSON
				if len(highscoreCache.Highscores) == 0 {
					return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
						"error": "No highscores found",
					})
				}
				return c.JSON(highscoreCache.Highscores)
			})

			// 6. API to recieve a POST of namespaces
			// {"namespaces":["foo"]}
			app.Post("/namespaces", func(c *fiber.Ctx) error {

				if err := c.BodyParser(&namespaces); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "cannot parse JSON",
					})
				}
				if len(namespaces.Namespaces) == 0 {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "no namespaces provided",
					})
				}
				// Update the namespace names
				namespaceNames = namespaces.Namespaces
				log.Printf("Updated namespaces: %v", namespaceNames)
				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":  "success",
					"message": fmt.Sprintf("Updated namespaces to: %v", namespaceNames),
				})
			})

			// 7. Monitor endpoint
			app.Post("/monitor", func(c *fiber.Ctx) error {
				var monitor Monitor
				if err := c.BodyParser(&monitor); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "cannot parse JSON",
					})
				}
				if monitor.URL == "" {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "monitor URL cannot be empty",
					})
				}
				// Log the monitor URL
				log.Printf("Monitor URL set to: %s", monitor.URL)
				if _, err := url.Parse(monitor.URL); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "invalid monitor URL format",
					})
				}
				// Here you would typically set up a monitoring service or store the URL
				ctx := context.Background()
				monitor.Start(ctx)
				// Add the monitor to the list
				monitors = append(monitors, monitor)
				log.Printf("Monitoring service started for URL: %s", monitor.URL)
				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":  "success",
					"message": fmt.Sprintf("Monitor URL set to: %s", monitor.URL),
					"id":      monitor.Id,
				})
			})

			// Stop monitoring service for a specific URL
			app.Post("/monitor/stop", func(c *fiber.Ctx) error {
				var monitor Monitor
				if err := c.BodyParser(&monitor); err != nil {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "cannot parse JSON",
					})
				}
				if monitor.Id == "" {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "monitor ID is required",
					})
				}
				// Find the monitor with the given ID
				var foundMonitor *Monitor
				for i, m := range monitors {
					if m.Id == monitor.Id {
						foundMonitor = &monitors[i]
						break
					}
				}
				if foundMonitor == nil {
					return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
						"error": "monitor not found",
					})
				}
				// Stop the monitoring service
				monitorStatusMutex.Lock()
				foundMonitor.Stop()
				// Remove the monitor from the list
				for i, m := range monitors {
					if m.Id == foundMonitor.Id {
						monitors = append(monitors[:i], monitors[i+1:]...)
						break
					}
				}
				// Remove the monitor status from the global slice
				for i, status := range MonitorStatuses {
					if status.Id == foundMonitor.Id {
						MonitorStatuses = append(MonitorStatuses[:i], MonitorStatuses[i+1:]...)
						break
					}
				}
				monitorStatusMutex.Unlock()
				return c.Status(fiber.StatusOK).JSON(fiber.Map{
					"status":  "success",
					"message": fmt.Sprintf("Monitoring service for URL %s stopped", foundMonitor.URL),
				})
			})

			// 8. Monitor status endpoint, requires a ?id=<monitor_id> query parameter
			app.Get("/monitor/status", func(c *fiber.Ctx) error {
				monitorId := c.Query("id")
				if monitorId == "" {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "monitor ID is required",
					})
				}
				// Find the monitor with the given ID
				var foundMonitor *Monitor
				for _, m := range monitors {
					if m.Id == monitorId {
						foundMonitor = &m
						break
					}
				}
				if foundMonitor == nil {
					return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
						"error": "monitor not found",
					})
				}
				// Get the status of the monitor (locking is handled inside getMonitorStatus)
				status, err := getMonitorStatus(monitorId, MonitorStatuses)
				if err != nil {
					return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
						"error": fmt.Sprintf("monitor status not found: %v", err),
					})
				}
				// Return the status as JSON
				return c.JSON(status)
			})

			// Serve static files from the embedded assets directory
			app.Get("/assets/*", func(c *fiber.Ctx) error {
				assetPath := strings.TrimPrefix(c.Path(), "/assets/")
				file, err := EmbeddedFiles.Open(path.Join("assets", assetPath))
				if err != nil {
					return c.SendStatus(fiber.StatusNotFound)
				}
				defer file.Close()
				stat, _ := file.Stat()
				c.Response().Header.Set("Content-Type", mime.TypeByExtension(path.Ext(assetPath)))
				c.Response().Header.Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
				return c.SendStream(file)
			})

			// Serve *.js files from the views directory
			app.Get("/:filename.js", func(c *fiber.Ctx) error {
				filename := c.Params("filename") + ".js"
				file, err := EmbeddedFiles.Open(path.Join("views", filename))
				if err != nil {
					return c.SendStatus(fiber.StatusNotFound)
				}
				defer file.Close()
				stat, _ := file.Stat()
				c.Response().Header.Set("Content-Type", "application/javascript")
				c.Response().Header.Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
				return c.SendStream(file)
			})
			log.Println("Starting server on http://localhost:3000")
			log.Fatal(app.Listen(":3000"))
		},
	}

	// Use pflag for compatibility with cobra
	pflag.StringVar(&kubeconfig, "kubeconfig", filepath.Join(homedir.HomeDir(), ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	pflag.BoolVar(&enableKube, "enable-kube", true, "Enable Kubernetes client (default: true)")
	pflag.StringArrayVar(&namespaceNames, "namespaces", []string{"default"}, "List of namespaces to query pods from (default: kube-system)")
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	rootCmd.Flags().AddFlagSet(pflag.CommandLine)

	if err := rootCmd.Execute(); err != nil {
		log.Fatalf("Error: %v", err)
	}
}
