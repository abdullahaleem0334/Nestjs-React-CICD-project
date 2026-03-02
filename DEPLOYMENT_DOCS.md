# CI/CD Pipeline - Deployment & Rollback Documentation

## Project Overview
This project implements a fully automated CI/CD pipeline to deploy:
- **Backend**: Node.js (NestJS) application managed by PM2
- **Frontend**: React application served via Nginx
- **Infrastructure**: AWS EC2 instances on Amazon Linux

---

## Architecture
```
Developer → Git Push → Jenkins Pipeline → App Server
                           |
                    ┌──────────────┐
                    │   Jenkins    │
                    │   Server     │
                    │ (Build+Test) │
                    └──────┬───────┘
                           │ SSH/SCP
                    ┌──────▼───────┐
                    │  App Server  │
                    │  NestJS+PM2  │
                    │  React+Nginx │
                    │  Prometheus  │
                    │   Grafana    │
                    └──────────────┘
```

---

## Server Details

| Server | Purpose | Key Software |
|--------|---------|--------------|
| Jenkins Server | CI/CD Pipeline | Jenkins, Node.js, Git |
| App Server | Application Hosting | Node.js, PM2, Nginx, Prometheus, Grafana |

---

## Folder Structure on App Server
```
/var/www/backend/
   releases/
      20240101120000/    <- versioned release
      20240101130000/    <- versioned release
   current/             <- symlink to latest release

/var/www/frontend/
   releases/
      20240101120000/
   current/             <- symlink to latest release

/var/backups/
   backend/             <- tar.gz backups
   frontend/            <- tar.gz backups

/home/ec2-user/
   deploy_backend.sh
   deploy_frontend.sh
   rollback_backend.sh
```

---

## CI/CD Pipeline Stages

### 1. Checkout
- Jenkins pulls latest code from GitHub main/release branch

### 2. Build Backend (NestJS)
- `npm install` - Install dependencies
- `npm test` - Run unit tests
- `npm run build` - Compile TypeScript to dist/
- `stash` - Save artifacts for later stages

### 3. Build Frontend (React)
- `npm install` - Install dependencies
- `npm test` - Run unit tests
- `npm run build` - Create production build/
- `stash` - Save artifacts for later stages

### 4. Archive Artifacts
- dist/ and build/ folders archived in Jenkins

### 5. Deploy Backend
- `unstash` artifacts
- SCP dist/ to app server
- Run deploy_backend.sh script

### 6. Deploy Frontend
- `unstash` artifacts
- SCP build/ to app server
- Run deploy_frontend.sh script

### 7. Health Check
- Verify PM2 status after deployment

---

## Deployment Process (Automatic)

1. Developer pushes code to `main` or `release` branch
2. Jenkins detects change via Poll SCM (every 5 minutes)
3. Jenkins builds and tests both applications
4. Artifacts transferred to app server via SCP/SSH
5. New versioned release folder created
6. Dependencies installed on server
7. Symlink updated to new release
8. PM2 restarts backend
9. Nginx reloads frontend

---

## Rollback Procedure

### Method 1 - Automatic via Jenkins (Recommended)
1. Go to Jenkins: `http://JENKINS_IP:8080`
2. Click **Nestjs-React-Deploy** job
3. Click **Build with Parameters**
4. Check `ROLLBACK = true`
5. Click **Build**
Jenkins will automatically switch to previous release.

### Method 2 - Manual Rollback
SSH into app server:
```bash
ssh ec2-user@APP_SERVER_IP
bash /home/ec2-user/rollback_backend.sh
```

### How Rollback Works
- Lists all releases in /var/www/backend/releases/
- Selects second latest release (previous working version)
- Updates symlink from current to previous release
- Restarts PM2 process

---

## Monitoring

| Tool | URL | Purpose |
|------|-----|---------|
| Jenkins | http://JENKINS_IP:8080 | Build logs & pipeline status |
| Prometheus | http://APP_IP:9090 | Metrics collection |
| Grafana | http://APP_IP:3001 | Visual dashboards |
| PM2 | Terminal only | Process monitoring |

### Useful Monitoring Commands
```bash
# Backend process status
pm2 status

# Backend live logs
pm2 logs nest-app

# System resource monitoring
pm2 monit

# Check Nginx status
sudo systemctl status nginx
```

---

## Deployment Scripts

### deploy_backend.sh
- Creates timestamped release folder
- Backs up current deployment to /var/backups/
- Copies new dist/ files
- Installs production dependencies
- Updates symlink to new release
- Restarts PM2

### deploy_frontend.sh
- Creates timestamped release folder
- Backs up current frontend
- Copies new build/ files
- Updates symlink
- Reloads Nginx

### rollback_backend.sh
- Finds previous release folder
- Updates symlink to previous release
- Restarts PM2

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Jenkins console output |
| SSH connection refused | Verify security group port 22 open |
| PM2 not starting | Run `pm2 logs` for errors |
| Nginx not serving | Run `sudo nginx -t` to check config |
| Grafana not opening | Check `sudo systemctl status grafana-server` |
