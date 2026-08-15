# ---------- Étape build (Node + Vite, mode prod => .env.prod) ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# `--mode prod` charge .env.prod (VITE_API_URL)
RUN npm run build -- --mode prod

# ---------- Étape runtime (nginx statique + reverse-proxy /api) ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
