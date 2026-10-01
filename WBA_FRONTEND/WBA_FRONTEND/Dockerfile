# ----------------------------------
## Frontend Multi-Stage Dockerfile
## Build Stage
# ----------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install
COPY . .

RUN npm run build

RUN test -d out

# ----------------------------------
## Production Stage
# ----------------------------------
FROM nginx:1.28-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]