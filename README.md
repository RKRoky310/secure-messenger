# Secure Messenger - Deployment Guide

Production deployment configuration for cloud hosting, containerization, and infrastructure.

## Deployment Platforms

- **Docker** - Container orchestration
- **Kubernetes** - Scalable container platform
- **AWS** - Amazon Web Services deployment
- **Google Cloud** - Google Cloud Platform
- **DigitalOcean** - Simple VPS hosting
- **Heroku** - Platform-as-a-Service

## Pre-Deployment Checklist

### Security
- [ ] All dependencies audited (`npm audit`)
- [ ] No hardcoded secrets in code
- [ ] Environment variables configured
- [ ] SSL/TLS certificates obtained
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Database encryption enabled
- [ ] Backups automated
- [ ] Monitoring configured

### Database
- [ ] PostgreSQL 15+ installed
- [ ] Database created
- [ ] Migrations run
- [ ] Backups configured
- [ ] Replication setup (optional)
- [ ] Encryption enabled
- [ ] Performance tuned

### Cache
- [ ] Redis 7+ installed
- [ ] Redis persistence enabled
- [ ] Redis replication setup (optional)
- [ ] Memory limits configured
- [ ] Eviction policy set

### Monitoring
- [ ] Prometheus configured
- [ ] Grafana dashboards created
- [ ] Alerting rules configured
- [ ] Log aggregation setup
- [ ] Error tracking enabled

### Backups
- [ ] Database backups automated
- [ ] Backup retention policy set
- [ ] Restore testing completed
- [ ] Off-site backup storage

## Docker Deployment

### Build Docker Image

```bash
docker build -t secure-messenger:latest .
```

### Run Container

```bash
docker run -d \
  --name secure-messenger \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=your-secret-key \
  secure-messenger:latest
```

### Docker Compose

```bash
docker-compose up -d
```

## Kubernetes Deployment

### Prerequisites
- kubectl configured
- Kubernetes cluster available
- Docker image pushed to registry

### Deploy

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Verify Deployment

```bash
kubectl get pods -n secure-messenger
kubectl get svc -n secure-messenger
kubectl logs -n secure-messenger -f deployment/secure-messenger
```

## AWS Deployment (ECS)

### 1. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name secure-messenger
```

### 2. Register Task Definition

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

### 3. Create Service

```bash
aws ecs create-service \
  --cluster secure-messenger \
  --service-name secure-messenger-service \
  --task-definition secure-messenger:1 \
  --desired-count 3 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=secure-messenger,containerPort=3000
```

### 4. Configure Auto Scaling

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name secure-messenger-asg \
  --launch-configuration secure-messenger-lc \
  --min-size 3 \
  --max-size 10 \
  --desired-capacity 3
```

## Google Cloud Deployment

### 1. Build and Push Image

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/secure-messenger:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy secure-messenger \
  --image gcr.io/PROJECT_ID/secure-messenger:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars DATABASE_URL=postgresql://...,REDIS_URL=redis://...
```

## DigitalOcean Deployment

### 1. Create Droplet

```bash
doctl compute droplet create secure-messenger \
  --region nyc3 \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb
```

### 2. Install Dependencies

```bash
sudo apt update
sudo apt install -y nodejs npm postgresql redis-server nginx
```

### 3. Deploy Application

```bash
cd /app
git clone <repo>
cd secure-messenger
npm install --production
npm run migrate
npm start
```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
certbot certonly --standalone -d api.securemessenger.app
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.securemessenger.app;

    ssl_certificate /etc/letsencrypt/live/api.securemessenger.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.securemessenger.app/privkey.pem;

    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Health Checks

### Application Health

```bash
curl https://api.securemessenger.app/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-09-28T18:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

## Monitoring & Logging

### Prometheus Metrics

```bash
curl http://localhost:9090/metrics
```

### Grafana Dashboard

Access at: `http://localhost:3001`

### Log Aggregation

```bash
# Using ELK Stack
# Logs are sent to Elasticsearch
# Viewed in Kibana at http://localhost:5601
```

## Scaling

### Horizontal Scaling

```bash
# Kubernetes
kubectl scale deployment secure-messenger --replicas=5

# Docker Swarm
docker service scale secure-messenger=5
```

### Vertical Scaling

```bash
# Increase pod resources
kubectl set resources deployment secure-messenger \
  --limits=cpu=2,memory=4Gi \
  --requests=cpu=1,memory=2Gi
```

## Zero-Downtime Deployment

### Rolling Update

```bash
kubectl set image deployment/secure-messenger \
  secure-messenger=secure-messenger:v2 \
  --record
```

### Blue-Green Deployment

```bash
# Deploy new version alongside current
kubectl apply -f k8s/deployment-v2.yaml

# Switch traffic
kubectl set selector service/secure-messenger version=v2
```

## Database Backups

### Automated Daily Backups

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://backups/
```

### Restore from Backup

```bash
aws s3 cp s3://backups/backup-20240928.sql.gz .
gunzip backup-20240928.sql.gz
psql $DATABASE_URL < backup-20240928.sql
```

## Disaster Recovery

### RTO/RPO Targets
- Recovery Time Objective (RTO): 1 hour
- Recovery Point Objective (RPO): 15 minutes

### Failover Procedure

1. Detect outage
2. Activate standby database
3. Update DNS records
4. Verify application connectivity
5. Notify users

## Performance Tuning

### PostgreSQL

```sql
-- Connection pooling
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## Cost Optimization

- Use reserved instances (AWS, GCP)
- Enable auto-scaling to reduce idle resources
- Use CDN for static assets
- Compress database backups
- Use spot instances for non-critical services

## Disaster Recovery Checklist

- [ ] Backup strategy documented
- [ ] Backup retention policy set
- [ ] Restore procedures tested
- [ ] Failover procedures documented
- [ ] DNS failover configured
- [ ] Load balancer health checks configured
- [ ] Monitoring alerts configured
- [ ] On-call rotation established

## License

MIT
