package assets

import "embed"

//go:embed views/* assets/*
var EmbeddedFiles embed.FS
