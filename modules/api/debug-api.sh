#!/usr/bin/env bash

# Copyright 2020 The Kubermatic Kubernetes Platform contributors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

cd $(dirname $0)

echo "========================================="
echo "Starting Kubermatic API in DEBUG mode"
echo "========================================="

# Configuration
FEATURE_GATES="${FEATURE_GATES:-OIDCKubeCfgEndpoint=true}"
KUBERMATIC_EDITION="${KUBERMATIC_EDITION:-ee}"
PPROF_PORT=${PPROF_PORT:-6600}
API_PORT=${API_PORT:-8080}

# Check if kubeconfig exists
if [ -z "${KUBECONFIG:-}" ]; then
  if [ -f "dev.kubeconfig" ]; then
    KUBECONFIG=dev.kubeconfig
    echo "Using existing dev.kubeconfig"
  else
    echo "ERROR: KUBECONFIG not set and dev.kubeconfig not found"
    echo "Please set KUBECONFIG environment variable or create dev.kubeconfig"
    exit 1
  fi
fi

# Check if ca-bundle exists
CA_BUNDLE="certs/ca-bundle.pem"
if [ ! -f "$CA_BUNDLE" ]; then
  echo "ERROR: CA bundle not found at $CA_BUNDLE"
  exit 1
fi

# Service account signing key
if [ -z "${SERVICE_ACCOUNT_SIGNING_KEY:-}" ]; then
  echo "WARNING: SERVICE_ACCOUNT_SIGNING_KEY not set, using default (insecure for development only)"
  SERVICE_ACCOUNT_SIGNING_KEY="my-secure-secret-key-for-development-only"
fi

# OIDC Configuration (required)
OIDC_URL="${OIDC_URL:-https://dev.kubermatic.io/dex}"
OIDC_AUTHENTICATOR_CLIENT_ID="${OIDC_AUTHENTICATOR_CLIENT_ID:-kubermatic}"
OIDC_ISSUER_CLIENT_ID="${OIDC_ISSUER_CLIENT_ID:-kubermaticIssuer}"
OIDC_ISSUER_CLIENT_SECRET="${OIDC_ISSUER_CLIENT_SECRET:-secret}"
OIDC_ISSUER_REDIRECT_URI="${OIDC_ISSUER_REDIRECT_URI:-http://localhost:8080/api/v1/kubeconfig}"
OIDC_ISSUER_COOKIE_HASH_KEY="${OIDC_ISSUER_COOKIE_HASH_KEY:-very-secret-hash-key-for-cookie}"

# Additional args
API_EXTRA_ARGS=""
if [ -n "${CONFIG_FILE:-}" ]; then
  API_EXTRA_ARGS="$API_EXTRA_ARGS -kubermatic-configuration-file=$CONFIG_FILE"
fi

echo "Configuration:"
echo "  - KUBECONFIG: $KUBECONFIG"
echo "  - CA Bundle: $CA_BUNDLE"
echo "  - API Port: $API_PORT"
echo "  - PProf Port: $PPROF_PORT"
echo "  - Feature Gates: $FEATURE_GATES"
echo "  - Debug Mode: ENABLED"
echo "========================================="

# Build the API first with proper tags
echo "Building API with edition: $KUBERMATIC_EDITION..."
make kubermatic-api KUBERMATIC_EDITION=$KUBERMATIC_EDITION

# Run the API with debug mode enabled
echo "Running API in debug mode..."
set -x
./_build/kubermatic-api $API_EXTRA_ARGS \
  -kubeconfig=$KUBECONFIG \
  -ca-bundle=$CA_BUNDLE \
  -feature-gates=$FEATURE_GATES \
  -worker-name="local-dev-$(whoami)" \
  -internal-address=127.0.0.1:18085 \
  -prometheus-url=http://localhost:9090 \
  -address=127.0.0.1:$API_PORT \
  -oidc-url=$OIDC_URL \
  -oidc-authenticator-client-id=$OIDC_AUTHENTICATOR_CLIENT_ID \
  -oidc-issuer-client-id=$OIDC_ISSUER_CLIENT_ID \
  -oidc-issuer-client-secret=$OIDC_ISSUER_CLIENT_SECRET \
  -oidc-issuer-redirect-uri=$OIDC_ISSUER_REDIRECT_URI \
  -oidc-issuer-cookie-hash-key=$OIDC_ISSUER_COOKIE_HASH_KEY \
  -oidc-issuer-cookie-secure-mode=false \
  -service-account-signing-key="$SERVICE_ACCOUNT_SIGNING_KEY" \
  -log-debug=true \
  -log-format=Console \
  -pprof-listen-address=":$PPROF_PORT" \
  -logtostderr \
  -v=4 "$@"
