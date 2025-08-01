# VERSION defines the project version for the bundle.
# Update this value when you upgrade the version of your project.
VERSION ?= latest

# IMAGE_TAG_BASE defines the docker.io namespace and part of the image name for remote images.
# This variable is used to construct full image tags for bundle and catalog images.
IMAGE_TAG_BASE ?= quay.io/cldmnky/pod-invaders

# Image URL to use all building/pushing image targets
IMG ?= $(IMAGE_TAG_BASE):$(VERSION)

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

# CONTAINER_TOOL defines the container tool to be used for building images.
# Be aware that the target commands are only tested with Docker which is
# scaffolded by default. However, you might want to replace it to use other
# tools. (i.e. podman)
CONTAINER_TOOL ?= podman

# Setting SHELL to bash allows bash commands to be executed by recipes.
# Options are set to exit when a recipe line exits non-zero or a piped command fails.
SHELL = /usr/bin/env bash -o pipefail
.SHELLFLAGS = -ec

.PHONY: all
all: build

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk command is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: test
test: fmt vet ## Run tests.
	go test ./... -coverprofile cover.out

.PHONY: lint
lint: golangci-lint ## Run golangci-lint linter
	$(GOLANGCI_LINT) run

.PHONY: lint-fix
lint-fix: golangci-lint ## Run golangci-lint linter and perform fixes
	$(GOLANGCI_LINT) run --fix

##@ Build

.PHONY: build
build: fmt vet ## Build pod-invaders binary.
	go build -o bin/pod-invaders .

.PHONY: run
run: fmt vet ## Run pod-invaders from your host.
	go run . --enable-kube=false

.PHONY: build-container
build-container: ko ## Build container image with ko.
	KO_DOCKER_REPO=$(IMAGE_TAG_BASE) \
	$(KO) build --platform linux/amd64,linux/arm64 \
		--preserve-import-paths=false \
		--bare=true \
		--tags=$(VERSION) \
		.

.PHONY: build-and-push-container
build-and-push-container: ko ## Build and push container image with ko.
	KO_DOCKER_REPO=$(IMAGE_TAG_BASE) \
	$(KO) build --platform linux/amd64,linux/arm64 \
		--preserve-import-paths=false \
		--bare=true \
		--tags=$(VERSION) \
		--push=true \
		.

.PHONY: docker-build
docker-build: ## Build docker image using Containerfile.
	$(CONTAINER_TOOL) build -t ${IMG} .

.PHONY: docker-push
docker-push: ## Push docker image.
	$(CONTAINER_TOOL) push ${IMG}

##@ Deployment

.PHONY: helm-install
helm-install: ## Install pod-invaders using Helm
	helm install pod-invaders ./deploy/pod-invaders

.PHONY: helm-upgrade
helm-upgrade: ## Upgrade pod-invaders using Helm
	helm upgrade pod-invaders ./deploy/pod-invaders

.PHONY: helm-uninstall
helm-uninstall: ## Uninstall pod-invaders using Helm
	helm uninstall pod-invaders

.PHONY: helm-template
helm-template: ## Generate Kubernetes manifests using Helm template
	helm template pod-invaders ./deploy/pod-invaders

.PHONY: deploy
deploy: build-and-push-container helm-upgrade ## Build, push container and deploy with Helm

##@ Dependencies

## Location to install dependencies to
LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

## Tool Binaries
KO ?= $(LOCALBIN)/ko
GOLANGCI_LINT ?= $(LOCALBIN)/golangci-lint

## Tool Versions
GOLANGCI_LINT_VERSION ?= v1.54.2

.PHONY: ko
ko: $(KO) ## Download ko locally if necessary.
$(KO): $(LOCALBIN)
	test -s $(LOCALBIN)/ko || GOBIN=$(LOCALBIN) go install github.com/google/ko@latest

.PHONY: golangci-lint
golangci-lint: $(GOLANGCI_LINT) ## Download golangci-lint locally if necessary.
$(GOLANGCI_LINT): $(LOCALBIN)
	@if ! test -s $(LOCALBIN)/golangci-lint; then \
		set -e ;\
		curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(LOCALBIN) $(GOLANGCI_LINT_VERSION) ;\
	fi

##@ Clean

.PHONY: clean
clean: ## Clean build artifacts.
	rm -rf bin/
	rm -f cover.out
