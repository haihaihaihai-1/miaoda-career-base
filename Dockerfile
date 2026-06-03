# syntax=docker/dockerfile:1.7
# ============================================================================
# miaoda-career-base 多阶段构建
#   stage 1 (builder)   : 安装依赖 + 构建静态产物
#   stage 2 (runtime)   : nginx 仅暴露静态资产
# Build:   docker build --build-arg VITE_BRAND=default -t miaoda-career-base .
# Run  :   docker run --rm -p 8080:80 miaoda-career-base
# ============================================================================

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 仅复制依赖描述，最大化层缓存
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# 复制源码并构建
COPY . .
ARG VITE_BRAND=default
ARG VITE_DIFY_API_URL=
ARG VITE_DIFY_API_KEY=
ARG VITE_SUPABASE_URL=
ARG VITE_SUPABASE_ANON_KEY=
ARG VITE_EXTERNAL_RESOURCE_URL=
ENV VITE_BRAND=$VITE_BRAND \
    VITE_DIFY_API_URL=$VITE_DIFY_API_URL \
    VITE_DIFY_API_KEY=$VITE_DIFY_API_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_EXTERNAL_RESOURCE_URL=$VITE_EXTERNAL_RESOURCE_URL

RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
LABEL org.opencontainers.image.title="miaoda-career-base"
LABEL org.opencontainers.image.source="https://github.com/your-org/miaoda-career-base"

# SPA fallback 配置
RUN rm -f /etc/nginx/conf.d/default.conf
COPY <<'NGINXCONF' /etc/nginx/conf.d/app.conf
server {
    listen       80;
    server_name  _;
    root         /usr/share/nginx/html;
    index        index.html;

    # 静态资产长缓存
    location ~* \.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 健康检查
    location = /healthz {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }
}
NGINXCONF

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz | grep -q ok || exit 1

CMD ["nginx", "-g", "daemon off;"]
