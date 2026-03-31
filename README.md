# Legacy App Modernization — E-Commerce Application

A modernized e-commerce shopping cart application built with Node.js and Express, containerized with Docker, deployed to AWS EKS with Kubernetes, and monitored with Prometheus.

## What Gets Created Yemi

- **E-Commerce App** — A shopping cart web application with product listing, add-to-cart, and checkout functionality
- **Prometheus Metrics** — Built-in metrics endpoint (`/metrics`) tracking HTTP request counts and Node.js runtime metrics
- **Docker Image** — Containerized application pushed to your DockerHub account
- **Kubernetes Deployment** — 3 replicas deployed to EKS with readiness/liveness probes, resource limits, and a LoadBalancer service
- **ServiceMonitor** — Prometheus integration for automatic metrics scraping every 15 seconds
- **CI/CD Pipeline** — GitHub Actions workflow that builds, pushes, and deploys the application

## Prerequisites

### 1. EKS Cluster

This project deploys to the `migration-eks-cluster` provisioned by the `cloud-migration-infra` setup. Complete the [Cloud Migration Infrastructure setup](https://github.com/anmutetech/cloud-migration-infra) before proceeding.

Verify your cluster is running:

```bash
kubectl get nodes
```

### 2. DockerHub Account

You need a [DockerHub](https://hub.docker.com/) account to store your container image.

1. Sign up at [hub.docker.com](https://hub.docker.com/) if you don't have an account
2. Note your DockerHub **username** and **password** — you will need these later

### 3. AWS CLI and kubectl

You should already have these installed from the cloud-migration-infra setup. Verify:

```bash
aws --version
kubectl version --client
```

## Setup Guide

### Step 1 — Fork and Clone the Repository

1. Fork this repository to your own GitHub account
2. Clone your fork:

```bash
git clone https://github.com/<your-username>/legacy-app-modernization.git
cd legacy-app-modernization
```

### Step 2 — Update the Docker Image Reference

Edit `kubernetes/deployment.yaml` and replace the image reference with your own DockerHub username:

```yaml
image: <your-dockerhub-username>/ecommerce-app:latest
```

Commit and push this change:

```bash
git add kubernetes/deployment.yaml
git commit -m "Update Docker image to use my DockerHub account"
git push origin main
```

### Step 3 — Configure GitHub Secrets

In your forked repository, go to **Settings** > **Secrets and variables** > **Actions** and add:

| Secret Name | Value |
|---|---|
| `DOCKER_USERNAME` | Your DockerHub username |
| `DOCKER_PASSWORD` | Your DockerHub password |
| `AWS_ACCESS_KEY_ID` | Your IAM user access key ID |
| `AWS_SECRET_ACCESS_KEY` | Your IAM user secret access key |

### Step 4 — Run the CI/CD Pipeline

The pipeline triggers automatically when you push to `main`. Since you pushed in Step 2, the pipeline should already be running.

1. Go to the **Actions** tab in your forked repository
2. Click on the running workflow to monitor progress

The pipeline will:
1. Install Node.js dependencies
2. Build the Docker image
3. Push the image to your DockerHub account
4. Deploy the application to your EKS cluster (namespace, deployment, service, and ServiceMonitor)

> **Note:** The first run takes approximately 3–5 minutes.

### Step 5 — Connect to Your EKS Cluster

Make sure your local kubectl is configured for the cluster:

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name migration-eks-cluster
```

### Step 6 — Verify the Deployment

Check the pods are running:

```bash
kubectl get pods -n legacy-app-ns
```

You should see 3 pods in a `Running` state.

Check the service:

```bash
kubectl get svc -n legacy-app-ns
```

Copy the `EXTERNAL-IP` of the LoadBalancer and open it in your browser. It may take a few minutes for the DNS to become available.

You should see the shopping cart UI with products (Laptop, Phone, Headphones, Keyboard). Try adding items to the cart and checking out.

### Step 7 — Verify Prometheus Monitoring

The ServiceMonitor will automatically start scraping metrics from the application if Prometheus is running from the cloud-migration-infra setup.

Confirm the ServiceMonitor is created:

```bash
kubectl get servicemonitor -n legacy-app-ns
```

You can check the metrics directly:

```bash
kubectl port-forward -n legacy-app-ns svc/legacy-app-service 8080:80
curl http://localhost:8080/metrics
```

You should see Prometheus-formatted metrics including `http_requests_total`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | List all products |
| `POST` | `/cart` | Add a product to cart (`{ "productId": 1 }`) |
| `GET` | `/cart` | View cart contents |
| `POST` | `/checkout` | Complete the order and clear the cart |
| `GET` | `/metrics` | Prometheus metrics |

## Cleanup

Remove the application from your EKS cluster:

```bash
kubectl delete -f kubernetes/servicemonitor.yaml
kubectl delete -f kubernetes/service.yaml
kubectl delete -f kubernetes/deployment.yaml
kubectl delete -f kubernetes/namespace.yaml
```

Optionally remove the Docker image from DockerHub via your [DockerHub repository settings](https://hub.docker.com/).

> **Note:** This only removes the application. To destroy the underlying EKS cluster, follow the cleanup steps in the [Cloud Migration Infrastructure README](https://github.com/anmutetech/cloud-migration-infra).

## Project Structure

```
legacy-app-modernization/
├── .github/workflows/
│   └── deploy-ecomm-app.yml   # CI/CD pipeline for build, push, and deploy
├── app/
│   ├── package.json           # Node.js dependencies
│   ├── server.js              # Express API server with product/cart routes
│   └── public/
│       ├── index.html         # Shopping cart UI
│       ├── app.js             # Frontend JavaScript (fetch products, cart, checkout)
│       ├── style.css          # Application styling
│       └── thankyou.html      # Order confirmation page
├── docker/
│   └── Dockerfile             # Container image definition (Node 18)
├── kubernetes/
│   ├── namespace.yaml         # legacy-app-ns namespace
│   ├── deployment.yaml        # 3-replica deployment with probes and resource limits
│   ├── service.yaml           # LoadBalancer service (port 80 → 3000)
│   └── servicemonitor.yaml    # Prometheus ServiceMonitor (scrape every 15s)
└── monitoring/
    └── metrics.js             # Prometheus metrics middleware (http_requests_total)
```
