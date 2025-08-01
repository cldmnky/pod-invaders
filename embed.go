package main

import "embed"

// Embed all files in assets and views
//
//go:embed assets/* views/*
var EmbeddedFiles embed.FS
