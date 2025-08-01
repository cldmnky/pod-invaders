package config

import (
	"flag"
	"path/filepath"

	"github.com/spf13/pflag"
	"k8s.io/client-go/util/homedir"
)

// Config holds the application configuration.
type Config struct {
	Kubeconfig     string
	EnableKube     bool
	NamespaceNames []string
}

// New initializes a new Config object from command-line flags.
func New() *Config {
	cfg := &Config{}

	// Define flags using pflag for compatibility with cobra (though cobra is removed)
	pflag.StringVar(&cfg.Kubeconfig, "kubeconfig", filepath.Join(homedir.HomeDir(), ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	pflag.BoolVar(&cfg.EnableKube, "enable-kube", true, "Enable Kubernetes client (default: true)")
	pflag.StringArrayVar(&cfg.NamespaceNames, "namespaces", []string{"default"}, "List of namespaces to query pods from (default: default)")

	// Add Go's standard flags to pflag
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
	pflag.Parse()

	return cfg
}
