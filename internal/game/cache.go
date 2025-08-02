package game

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/dgraph-io/badger/v4"
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

// HighscoreCache defines the interface for managing highscore data.
type HighscoreCache interface {
	Add(hs Highscore)
	Get() []Highscore
}

// InMemoryHighscoreCache stores highscore data in memory.
type InMemoryHighscoreCache struct {
	mu         sync.Mutex
	highscores []Highscore
}

// NewInMemoryHighscoreCache creates a new in-memory cache for highscores.
func NewInMemoryHighscoreCache() HighscoreCache {
	return &InMemoryHighscoreCache{
		highscores: make([]Highscore, 0),
	}
}

// NewHighscoreCache creates a new cache for highscores (defaults to in-memory implementation).
// This function is kept for backward compatibility.
func NewHighscoreCache() HighscoreCache {
	return NewInMemoryHighscoreCache()
}

// Add appends a new highscore to the cache.
func (c *InMemoryHighscoreCache) Add(hs Highscore) {
	c.mu.Lock()
	defer c.mu.Unlock()
	log.Printf("Highscore added: %+v", hs)
	c.highscores = append(c.highscores, hs)
}

// Get returns all the highscores.
func (c *InMemoryHighscoreCache) Get() []Highscore {
	c.mu.Lock()
	defer c.mu.Unlock()
	// Return a copy to prevent race conditions on the slice
	scoresCopy := make([]Highscore, len(c.highscores))
	copy(scoresCopy, c.highscores)
	return scoresCopy
}

// NewBadgerCache creates a new cache for highscores using BadgerDB.
func NewBadgerCache(dbPath string) (HighscoreCache, error) {
	opts := badger.DefaultOptions(dbPath)
	opts.Logger = nil // Disable badger logging to reduce noise

	db, err := badger.Open(opts)
	if err != nil {
		return nil, fmt.Errorf("failed to open BadgerDB: %w", err)
	}

	return &BadgerHighscoreCache{
		db: db,
	}, nil
}

// BadgerHighscoreCache implements HighscoreCache using BadgerDB for persistent storage.
type BadgerHighscoreCache struct {
	db *badger.DB
}

// Add appends a new highscore to the BadgerDB cache.
func (c *BadgerHighscoreCache) Add(hs Highscore) {
	err := c.db.Update(func(txn *badger.Txn) error {
		// Generate a unique key for the highscore (timestamp + score)
		key := fmt.Sprintf("highscore_%d_%d", hs.GameStarted, hs.Score)

		// Marshal the highscore to JSON
		data, err := json.Marshal(hs)
		if err != nil {
			return fmt.Errorf("failed to marshal highscore: %w", err)
		}

		// Store in BadgerDB
		return txn.Set([]byte(key), data)
	})

	if err != nil {
		log.Printf("Failed to add highscore to BadgerDB: %v", err)
	} else {
		log.Printf("Highscore added to BadgerDB: %+v", hs)
	}
}

// Get returns all the highscores from BadgerDB.
func (c *BadgerHighscoreCache) Get() []Highscore {
	var highscores []Highscore

	err := c.db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		opts.PrefetchSize = 10
		it := txn.NewIterator(opts)
		defer it.Close()

		prefix := []byte("highscore_")
		for it.Seek(prefix); it.ValidForPrefix(prefix); it.Next() {
			item := it.Item()
			err := item.Value(func(val []byte) error {
				var hs Highscore
				if err := json.Unmarshal(val, &hs); err != nil {
					log.Printf("Failed to unmarshal highscore: %v", err)
					return nil // Continue iteration even if one item fails
				}
				highscores = append(highscores, hs)
				return nil
			})
			if err != nil {
				log.Printf("Failed to read highscore value: %v", err)
			}
		}
		return nil
	})

	if err != nil {
		log.Printf("Failed to read highscores from BadgerDB: %v", err)
		return []Highscore{}
	}

	return highscores
}

// Close closes the BadgerDB connection.
func (c *BadgerHighscoreCache) Close() error {
	if c.db != nil {
		return c.db.Close()
	}
	return nil
}
