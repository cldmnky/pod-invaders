# OpenShift Deployment with OAuth Proxy

This document describes how to deploy Pod Invaders on OpenShift with OAuth authentication using the oauth-proxy sidecar.

## Features

- OpenShift OAuth integration for authentication
- Automatic SSL/TLS termination with reencryption
- Access token forwarding via `X-Forwarded-Access-Token` header
- Service account token-based authentication
- Automatic route creation

## Prerequisites

- OpenShift cluster with admin privileges
- Helm 3.x installed
- kubectl/oc CLI configured

## Quick Start

1. Deploy with OpenShift support enabled:

```bash
helm install pod-invaders ./pod-invaders -f values-openshift.yaml
```

1. Get the route URL:

```bash
oc get route pod-invaders -o jsonpath='{.spec.host}'
```

1. Access the application through the route URL. You'll be redirected to OpenShift OAuth for authentication.

## Configuration

### OpenShift OAuth Proxy

The oauth-proxy sidecar is configured with the following key settings:

- **Port**: 8443 (HTTPS)
- **Provider**: OpenShift OAuth
- **Authentication**: Service Account Token
- **Access Token Forwarding**: Enabled via `X-Forwarded-Access-Token` header

### Values Configuration

Key configuration options in `values-openshift.yaml`:

```yaml
openshift:
  enabled: true
  oauthProxy:
    port: 8443
    extraArgs:
      - "--pass-access-token"        # Forward access token to backend
      - "--set-xauthrequest"        # Set X-Auth-Request headers
      - "--pass-host-header"        # Pass original host header
      - "--email-domain=*"          # Allow all email domains
  route:
    enabled: true
    tls:
      termination: "reencrypt"      # End-to-end encryption
```

## Backend Integration

The pod-invaders Go server can access the user's access token through the `X-Forwarded-Access-Token` header:

```go
func (h *Handler) someHandler(w http.ResponseWriter, r *http.Request) {
    accessToken := r.Header.Get("X-Forwarded-Access-Token")
    if accessToken == "" {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    
    // Use the access token to make authenticated requests to the Kubernetes API
    // This token can be used with the Kubernetes client-go library
}
```

## Security Considerations

1. **Service Account Permissions**: The service account is granted cluster-wide permissions to list and delete pods in configured namespaces.

1. **TLS Encryption**:
   - External traffic uses TLS termination at the route level
   - Internal traffic between oauth-proxy and pod-invaders uses HTTP (localhost)
   - Route is configured with `reencrypt` for end-to-end encryption

1. **Token Security**: Access tokens are passed via headers and should be handled securely in the backend application.

## Customization

### Custom OAuth Configuration

You can customize the OAuth proxy behavior by modifying the `extraArgs` in values:

```yaml
openshift:
  oauthProxy:
    extraArgs:
      - "--skip-auth-regex=^/health"     # Skip auth for health checks
      - "--pass-access-token"            # Forward access token
      - "--cookie-expire=24h"            # Set cookie expiration
      - "--cookie-refresh=1h"            # Set cookie refresh interval
```

### Custom Route Configuration

```yaml
openshift:
  route:
    host: "pod-invaders.apps.my-cluster.com"
    annotations:
      haproxy.router.openshift.io/timeout: "60s"
```

## Troubleshooting

1. **Authentication Issues**:

   ```bash
   oc logs deployment/pod-invaders -c oauth-proxy
   ```

1. **Route Not Accessible**:

   ```bash
   oc get route pod-invaders
   oc describe route pod-invaders
   ```

1. **Permission Issues**:

   ```bash
   oc get clusterrolebinding | grep pod-invaders
   oc describe clusterrole pod-invaders
   ```

1. **Certificate Issues**:

   ```bash
   oc get secret pod-invaders-proxy-tls
   oc describe secret pod-invaders-proxy-tls
   ```

## Uninstalling

```bash
helm uninstall pod-invaders
```

This will remove all resources including the route, secrets, and RBAC configurations.
