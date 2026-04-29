# Kubernetes Deployment Guide — Todo App

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed

---

## Step 1 — Start Minikube

```bash
minikube start --cpus=4 --memory=4096
```

---

## Step 2 — Install metrics-server (required for HPA)

```bash
minikube addons enable metrics-server
```

Verify it's running (wait ~60 seconds):
```bash
kubectl top nodes
```

---

## Step 3 — Point Docker to Minikube's registry

This lets Minikube use images you build locally without pushing to Docker Hub.

```bash
# Windows (PowerShell)
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Mac/Linux
eval $(minikube docker-env)
```

> ⚠️  Run ALL docker build commands in this same terminal session.

---

## Step 4 — Build your Docker images

From your project root (where backend/ and frontend/ folders are):

```bash
# Build backend
docker build -t todo-backend:latest ./backend

# Build frontend (pass the backend URL the browser will use)
docker build \
  --build-arg VITE_API_URL=http://$(minikube ip):30000 \
  -t todo-frontend:latest \
  ./frontend
```

---

## Step 5 — Fill in your secrets

Edit `00-secret.yaml` and replace the placeholder values:

```yaml
stringData:
  JWT_SECRET: "your_real_jwt_secret_here"
  DB_PASSWORD: "todo_pass"             # keep this unless you change it
  RAZORPAY_KEY_ID: "rzp_test_XXXXXXX"
  RAZORPAY_KEY_SECRET: "your_secret"
```

---

## Step 6 — Apply all manifests (in order)

```bash
kubectl apply -f k8s/00-secret.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/03-postgres-init-configmap.yaml
kubectl apply -f k8s/02-postgres.yaml
kubectl apply -f k8s/04-redis.yaml
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-hpa.yaml
```

Or apply everything at once:
```bash
kubectl apply -f k8s/
```

---

## Step 7 — Verify everything is running

```bash
# Check all pods are Running (not Pending/CrashLoopBackOff)
kubectl get pods

# Check services
kubectl get services

# Check HPA status
kubectl get hpa
```

Expected output for pods:
```
NAME                        READY   STATUS    RESTARTS
backend-xxxx-xxxx           1/1     Running   0
backend-xxxx-yyyy           1/1     Running   0
frontend-xxxx-xxxx          1/1     Running   0
frontend-xxxx-yyyy          1/1     Running   0
postgres-xxxx-xxxx          1/1     Running   0
redis-xxxx-xxxx             1/1     Running   0
```

---

## Step 8 — Access your app

```bash
# Get Minikube IP
minikube ip
# Example output: 192.168.49.2

# Frontend:  http://192.168.49.2:30001
# Backend:   http://192.168.49.2:30000
```

Or use minikube's shortcut:
```bash
minikube service frontend-service
minikube service backend-nodeport
```

---

## Step 9 — Watch HPA auto-scaling in action

In one terminal, watch the HPA:
```bash
kubectl get hpa -w
```

In another, simulate load on the backend:
```bash
# Install kubectl load testing (or use hey/ab)
kubectl run load-test --image=busybox --rm -it -- \
  sh -c "while true; do wget -q -O- http://backend-service:3000/; done"
```

You'll see replicas increase from 2 → up to 10 automatically.

---

## Useful Commands

```bash
# View logs for a pod
kubectl logs -f deployment/backend
kubectl logs -f deployment/frontend

# Describe a pod (for debugging)
kubectl describe pod <pod-name>

# Restart a deployment
kubectl rollout restart deployment/backend

# Delete everything and start fresh
kubectl delete -f k8s/

# Stop Minikube
minikube stop
```

---

## File Structure Summary

```
k8s/
├── 00-secret.yaml              # JWT, DB password, Razorpay keys
├── 01-configmap.yaml           # Non-sensitive env vars
├── 02-postgres.yaml            # PostgreSQL pod + PVC + service
├── 03-postgres-init-configmap.yaml  # Auto-runs schema.sql on first boot
├── 04-redis.yaml               # Redis pod + service
├── 05-backend.yaml             # Backend pods (2 replicas) + services
├── 06-frontend.yaml            # Frontend pods (2 replicas) + NodePort
└── 07-hpa.yaml                 # Auto-scaling for backend (2-10) & frontend (2-6)
```

---

## Architecture

```
Browser
  │
  ▼
frontend-service (NodePort :30001)
  │  [nginx serving React SPA]
  │
  ▼ API calls directly from browser
backend-nodeport (:30000)
  │
  ├──► postgres-service:5432  [PostgreSQL]
  └──► redis-service:6379     [Redis cache]
```

HPA monitors CPU/memory of backend and frontend pods and automatically
adds or removes replicas within the configured min/max bounds.