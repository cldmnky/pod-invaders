package config

import (
	"flag"

	"github.com/spf13/pflag"
)

// Config holds the application configuration.
type Config struct {
	Kubeconfig          string
	EnableKube          bool
	NamespaceNames      []string
	HighscoreDBPath     string // Path to the highscore database
	EnableOpenShiftAuth bool   // Enable OpenShift OAuth authentication
}

// New initializes a new Config object from command-line flags.
func New() *Config {
	cfg := &Config{}

	// Define flags using pflag for compatibility with cobra (though cobra is removed)
	pflag.StringVar(&cfg.Kubeconfig, "kubeconfig", "", "(optional) absolute path to the kubeconfig file")
	pflag.BoolVar(&cfg.EnableKube, "enable-kube", true, "Enable Kubernetes client (default: true)")
	pflag.StringArrayVar(&cfg.NamespaceNames, "namespaces", []string{"default"}, "List of namespaces to query pods from (default: default)")
	pflag.StringVar(&cfg.HighscoreDBPath, "highscore-db", "/tmp/highscores.db", "Path to the highscore database file")
	// EnableOpenShiftAuth
	pflag.BoolVar(&cfg.EnableOpenShiftAuth, "enable-openshift-auth", false, "Enable OpenShift OAuth authentication (default: false)")

	// Add Go's standard flags to pflag
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	pflag.Parse()

	return cfg
}
