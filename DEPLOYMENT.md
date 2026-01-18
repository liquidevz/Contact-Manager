# VPS Deployment Guide with PM2

## Prerequisites on VPS

1. **Node.js** (v18+)
2. **MongoDB** (running locally or remote)
3. **PM2** (install globally)

```bash
npm install -g pm2
```

## Deployment Steps

### 1. Upload Project to VPS

```bash
# Using git
git clone <your-repo-url>
cd contact-manager

# Or upload via SCP/FTP
```

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with your production values
```

**Important .env settings for production:**
- `NODE_ENV=production`
- `PORT=5000` (or your preferred port)
- `MONGODB_URI=<your-mongodb-connection-string>`
- `JWT_SECRET=<strong-random-secret>`

### 4. Start with PM2

```bash
# Start the application
npm run pm2:start

# Or directly
pm2 start ecosystem.config.js
```

### 5. Verify Running

```bash
pm2 status
pm2 logs contact-manager
```

## PM2 Commands

### Basic Operations

```bash
# Start
npm run pm2:start

# Stop
npm run pm2:stop

# Restart
npm run pm2:restart

# Reload (zero-downtime)
npm run pm2:reload

# Delete from PM2
npm run pm2:delete

# View logs
npm run pm2:logs

# Monitor
npm run pm2:monit
```

### Advanced Commands

```bash
# View specific app logs
pm2 logs contact-manager

# View only errors
pm2 logs contact-manager --err

# Clear logs
pm2 flush

# Show app info
pm2 show contact-manager

# Monitor CPU/Memory
pm2 monit
```

## Auto-Start on Server Reboot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

This ensures your app automatically starts when the VPS reboots.

## Nginx Reverse Proxy (Optional)

If you want to use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
pm2 logs contact-manager --lines 100

# Log files location
./logs/pm2-error.log
./logs/pm2-out.log
```

### Monitor Resources

```bash
pm2 monit
```

## Updating Application

```bash
# Pull latest changes
git pull

# Install new dependencies
npm install --production

# Reload app (zero-downtime)
npm run pm2:reload
```

## Troubleshooting

### App Not Starting

```bash
# Check logs
pm2 logs contact-manager --err

# Check status
pm2 status

# Restart
pm2 restart contact-manager
```

### High Memory Usage

```bash
# Check memory
pm2 monit

# App auto-restarts at 1GB (configured in ecosystem.config.js)
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :5000

# Or change PORT in .env file
```

## Security Checklist

- [ ] Set strong `JWT_SECRET` in .env
- [ ] Use `NODE_ENV=production`
- [ ] Configure firewall (allow only necessary ports)
- [ ] Use HTTPS (with Let's Encrypt + Nginx)
- [ ] Keep MongoDB secure (authentication enabled)
- [ ] Regular backups of MongoDB
- [ ] Keep Node.js and dependencies updated

## Performance Tips

1. **Cluster Mode**: Already configured in ecosystem.config.js
2. **Memory Limit**: Set to 1GB, adjust based on your VPS
3. **Log Rotation**: PM2 handles this automatically
4. **MongoDB Indexes**: Ensure proper indexes are created

## API Access

Once deployed, your API will be available at:

```
http://your-vps-ip:5000
http://your-vps-ip:5000/api-docs (Swagger UI)
```

## Support

For issues:
1. Check PM2 logs: `pm2 logs contact-manager`
2. Check MongoDB connection
3. Verify .env configuration
4. Check firewall/port settings
