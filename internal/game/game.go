package game

import (
	"crypto/rand"
)

// Pod represents a Kubernetes pod, which can be real or fake.
type Pod struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	IsRealPod bool   `json:"isRealPod,omitempty"`
}

// Namespaces is a list of Kubernetes namespaces.
type Namespaces struct {
	Namespaces []string `json:"namespaces"`
}

// Highscore represents a player's score in the game.
type Highscore struct {
	GameStarted    int64  `json:"gameStarted"`
	TimeTaken      int64  `json:"timeTaken"`
	LevelsFinished int    `json:"levelsFinished"`
	Score          int    `json:"score"`
	Name           string `json:"name"`
}

// --- Fake data for standalone mode ---

var fakePodNames = []string{
	"lucius", "marcus", "tiberius", "gaius", "octavius", "julius", "claudius", "nero",
	"augustus", "constantine", "hadrian", "traianus", "vulcanus", "mercurius", "neptunus", "pluto",
}

var fakeNamespaceNames = []string{
	"tiger", "lion", "elephant", "giraffe", "zebra", "panda", "koala", "kangaroo",
	"penguin", "dolphin", "whale", "shark", "octopus", "crab", "lobster", "jellyfish",
}

// randomChoice selects a random element from a slice of strings.
func randomChoice(list []string) string {
	if len(list) == 0 {
		return ""
	}
	b := make([]byte, 1)
	_, err := rand.Read(b)
	if err != nil {
		// Fallback to a less random choice if crypto/rand fails
		return list[0]
	}
	return list[int(b[0])%len(list)]
}

// GenerateFakePod creates a pod with a randomized name and namespace.
func GenerateFakePod() Pod {
	return Pod{
		Name:      randomChoice(fakePodNames),
		Namespace: randomChoice(fakeNamespaceNames),
		IsRealPod: false,
	}
}
