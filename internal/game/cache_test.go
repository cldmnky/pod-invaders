package game

import (
	"path/filepath"
	"testing"
	"time"
)

func TestBadgerHighscoreCache(t *testing.T) {
	// Create a temporary directory for the test database
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "testdb")

	// Create a new BadgerDB cache
	cache, err := NewBadgerCache(dbPath)
	if err != nil {
		t.Fatalf("Failed to create BadgerDB cache: %v", err)
	}

	// Ensure we close the database at the end
	if badgerCache, ok := cache.(*BadgerHighscoreCache); ok {
		defer badgerCache.Close()
	}

	// Test adding highscores
	testHighscores := []Highscore{
		{
			GameStarted:    time.Now().Unix(),
			TimeTaken:      60000, // 60 seconds
			LevelsFinished: 5,
			Score:          1000,
			Name:           "Player1",
		},
		{
			GameStarted:    time.Now().Unix() + 1,
			TimeTaken:      45000, // 45 seconds
			LevelsFinished: 7,
			Score:          1500,
			Name:           "Player2",
		},
		{
			GameStarted:    time.Now().Unix() + 2,
			TimeTaken:      90000, // 90 seconds
			LevelsFinished: 3,
			Score:          800,
			Name:           "Player3",
		},
	}

	// Add highscores to the cache
	for _, hs := range testHighscores {
		cache.Add(hs)
	}

	// Retrieve highscores from the cache
	retrievedScores := cache.Get()

	// Verify the count
	if len(retrievedScores) != len(testHighscores) {
		t.Errorf("Expected %d highscores, got %d", len(testHighscores), len(retrievedScores))
	}

	// Create a map for easier verification
	expectedScores := make(map[string]Highscore)
	for _, hs := range testHighscores {
		expectedScores[hs.Name] = hs
	}

	// Verify each retrieved highscore
	for _, retrieved := range retrievedScores {
		expected, exists := expectedScores[retrieved.Name]
		if !exists {
			t.Errorf("Unexpected highscore for player: %s", retrieved.Name)
			continue
		}

		if retrieved.GameStarted != expected.GameStarted {
			t.Errorf("GameStarted mismatch for %s: expected %d, got %d", retrieved.Name, expected.GameStarted, retrieved.GameStarted)
		}
		if retrieved.TimeTaken != expected.TimeTaken {
			t.Errorf("TimeTaken mismatch for %s: expected %d, got %d", retrieved.Name, expected.TimeTaken, retrieved.TimeTaken)
		}
		if retrieved.LevelsFinished != expected.LevelsFinished {
			t.Errorf("LevelsFinished mismatch for %s: expected %d, got %d", retrieved.Name, expected.LevelsFinished, retrieved.LevelsFinished)
		}
		if retrieved.Score != expected.Score {
			t.Errorf("Score mismatch for %s: expected %d, got %d", retrieved.Name, expected.Score, retrieved.Score)
		}
		if retrieved.Name != expected.Name {
			t.Errorf("Name mismatch: expected %s, got %s", expected.Name, retrieved.Name)
		}
	}
}

func TestBadgerHighscoreCachePersistence(t *testing.T) {
	// Create a temporary directory for the test database
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "persistencedb")

	// Create a highscore to test persistence
	testHighscore := Highscore{
		GameStarted:    time.Now().Unix(),
		TimeTaken:      120000, // 2 minutes
		LevelsFinished: 10,
		Score:          2500,
		Name:           "PersistentPlayer",
	}

	// First session: create cache, add highscore, close
	{
		cache, err := NewBadgerCache(dbPath)
		if err != nil {
			t.Fatalf("Failed to create BadgerDB cache: %v", err)
		}

		cache.Add(testHighscore)

		if badgerCache, ok := cache.(*BadgerHighscoreCache); ok {
			badgerCache.Close()
		}
	}

	// Second session: reopen cache and verify data persisted
	{
		cache, err := NewBadgerCache(dbPath)
		if err != nil {
			t.Fatalf("Failed to reopen BadgerDB cache: %v", err)
		}
		defer func() {
			if badgerCache, ok := cache.(*BadgerHighscoreCache); ok {
				badgerCache.Close()
			}
		}()

		retrievedScores := cache.Get()

		if len(retrievedScores) != 1 {
			t.Errorf("Expected 1 persisted highscore, got %d", len(retrievedScores))
			return
		}

		retrieved := retrievedScores[0]
		if retrieved.Name != testHighscore.Name ||
			retrieved.Score != testHighscore.Score ||
			retrieved.GameStarted != testHighscore.GameStarted ||
			retrieved.TimeTaken != testHighscore.TimeTaken ||
			retrieved.LevelsFinished != testHighscore.LevelsFinished {
			t.Errorf("Persisted data mismatch: expected %+v, got %+v", testHighscore, retrieved)
		}
	}
}

func TestInMemoryHighscoreCache(t *testing.T) {
	// Test the in-memory implementation for comparison
	cache := NewInMemoryHighscoreCache()

	testHighscore := Highscore{
		GameStarted:    time.Now().Unix(),
		TimeTaken:      30000,
		LevelsFinished: 2,
		Score:          500,
		Name:           "MemoryPlayer",
	}

	cache.Add(testHighscore)
	retrieved := cache.Get()

	if len(retrieved) != 1 {
		t.Errorf("Expected 1 highscore in memory cache, got %d", len(retrieved))
		return
	}

	if retrieved[0].Name != testHighscore.Name {
		t.Errorf("Expected name %s, got %s", testHighscore.Name, retrieved[0].Name)
	}
}

func TestHighscoreCacheInterface(t *testing.T) {
	// Test that both implementations satisfy the HighscoreCache interface
	var cache HighscoreCache

	// Test in-memory implementation
	cache = NewInMemoryHighscoreCache()
	testInterface(t, cache, "InMemory")

	// Test BadgerDB implementation
	tempDir := t.TempDir()
	dbPath := filepath.Join(tempDir, "interfacedb")

	badgerCache, err := NewBadgerCache(dbPath)
	if err != nil {
		t.Fatalf("Failed to create BadgerDB cache: %v", err)
	}
	defer func() {
		if bc, ok := badgerCache.(*BadgerHighscoreCache); ok {
			bc.Close()
		}
	}()

	cache = badgerCache
	testInterface(t, cache, "Badger")
}

func testInterface(t *testing.T, cache HighscoreCache, implName string) {
	testHighscore := Highscore{
		GameStarted:    time.Now().Unix(),
		TimeTaken:      15000,
		LevelsFinished: 1,
		Score:          250,
		Name:           "InterfaceTest" + implName,
	}

	// Test that we can call Add and Get through the interface
	cache.Add(testHighscore)
	scores := cache.Get()

	if len(scores) == 0 {
		t.Errorf("%s implementation: Expected at least 1 score, got 0", implName)
	}
}
