# Self-Hosted Quickstart: 0.1.0

This guide walks through running MyCodeXvantaOS 0.1.0 locally or on a self-hosted server using Docker.

---

## Prerequisites

- Docker (version 20+ recommended)
- curl or similar HTTP client
- git
- Node.js 22 and pnpm 9 (optional, for running `pnpm rc:verify`)

---

## Step 1: Clone and Checkout

```bash
git clone https://github.com/mycodexvantaos/mycodexvantaos.git
cd mycodexvantaos
git checkout v0.1.0
```

---

## Step 2: Build the Docker Image

```bash
docker build -t mycodexvantaos:0.1.0 .
```

This builds the api-node application into a Docker image. The build uses pnpm with Node 22.

---

## Step 3: Run the Container

```bash
docker run -d \
  --name mycodexvantaos-rc1 \
  -p 9100:9100 \
  -e PORT=9100 \
  mycodexvantaos:0.1.0
```

The API listens on port 9100 by default. You can change the host port mapping as needed.

---

## Step 4: Health Check

Verify the API is running and healthy:

```bash
# Basic health
curl http://localhost:9100/v1/health
# Expected: {"status":"ok",...}

# Ready check
curl http://localhost:9100/v1/ready
# Expected: {"ready":true,...}
```

---

## Step 5: Version and Runtime Check

Verify the running version matches the release candidate:

```bash
# Version endpoint
curl http://localhost:9100/v1/version
# Expected: version matching 0.1.0

# Runtime endpoint
curl http://localhost:9100/v1/runtime
# Expected: node version, platform, governance flags
```

---

## Step 6: Run RC Verification (Optional)

If you have Node.js 22 and pnpm 9 installed locally:

```bash
pnpm install --frozen-lockfile
pnpm rc:verify
```

This runs a comprehensive release candidate readiness check covering governance, contracts, policy, tests, manifest, docker, and python categories. Infrastructure checks (GCP, Terraform Cloud, Cloudflare, Kubernetes) will be skipped and documented as `infrastructure-not-configured`.

---

## Step 7: Run the Smoke Tests

### Docker Smoke Test

```bash
./scripts/smoke/docker-smoke.sh mycodexvantaos:0.1.0
```

### Self-Hosted Smoke Test

With the container running on port 9100:

```bash
./scripts/smoke/self-hosted-smoke.sh http://localhost:9100
```

This exercises all major API endpoints including service catalog, resource kinds, audit events, policy evaluation, dream safety lifecycle, and knowledge trace.

---

## Understanding Infrastructure-Not-Configured

When running self-hosted, certain infrastructure-dependent features will report as `infrastructure-not-configured`. This is expected and does not indicate a failure.

| Infrastructure  | Status                        | Reason                                                                                              |
| --------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Terraform Cloud | infrastructure-not-configured | No Terraform files in repository; external TFC GitHub App status is not actionable from self-hosted |
| GCP             | infrastructure-not-configured | Requires GCP_PROJECT_ID secret; not needed for local deployment                                     |
| Cloudflare      | infrastructure-not-configured | Requires CF_API_TOKEN secret; not needed for local deployment                                       |
| Kubernetes      | infrastructure-not-configured | Requires KUBE_CONFIG_DEV; Docker runtime is sufficient for validation                               |

These skips are documented in the verification summary and release artifacts. They do not prevent the release candidate from being validated.

---

## Key API Endpoints

| Endpoint                | Method | Description                                        |
| ----------------------- | ------ | -------------------------------------------------- |
| `/`                     | GET    | Root status                                        |
| `/v1/health`            | GET    | Health check                                       |
| `/v1/ready`             | GET    | Readiness check                                    |
| `/v1/version`           | GET    | Version information                                |
| `/v1/runtime`           | GET    | Runtime and governance metadata                    |
| `/v1/services`          | GET    | Service catalog listing                            |
| `/v1/resource-kinds`    | GET    | Resource kind listing                              |
| `/v1/audit/events`      | GET    | Audit event query                                  |
| `/v1/audit/events`      | POST   | Create audit event                                 |
| `/v1/audit/verify`      | GET    | Audit chain integrity verification                 |
| `/v1/policies`          | GET    | Policy listing                                     |
| `/v1/policies/evaluate` | POST   | Policy evaluation                                  |
| `/v1/dream/run`         | POST   | Start dream run (dry-run mode)                     |
| `/v1/knowledge/search`  | POST   | Knowledge search with receipt                      |
| `/v1/knowledge/answer`  | POST   | Knowledge-assisted answer (requires valid receipt) |

---

## Configuring KUBE_CONFIG_DEV Later

If you want to enable Kubernetes deployment in the future:

1. Obtain a valid kubeconfig for your cluster
2. Set the `KUBE_CONFIG_DEV` secret in your GitHub repository settings
3. The `drift-detection.yaml` and `unified-cd.yaml` workflows will detect the secret and enable K8s deployment

This is not required for local or self-hosted validation of the release candidate.

---

## Troubleshooting

### Container fails to start

- Ensure port 9100 is not already in use: `lsof -i :9100`
- Check container logs: `docker logs mycodexvantaos-rc1`
- Verify the image was built successfully

### Health endpoint returns error

- Wait 10-15 seconds after starting the container for initialization
- Check that `PORT=9100` is set correctly
- Verify the container is running: `docker ps | grep mycodexvantaos`

### pnpm rc:verify fails on governance checks

- Ensure you are at the correct tag: `git describe --tags`
- Run `pnpm install --frozen-lockfile` before verification
- Check that `apps/api-node/index.ts` contains all 7 enforcement flags

### Infrastructure-not-configured warnings

- These are expected and not errors
- They indicate features that require external infrastructure not available locally
- See the "Understanding Infrastructure-Not-Configured" section above
