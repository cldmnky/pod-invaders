package game

import (
	"log"
	"sync"
)

// KillPodCache tracks pods that have been "killed".
type KillPodCache struct {
	mu   sync.Mutex
	pods map[string]struct{} // Using a map for efficient lookups
}

// NewKillPodCache creates a new cache for killed pods.
func NewKillPodCache() *KillPodCache {
	return &KillPodCache{
		pods: make(map[string]struct{}),
	}
}

// Add records a pod as killed.
func (c *KillPodCache) Add(p Pod) {
	c.mu.Lock()
	defer c.mu.Unlock()
	key := p.Namespace + "/" + p.Name
	c.pods[key] = struct{}{}
}

// IsKilled checks if a pod has been recorded as killed.
func (c *KillPodCache) IsKilled(p Pod) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	key := p.Namespace + "/" + p.Name
	_, found := c.pods[key]
	return found
}

// HighscoreCache stores highscore data.
type HighscoreCache struct {
	mu         sync.Mutex
	highscores []Highscore
}

// NewHighscoreCache creates a new cache for highscores.
func NewHighscoreCache() *HighscoreCache {
	return &HighscoreCache{
		highscores: make([]Highscore, 0),
	}
}

// Add appends a new highscore to the cache.
func (c *HighscoreCache) Add(hs Highscore) {
	c.mu.Lock()
	defer c.mu.Unlock()
	log.Printf("Highscore added: %+v", hs)
	c.highscores = append(c.highscores, hs)
}

// Get returns all the highscores.
func (c *HighscoreCache) Get() []Highscore {
	c.mu.Lock()
	defer c.mu.Unlock()
	// Return a copy to prevent race conditions on the slice
	scoresCopy := make([]Highscore, len(c.highscores))
	copy(scoresCopy, c.highscores)
	return scoresCopy
}
